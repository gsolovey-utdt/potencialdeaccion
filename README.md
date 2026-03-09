# NeuroLab Interactivo (MVP)

Web app educativa basada en la clase de NyPE sobre neuronas y cerebro.

## Incluye
- Simulacion de potencial de membrana con integracion de `EPSP/IPSP`.
- Parametros internos de dinamica neuronal modelados automaticamente.
- Disparo por umbral (`todo o nada`) y periodo refractario.
- Propagacion por axon con comparacion `con mielina / sin mielina`.
- Glosario integrado de parametros: `EPSP`, `IPSP`.

## Como abrir
1. Abrir `index.html` en un navegador moderno.
2. Opcional: usar un servidor local simple para evitar restricciones del navegador:
   - `python -m http.server` (si tenes Python)
   - o extension "Live Server" en VS Code.

## Sugerencias de uso en clase
- Mostrar como cambia `Vm` al variar EPSP e IPSP.
- Activar y desactivar mielina para ver impacto en velocidad.
