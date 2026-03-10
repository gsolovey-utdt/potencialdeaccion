# Simulador de potencial de accion (MVP)

Web app educativa basada en la clase de NyPE sobre neuronas y cerebro.

## Incluye
- Simulacion de potencial de membrana con integracion de `input despolarizante` e `input hiperpolarizante`.
- Parametros internos de dinamica neuronal modelados automaticamente.
- Disparo por umbral (`todo o nada`) y periodo refractario.
- Propagacion por axon con comparacion `con mielina / sin mielina`.
- Selector de velocidad `despacio / rapido`.
- Glosario integrado de parametros.
- Actividades con escenarios precargados.

## Como abrir
1. Abrir `index.html` en un navegador moderno.
2. Opcional: usar un servidor local simple para evitar restricciones del navegador:
   - `python -m http.server` (si tenes Python)
   - o extension "Live Server" en VS Code.

## Sugerencias de uso en clase
- Mostrar como cambia `Vm` al variar inputs despolarizantes e hiperpolarizantes.
- Activar y desactivar mielina para ver impacto en velocidad.
