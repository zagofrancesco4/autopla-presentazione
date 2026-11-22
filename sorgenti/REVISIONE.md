# Autopla v2 — semplificazione (22/11/2026)

## Cosa è cambiato
- Rendering su richiesta: si disegna un fotogramma solo se cambiano camera, ciclo, selezione, esploso, luce o gocce. A scena ferma: 0 fotogrammi.
- Niente post-processing: antialiasing nativo (MSAA del canvas), tone mapping Neutral del renderer, vignettatura in CSS.
- Tolti: N8AO, SMAA, bloom, profondità di campo, accumulo, risoluzione dinamica, riflesso planare, path tracer, Foto 4K, selettore Qualità.
- Dipendenze tolte: postprocessing, n8ao, three-gpu-pathtracer, three-mesh-bvh.
- Pixel ratio: pieno (fino a 2) a camera ferma, ×0,75 durante il movimento.
- Ombre (2048) ridisegnate solo quando si muove qualcosa nella scena, non per la camera.
- Sfondo: griglia tecnica grigio scuro in CSS (10/50 mm, crocette ogni 100 px) dietro un canvas trasparente: zero costo GPU. Tolti gli HDRI di cielo e il pulsante Giorno/Tramonto.
- Riflessi: RoomEnvironment procedurale (PMREM calcolata una volta, intensità 0,4). Sole: direzione e colore del giorno di CIELO, ombre 2048 sul solo balcone.
- Camera: polare max 0,45·π, azimut tra −0,35 e 1,65 rad (mai lato strada, mai dietro il muro laterale).
- Piante: edera ridisegnata compatta; ogni pianta è scalata in modo che tutti i vertici stiano dentro la parete interna del vaso (con margine per il vento). Il vento avanza solo nei fotogrammi disegnati.
- Tolta l'etichetta "Pavimento 30×30".
- Gemello: stesso rendering diretto e su richiesta.

## Invariati
CONFIG, costanti, PARTS, STEPS, testi, geometria, controlli del gemello, ciclo, `window.AUTOPLA`.

## Verifiche (Chrome headless, renderer software)
- build senza errori; console senza errori;
- `AUTOPLA.risultati` (29) e `AUTOPLA.quote` (24) identici all'originale;
- ciclo: "Ciclo completato · 750 ml";
- scena ferma: 0 fotogrammi e 0 draw call in 3 s (l'originale disegnava di continuo);
- piante: 0 vertici fuori dal vaso su 9852 (`__verifica.piante()` in console).
