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
  fastMode: false,
  axonAnimating: false,
};

const el = {
  depolInput: document.getElementById("depolInput"),
  hyperInput: document.getElementById("hyperInput"),
  depolValue: document.getElementById("depolValue"),
  hyperValue: document.getElementById("hyperValue"),
  vmValue: document.getElementById("vmValue"),
  stateValue: document.getElementById("stateValue"),
  chart: document.getElementById("vmChart"),
  speedSwitch: document.getElementById("speedSwitch"),
  resetBtn: document.getElementById("resetBtn"),
  myelinSwitch: document.getElementById("myelinSwitch"),
  presetNoSpikeBtn: document.getElementById("presetNoSpikeBtn"),
  presetSpikeBtn: document.getElementById("presetSpikeBtn"),
  axonTrack: document.getElementById("axonTrack"),
  axonPulse: document.getElementById("axonPulse"),
};

const ctx = el.chart.getContext("2d");
const FAST_STEP_MS = 28;
const SLOW_STEP_MS = 900;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toNum(input) {
  return Number(input.value);
}

function updateSliderLabels() {
  el.depolValue.textContent = toNum(el.depolInput).toFixed(1);
  el.hyperValue.textContent = toNum(el.hyperInput).toFixed(1);
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
  model.state = "potencial de acci\u00f3n";
  model.spikeFrames = [-55, -45, -28, -8, 12, 28, 31, 22, 8, -6, -24, -45, -58, -70];
  animateAxon();
}

function updateNeuronStep() {
  const depolInput = toNum(el.depolInput);
  const hyperInput = toNum(el.hyperInput);
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

  const integrated = model.vm + depolInput - hyperInput + randomNoise;
  const leaked = integrated + (model.rest - integrated) * model.leak;
  setVm(leaked);
  model.state = "integrando inputs";

  if (model.vm >= model.threshold) {
    fireActionPotential();
  }
}

function mapVmToY(vm, top, height) {
  const minVm = -90;
  const maxVm = 40;
  const ratio = (vm - minVm) / (maxVm - minVm);
  return top + height - ratio * height;
}

function drawChart() {
  const { width, height } = el.chart;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#091626";
  ctx.fillRect(0, 0, width, height);

  const plot = {
    left: 54,
    right: 12,
    top: 10,
    bottom: 34,
  };
  const plotWidth = width - plot.left - plot.right;
  const plotHeight = height - plot.top - plot.bottom;

  ctx.strokeStyle = "#2a4a62";
  ctx.lineWidth = 1;
  ctx.strokeRect(plot.left, plot.top, plotWidth, plotHeight);

  for (let i = 0; i <= 8; i += 1) {
    const y = plot.top + (plotHeight / 8) * i;
    ctx.strokeStyle = "#183149";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plot.left, y);
    ctx.lineTo(plot.left + plotWidth, y);
    ctx.stroke();
  }

  const thresholdY = mapVmToY(model.threshold, plot.top, plotHeight);
  ctx.strokeStyle = "#ffb84d";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(plot.left, thresholdY);
  ctx.lineTo(plot.left + plotWidth, thresholdY);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "#26d7aa";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  model.history.forEach((v, i) => {
    const x = plot.left + (i / (model.history.length - 1)) * plotWidth;
    const y = mapVmToY(v, plot.top, plotHeight);
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  ctx.fillStyle = "#c2d4ee";
  ctx.font = '12px "Space Grotesk", "Trebuchet MS", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText("tiempo (ms)", plot.left + plotWidth / 2, height - 8);

  ctx.save();
  ctx.translate(16, plot.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("Vm (mV)", 0, 0);
  ctx.restore();
}

function renderVmState() {
  el.vmValue.textContent = `${model.vm.toFixed(1)} mV`;
  el.stateValue.textContent = model.state;
  el.stateValue.className = "";
  if (model.state === "potencial de acci\u00f3n") {
    el.stateValue.classList.add("spike");
  }
}

function syncMyelinSwitch() {
  el.myelinSwitch.checked = model.myelinEnabled;
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

function applyPreset(depolInput, hyperInput) {
  el.depolInput.value = depolInput.toFixed(1);
  el.hyperInput.value = hyperInput.toFixed(1);
  updateSliderLabels();
  resetSimulation();
}

function restartSimulationLoop() {
  if (model.autoTimer) {
    clearInterval(model.autoTimer);
  }
  const intervalMs = model.fastMode ? FAST_STEP_MS : SLOW_STEP_MS;
  model.autoTimer = setInterval(tick, intervalMs);
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
  [el.depolInput, el.hyperInput].forEach((input) => {
    input.addEventListener("input", updateSliderLabels);
  });

  el.speedSwitch.addEventListener("change", () => {
    model.fastMode = el.speedSwitch.checked;
    restartSimulationLoop();
  });

  el.resetBtn.addEventListener("click", resetSimulation);
  el.myelinSwitch.addEventListener("change", () => {
    model.myelinEnabled = el.myelinSwitch.checked;
  });

  if (el.presetNoSpikeBtn) {
    el.presetNoSpikeBtn.addEventListener("click", () => {
      applyPreset(2.5, 1.3);
    });
  }

  if (el.presetSpikeBtn) {
    el.presetSpikeBtn.addEventListener("click", () => {
      applyPreset(5.0, 0.4);
    });
  }
}

function init() {
  bindEvents();
  updateSliderLabels();
  el.speedSwitch.checked = model.fastMode;
  syncMyelinSwitch();
  resetSimulation();
  restartSimulationLoop();
}

init();
