const model = {
  rest: -70,
  threshold: -55,
  reset: -70,
  leak: 0.15,
  noise: 0.6,
  myelinEnabled: true,
  vm: -70,
  state: "reposo",
  history: Array(120).fill(-70),
  refractorySteps: 0,
  spikeFrames: [],
  autoTimer: null,
  axonAnimating: false,
};

const el = {
  epspInput: document.getElementById("epspInput"),
  ipspInput: document.getElementById("ipspInput"),
  epspValue: document.getElementById("epspValue"),
  ipspValue: document.getElementById("ipspValue"),
  vmValue: document.getElementById("vmValue"),
  stateValue: document.getElementById("stateValue"),
  chart: document.getElementById("vmChart"),
  stepBtn: document.getElementById("stepBtn"),
  autoBtn: document.getElementById("autoBtn"),
  resetBtn: document.getElementById("resetBtn"),
  myelinToggleBtn: document.getElementById("myelinToggleBtn"),
  axonTrack: document.getElementById("axonTrack"),
  axonPulse: document.getElementById("axonPulse"),
};

const ctx = el.chart.getContext("2d");
const AUTO_STEP_MS = 28;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNum(input) {
  return Number(input.value);
}

function updateSliderLabels() {
  el.epspValue.textContent = toNum(el.epspInput).toFixed(1);
  el.ipspValue.textContent = toNum(el.ipspInput).toFixed(1);
}

function addVmPoint(value) {
  model.history.push(value);
  if (model.history.length > 120) {
    model.history.shift();
  }
}

function setVm(value) {
  model.vm = clamp(value, -90, 40);
  addVmPoint(model.vm);
}

function fireActionPotential() {
  if (model.spikeFrames.length > 0 || model.refractorySteps > 0) {
    return;
  }
  model.state = "potencial de accion";
  model.spikeFrames = [-55, -45, -28, -8, 12, 28, 31, 22, 8, -6, -24, -45, -58, -70];
  animateAxon();
}

function updateNeuronStep() {
  const epsp = toNum(el.epspInput);
  const ipsp = toNum(el.ipspInput);
  const randomNoise = (Math.random() * 2 - 1) * model.noise;

  if (model.spikeFrames.length > 0) {
    setVm(model.spikeFrames.shift());
    if (model.spikeFrames.length === 0) {
      model.refractorySteps = 6;
      model.state = "refractario";
    }
    return;
  }

  if (model.refractorySteps > 0) {
    const relaxed = model.vm + (model.reset - model.vm) * 0.45;
    setVm(relaxed);
    model.refractorySteps -= 1;
    if (model.refractorySteps === 0) {
      model.state = "reposo";
    }
    return;
  }

  const integrated = model.vm + epsp - ipsp + randomNoise;
  const leaked = integrated + (model.rest - integrated) * model.leak;
  setVm(leaked);
  model.state = "integrando EPSP/IPSP";

  if (model.vm >= model.threshold) {
    fireActionPotential();
  }
}

function mapVmToY(vm, height) {
  const minVm = -90;
  const maxVm = 40;
  const ratio = (vm - minVm) / (maxVm - minVm);
  return height - ratio * height;
}

function drawChart() {
  const { width, height } = el.chart;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#091626";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i <= 8; i += 1) {
    const y = (height / 8) * i;
    ctx.strokeStyle = "#183149";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const thresholdY = mapVmToY(model.threshold, height);
  ctx.strokeStyle = "#ffb84d";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, thresholdY);
  ctx.lineTo(width, thresholdY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "#26d7aa";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  model.history.forEach((v, i) => {
    const x = (i / (model.history.length - 1)) * width;
    const y = mapVmToY(v, height);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();
}

function renderVmState() {
  el.vmValue.textContent = `${model.vm.toFixed(1)} mV`;
  el.stateValue.textContent = model.state;
  el.stateValue.className = "";
  if (model.state === "potencial de accion") {
    el.stateValue.classList.add("spike");
  }
}

function syncVelocityLabel() {
  if (model.myelinEnabled) {
    el.myelinToggleBtn.textContent = "Mielina activada";
    el.myelinToggleBtn.classList.add("active");
  } else {
    el.myelinToggleBtn.textContent = "Mielina desactivada";
    el.myelinToggleBtn.classList.remove("active");
  }
}

function animateAxon() {
  if (model.axonAnimating) {
    return;
  }
  model.axonAnimating = true;

  const duration = model.myelinEnabled ? 850 : 2200;
  const startX = 64;
  const endX = el.axonTrack.clientWidth - 64;
  const start = performance.now();
  el.axonPulse.style.opacity = "1";

  function frame(now) {
    const progress = clamp((now - start) / duration, 0, 1);
    const x = startX + (endX - startX) * progress;
    el.axonPulse.style.left = `${x}px`;

    if (progress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    setTimeout(() => {
      el.axonPulse.style.opacity = "0";
      el.axonPulse.style.left = `${startX}px`;
      model.axonAnimating = false;
    }, 120);
  }

  requestAnimationFrame(frame);
}

function tick() {
  updateNeuronStep();
  renderVmState();
  drawChart();
}

function resetSimulation() {
  model.vm = model.rest;
  model.state = "reposo";
  model.refractorySteps = 0;
  model.spikeFrames = [];
  model.history = Array(120).fill(model.rest);

  renderVmState();
  drawChart();
}

function bindEvents() {
  [el.epspInput, el.ipspInput].forEach((input) => {
    input.addEventListener("input", updateSliderLabels);
  });

  el.stepBtn.addEventListener("click", tick);

  el.autoBtn.addEventListener("click", () => {
    if (model.autoTimer) {
      clearInterval(model.autoTimer);
      model.autoTimer = null;
      el.autoBtn.textContent = "Auto OFF";
      return;
    }
    model.autoTimer = setInterval(tick, AUTO_STEP_MS);
    el.autoBtn.textContent = "Auto ON";
  });

  el.resetBtn.addEventListener("click", resetSimulation);
  el.myelinToggleBtn.addEventListener("click", () => {
    model.myelinEnabled = !model.myelinEnabled;
    syncVelocityLabel();
  });
}

function init() {
  bindEvents();
  updateSliderLabels();
  syncVelocityLabel();
  resetSimulation();
}

init();
