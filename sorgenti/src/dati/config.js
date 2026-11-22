// Copiato alla lettera da originale/index.html (righe indicate); modifiche solo per i moduli ES.
import * as THREE from 'three';

// righe 169-350
/* =====================================================================
   CONFIG — FONTE UNICA DELLE MISURE DEL MECCANISMO (1 unità = 1 mm)
   Riferimento: X = direzione di marcia (asse della rotaia), Y = verticale,
   Z = orizzontale verso la ringhiera (in sezione: box a sinistra, ringhiera a destra).
   Origine Y/Z = asse del tubo. Ogni geometria del meccanismo si costruisce solo da qui.
   Dopo una modifica: AUTOPLA.rebuild() (console) ricostruisce e ricontrolla tutto.
   ===================================================================== */
export const CONFIG = {
  tubo: {
    lato: 40,               // dato utente: tubo quadro (confermato)
    spessore: 2,            // dato utente
    raggioEsterno: 1,       // dato utente — IPOTESI: oltre 1,5 mm la gola delle V623 non appoggia sui fianchi
    lunghezza: 4500         // dato utente
  },
  vista: {
    inizio: 800,            // scelta di modello: X d'inizio del tratto disegnato (contiene giunzione e staffa)
    lunghezza: 600,         // dato utente: tratto di rotaia modellato
    carrello: 1210          // scelta di modello: carrello sopra la staffa (ferro a X 1210) = caso peggiore
  },
  cremagliera: {
    modulo: 1,              // dato utente
    angoloPressione: 20,    // dato utente (profilo di riferimento ISO 53)
    addendum: 1,            // standard ISO 53: 1·m
    dedendum: 1.25,         // standard ISO 53: 1,25·m
    larghezza: 15,          // dato utente
    altezza: 15,            // dato utente
    altezzaPrimitiva: 14,   // standard cremagliere 15x15 m1 (altezza − addendum) — IPOTESI: verificare datasheet
    spezzone: 1000,         // dato utente: lunghezza nominale di uno spezzone
    inizio: 0,              // IPOTESI: la prima cremagliera parte dall'inizio del tubo
    vite: 'M4',             // dato utente
    passoViti: 100,         // dato utente
    primaVite: 50,          // IPOTESI: prima vite a mezzo passo dall'estremità dello spezzone
    giocoTestaFondo: 1,     // IPOTESI: testa della vite 1 mm sotto il fondo dei denti (lamatura)
    inserto: 6              // IPOTESI: inserto filettato a rivetto M4 nella parete del tubo (filetto utile)
  },
  pignone: {
    denti: 20,              // dato utente
    larghezza: 15,          // dato utente
    foro: 5,                // dato utente
    grano: 'M3',            // dato utente
    lunghezzaGrano: 4       // IPOTESI: grano ISO 4026 M3x4 nel vano tra due denti
  },
  motore: {
    lato: 42.3,             // datasheet NEMA17 (dato utente: 42 nominale)
    lunghezza: 23,          // dato utente: NEMA17 pancake 42 x 23
    smusso: 4,              // IPOTESI: smusso a 45° sugli spigoli del corpo
    flangiaD: 22,           // datasheet NEMA17
    flangiaH: 2,            // datasheet NEMA17
    alberoD: 5,             // datasheet NEMA17
    alberoL: 24,            // IPOTESI (STEPPERONLINE pancake, codice da confermare), dalla faccia di montaggio
    piatto: 0.5,            // IPOTESI: profondità del piatto (D-cut)
    piattoL: 15,            // IPOTESI: lunghezza del piatto
    interasseFori: 31,      // datasheet NEMA17
    viteFori: 'M3',         // datasheet NEMA17
    profonditaFiletto: 4.5, // IPOTESI: profondità filetto dei fori M3 (sui pancake spesso minore)
    connettore: { larghezza: 16, altezza: 6, sporgenza: 5.8 }, // IPOTESI: connettore 6 pin tipo JST-PH sul retro
    spazioSpina: 10         // IPOTESI: spina + curvatura dei cavi dietro al motore
  },
  piastraMotore: {
    spessore: 3,            // dato utente
    larghezza: 50,          // IPOTESI
    regolazione: 1,         // IPOTESI: corsa ± delle asole verticali (mm)
    giocoFlangia: 0.5,      // IPOTESI: gioco radiale attorno alla flangia Ø22
    aletta: 18,             // IPOTESI: aletta piegata sotto il coperchio (18: teste M3 lontane da quelle del motore)
    interasseViti: 30,      // IPOTESI: due viti M3 sull'aletta
    viteAletta: 'M3'        // IPOTESI
  },
  ruote: {
    modello: 'V623ZZ',      // dato utente: prototipo con V623ZZ; alternativa '624VV' (tutto si ricostruisce, eccentrico incluso)
    catalogo: {
      V623ZZ: {             // Hilitand, annuncio Amazon.it: la ruota è il cuscinetto, niente mozzo
        diametro: 12, larghezza: 4, foro: 3,      // dato annuncio (3x12x4)
        profonditaGola: 1.4, angoloGola: 90,      // profondità: dato annuncio (Ø fondo gola 9,2); angolo: IPOTESI
        vite: 'M3',                               // dato utente
        spallamento: { d: 5, l: 1 }, distanziale: { d: 5, l: 2.5 }, // IPOTESI: appoggio solo sull'anello interno
        eccentrico: { esagono: 8, gamboD: 7.12 }, // IPOTESI
        materiale: 'acciaio al carbonio (non inox: ruggine)'        // dato annuncio
      },
      '624VV': {            // IPOTESI utente: 4x13x6, Ø fondo gola 9,0
        diametro: 13, larghezza: 6, foro: 4,
        profonditaGola: 2.0, angoloGola: 90,
        vite: 'M4',
        spallamento: { d: 6, l: 1 }, distanziale: { d: 6, l: 2.5 }, // IPOTESI
        eccentrico: { esagono: 10, gamboD: 8.5 }, // IPOTESI (foro M4 + eccentricità 0,75)
        materiale: 'IPOTESI: da verificare'
      }
    },
    get sel() { return this.catalogo[this.modello]; },
    get diametro() { return this.sel.diametro; }, get larghezza() { return this.sel.larghezza; }, get foro() { return this.sel.foro; },
    get profonditaGola() { return this.sel.profonditaGola; }, get angoloGola() { return this.sel.angoloGola; }, get vite() { return this.sel.vite; },
    get spallamento() { return this.sel.spallamento; }, get distanziale() { return this.sel.distanziale; }, get materiale() { return this.sel.materiale; },
    testa: 'bombata',       // scelta: viti ISO 7380 a testa bombata, la testa non sporge oltre la ruota
    passo: 80,              // dato utente: distanza tra stazione anteriore e posteriore
    supporto: { sezione: 10, spessore: 8, fondoDado: 1 }, // IPOTESI: blocchetto PETG a 45° con dado imprigionato
    laterale: { y: -8, mozzo: 10, fondoDado: 2 },  // IPOTESI: quota asse ruota laterale, mozzo PETG con dado imprigionato
    inferiore: { z: -12 },  // IPOTESI: ruota inferiore sotto la metà sinistra del tubo (blocchetto fuori dall'ingombro del tubo)
    // derivata (non modificare): sporgenza della ruota superiore destra oltre la faccia destra del tubo.
    // Gola con vertice sullo spigolo virtuale, asse a 45°: (raggio vertice gola + larghezza/2 + raggio esterno) / √2
    get sporgenzaSupDx() { const R = this.diametro / 2; return (R - this.profonditaGola + this.larghezza / 2 + R) / Math.SQRT2; }
  },
  eccentrico: {
    get foro() { return CONFIG.ruote.vite; },            // segue la vite delle ruote
    eccentricita: 0.75,     // dato utente — IPOTESI (regolazione totale 1,5 mm)
    get esagono() { return CONFIG.ruote.sel.eccentrico.esagono; }, // dal catalogo ruote
    lunghezza: 3,           // IPOTESI: altezza della testa esagonale
    get gamboD() { return CONFIG.ruote.sel.eccentrico.gamboD; },   // dal catalogo ruote
    gamboL: 6,              // IPOTESI: = spessore del blocchetto
    angolo: 90,             // IPOTESI: angolo di montaggio (90° = metà corsa, ruota a contatto)
    esagerazione: 10        // dato utente: spostamento disegnato x10 nella vista "Eccentrico"
  },
  box: {
    parete: 3,              // dato utente (PETG)
    gioco: 2.5,             // dato utente: gioco minimo 2–3 mm tra i componenti
    arretramentoBracci: 0   // dato utente: bracci a filo della faccia destra del tubo
  },
  morsettiere: {            // dato utente: motore passo-passo 4 fili + servo SG90 3 fili = 7 conduttori
    poli: [4, 3], nomi: ['motore', 'servo'],
    passo: 5.08, w: 7.5, h: 10   // IPOTESI: morsettiere passo 5,08
  },
  pressacavo: { d: 12, chiave: 15, testa: 6, l: 14 }, // IPOTESI: pressacavo M12 (cavo) e passaparete tubo (acqua)
  servo: {                  // dato utente: SG90 — misure datasheet tipico
    l: 22.5, w: 12.2, h: 22.7,
    alette: { l: 32.2, s: 2.5, quota: 15.9 },
    albero: { d: 4.8, h: 4, offset: 5.9 },
    scanalato: { denti: 21, dInt: 4.2 }  // IPOTESI: albero scanalato SG90 (Ø est. = albero.d)
  },
  trasmissioneServo: {      // dato utente: servo nel vano asciutto, albero di prolunga attraverso la parete con O-ring e boccola
    giunto: { d: 10, l: 10, gioco: 0.5, grano: 'M3' }, // IPOTESI: giunto scanalato SG90 → prolunga
    prolunga: { d: 4, materiale: 'inox' },             // IPOTESI
    boccola: { d: 7, flangia: 10, sFlangia: 1 },       // IPOTESI: boccola autolubrificante nella parete
    oring: { dInt: 4, corda: 1.5 },                    // IPOTESI: O-ring 4 x 1,5 NBR sul lato acqua
    ritegno: { d: 12, s: 3 },                          // IPOTESI: ghiera PETG che tiene l'O-ring
    mozzo: { d: 12, l: 10, gioco: 1 }                  // IPOTESI: mozzo del braccetto sulla prolunga
  },
  braccetto: {              // dato utente: il servo muove braccetto e ugello
    d: 9,                   // dato utente (confermato)
    lunghezza: 250,         // dato utente (confermato)
    angolo: 30,             // dato utente (confermato)
    sopra: 6,               // IPOTESI: codolo sopra il perno con il portagomma
    giocoAsola: 1           // IPOTESI: gioco del braccetto nell'asola del fondo
  },
  ugello: { dIn: 9, dOut: 17, l: 30, portagomma: { d: 6, l: 8 } }, // cono dalla presentazione — IPOTESI; tubetto acqua Ø6: dato utente
  staffe: {
    prima: 250,             // IPOTESI: prima staffa sul ferro a X 250
    passo: 480,             // IPOTESI utente: un ferro ogni 4, da confermare con la misura reale
    spessore: 3,            // IPOTESI (alluminio)
    larghezza: 30,          // IPOTESI: larghezza della gamba sul tubo
    yBasso: -20,            // IPOTESI: la gamba sul tubo copre la faccia destra dal fondo...
    yAlto: 8,               // IPOTESI: ...fino a qui (sotto la ruota superiore destra)
    vite: 'M5',             // dato utente: rivetti filettati sulla faccia destra del tubo
    rivetti: 2, interasseRivetti: 12, // IPOTESI: 2 rivetti filettati M5 affiancati
    inserto: 6,             // IPOTESI: filetto utile del rivetto filettato
    asole: { l: 9, w: 2, interasse: 60, yCentro: 0, bordo: 6, daEstremo: 6 } // dato utente: 2 asole 9x2 a 60 mm; posizione IPOTESI
  },
  fascette: { larghezza: 7.6, spessore: 1.3, testa: [10, 9, 5.5], materiale: 'inox o nylon UV' }, // larghezza dato utente; spessore e testina IPOTESI
  manicotto: { spessore: 2, lunghezza: 90, materiale: 'gomma EPDM' },   // IPOTESI utente: gomma tra staffa e ferro
  ringhiera: {
    distanza: 30,           // dato utente — IPOTESI da misurare: faccia destra del tubo → faccia dei ferri verso il tubo
    sporgenzaMontante: 12,  // dato utente: caso peggiore, montante 40 coassiale al ferro Ø16 → (40 − 16)/2
    montante: 40,           // IPOTESI
    parete: 2,              // IPOTESI
    ferro: 16,              // dalla presentazione (Ø 1,6 cm)
    passoFerri: 120,        // dalla presentazione (12 cm)
    inizioFerri: 10,        // IPOTESI: posizione del primo ferro (le staffe stanno sui ferri)
    primoMontante: 970, passoMontanti: 1440, // IPOTESI: montanti al posto di un ferro
    sopra: 150, sotto: 150  // scelta di modello: tratto disegnato sopra/sotto l'asse del tubo
  },
  iso: {                    // ISO 4762 (viti TCEI), ISO 4032 (dadi), ISO 7089 (rondelle), ISO 273 (fori passanti medi)
    M3: { d: 3, dk: 5.5, k: 3, s: 5.5, m: 2.4, rd2: 7, rh: 0.5, foro: 3.4, cava: 2.5, dkB: 5.7, kB: 1.65, cavaB: 2 },
    M4: { d: 4, dk: 7, k: 4, s: 7, m: 3.2, rd2: 9, rh: 0.8, foro: 4.5, cava: 3, dkB: 7.6, kB: 2.2, cavaB: 2.5 },
    M5: { d: 5, dk: 8.5, k: 5, s: 8, m: 4.7, rd2: 10, rh: 1, foro: 5.5, cava: 4, dkB: 9.5, kB: 2.75, cavaB: 3 }, // dkB/kB: ISO 7380 testa bombata
    lunghezze: [4, 5, 6, 8, 10, 12, 16, 20, 25, 30, 35, 40, 45, 50], // serie unificata ISO 4762 (estratto)
    sporgenza: 1            // IPOTESI: filetto minimo oltre il dado
  },
  smussi: { petg: 1, alluminio: 0.5, plastica: 0.5 }, // IPOTESI: raggio degli spigoli (stampa 3D / sbavatura)
  tolleranze: { contatto: 0.1, compenetrazione: 0.05, giocoMin: 2, giocoRinghiera: 6, ingranamento: 0.01, raggioSpigoloMax: 1.5 }, // dato utente / scelta di controllo
  animazione: { velocita: 20, min: 5, max: 80 },  // mm/s della vista "Animazione" (non misure)
  aspetto: {                // solo colori, non misure
    funzioni: { trasmissione: '#e8771c', guide: '#7a5af5', elettronica: '#1fa45a', acqua: '#2a7de1' }
  },
  render: { segmenti: 32, spigolo: 4, evolvente: 8 } // solo qualità grafica, non misure
};

// righe 357-366
/* Misure principali (cm) */
export const RAIL_Y = 75, RAIL_Z = 3, RAIL_X0 = 30, RAIL_X1 = 186;
export const PUL_Y = 81, PUL_R = 2, MOT_X = 30, IDL_X = 184;
export const WIRE_Y = 58, WIRE_Z = 4, HOSE_Y = 56.3;
export const POT_Z = 20, POTS = [70, 100, 130], GHOST_X = 160;
export const HOME = 44, PIVOT_Y = 63.3, PIVOT_Z = 7.5, ARM_L = 25, ARM_DEG = 30;
export const CLAMPS = [36, 84, 132, 180];
export const SECTION_X = 101;
export const RAIL_BAR_R = .8;     // raggio dei ferri della ringhiera disegnata (cm)
export const ML_VASO = 250;

// riga 532 (numero di anelli sul filo)
export const N_RINGS = 8;
// riga 701 (gocce)
export const DROPS = 140;

// righe 2344-2346
export const MURO = { spessore: 200, altezza: 2700, porta: { l: 1200, h: 2400, x: 1900, telaio: 70 } };   // muro di casa e portafinestra (x porta: scelta di layout)
export const SOLETTA = { spessore: 150, sbalzo: 100, goccia: { l: 10, da: 30 } };                          // soletta con gocciolatoio
export const PIANTE = { margine: 60 };   // gioco minimo tra piante e braccetto/ugello (mm)

// righe 2489-2493
// --- vasi sotto la traiettoria (posizioni del ciclo: POTS, POT_Z) con piante a foglie piatte ---
export const FORME_VASO = [
  { nome: 'terracotta', dSup: 260, dInf: 190, h: 260, colore: 0xb8643c, rough: .85, bordo: 12 },
  { nome: 'plastica', dSup: 220, dInf: 205, h: 240, colore: 0x3b4046, rough: .5, bordo: 4 },
  { nome: 'terracotta chiara', dSup: 280, dInf: 210, h: 250, colore: 0xcc8a5c, rough: .9, bordo: 10 }
];

// righe 2548-2552
// --- sfondo: cielo a gradiente, sagome lontane, nebbia leggera ---
export const CIELO = {
  giorno: { alto: new THREE.Color(0x5b95d8), orizz: new THREE.Color(0xd9e8f3), basso: new THREE.Color(0xc7d2dc), sole: new THREE.Color(0xfff3df), luce: 3.2, elev: 52, azim: -35, esp: 1.0, emi: .55, sagome: new THREE.Color(0xa9b9c9) },
  tramonto: { alto: new THREE.Color(0x2e3f6b), orizz: new THREE.Color(0xf2a56c), basso: new THREE.Color(0x8a7f86), sole: new THREE.Color(0xff9a52), luce: 2.4, elev: 11, azim: -70, esp: .95, emi: .35, sagome: new THREE.Color(0x8a7088) }
};
