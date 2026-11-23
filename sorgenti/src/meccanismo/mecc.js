// Copiato alla lettera da originale/index.html (righe indicate); modifiche solo per i moduli ES.
// MECCANISMO — gemello digitale (mm): righe 1156-2303 tranne la vista (in scene/gemello.js).
import * as THREE from 'three';
import { CSS2DObject } from '../motore/CSS2DRenderer160.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { $, ease } from '../util.js';
import { CONFIG } from '../dati/config.js';
import { applicaTexture, applicaFiletto, uvMillimetri } from '../materiali/mecc-texture.js';

// registro della vista di dettaglio (riempito da scene/gemello.js quando il chunk è caricato)
export const VISTA = { V: null, dopoBuild: null };
export function __priv() { return { REALE, root, bodies, car, D, V: VISTA.V, ST, rotor, pivot, viti }; }

export const D2R = Math.PI / 180, SQ2 = Math.SQRT2, SQ3 = Math.sqrt(3);
export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const v2 = (x, y) => new THREE.Vector2(x, y);
export const AXX = v3(1, 0, 0), AXY = v3(0, 1, 0), AXZ = v3(0, 0, 1);
export const fmt = (x, n = 2) => (Math.abs(x) < 0.5 * Math.pow(10, -n) ? 0 : x).toFixed(n).replace('.', ',');

/* ---------- materiali PBR (aspetto reale) + colore per funzione ---------- */
export const REALE = {
  alluminio: { color: 0xc9cdd2, metalness: 1, roughness: .42 },   // anodizzato satinato
  zincato: { color: 0xc6ccd4, metalness: 1, roughness: .3 },      // acciaio zincato (minuteria)
  acciaio: { color: 0xb0b5ba, metalness: 1, roughness: .28 },
  cuscinetto: { color: 0xdde1e5, metalness: 1, roughness: .14 },
  pom: { color: 0xf1f0ea, metalness: 0, roughness: .45 },
  pomNero: { color: 0x2a2c2f, metalness: 0, roughness: .5 },
  nema: { color: 0x1e2023, metalness: .45, roughness: .45 },
  petg: { color: 0xe3e8ee, metalness: 0, roughness: .28, transparent: true, opacity: .3, depthWrite: false },
  petgPieno: { color: 0xa3abb4, metalness: 0, roughness: .55 },
  verniciato: { color: 0x3b4047, metalness: .3, roughness: .6 },
  nylon: { color: 0x222427, metalness: 0, roughness: .6 },
  morsetto: { color: 0x2f8a52, metalness: 0, roughness: .5 },
  servo: { color: 0x2f6fd0, metalness: 0, roughness: .35 },
  ottone: { color: 0xc9a24a, metalness: 1, roughness: .35 },
  tubetto: { color: 0x9fd0f5, metalness: 0, roughness: .3, transparent: true, opacity: .75 },
  scuro: { color: 0x15171a, metalness: .2, roughness: .6 }
};
export const matCache = {};
export let modoFunzione = true;
export function applyMode(m) {
  const u = m.userData;
  if (modoFunzione && u.funz) { m.color.copy(u.funz); m.metalness = Math.min(u.metal, .35); m.roughness = Math.max(u.rough, .4); }
  else { m.color.copy(u.reale); m.metalness = u.metal; m.roughness = u.rough; }
}
// v3: materiale proprio di albero e boccola dell'eccentrico (stesso aspetto di acciaio/guide), con emissive nero:
// l'evidenziazione cambia solo emissiveIntensity (uniform), nessun cambio di programma
export function matEcc() {
  const k = 'acciaio|guide|ecc'; if (matCache[k]) return matCache[k];
  const b = MAT('acciaio', 'guide'), m = b.clone(); m.userData = b.userData; m.emissive = new THREE.Color(0xf5b942); m.emissiveIntensity = 0; applyMode(m); return (matCache[k] = m);
}
export function matFiletto() {
  const k = 'zincato|filetto'; if (matCache[k]) return matCache[k];
  const m = MAT('zincato').clone(); m.userData = MAT('zincato').userData; applicaFiletto(m); applyMode(m); return (matCache[k] = m);
}
export function MAT(kind, func) {
  const k = kind + '|' + (func || '');
  if (matCache[k]) return matCache[k];
  // v3: MeshStandardMaterial (nessuna feature fisica usata: stesso F0 0,04 di Physical con ior 1,5); resta Physical solo il PETG del guscio,
  // il cui clone nella scena principale riceve il clearcoat (integrazione.js)
  const r = REALE[kind], m = new (kind === 'petg' ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)(Object.assign({ side: THREE.DoubleSide, envMapIntensity: .75 }, r));
  m.userData = { reale: new THREE.Color(r.color), funz: func ? new THREE.Color(CONFIG.aspetto.funzioni[func]) : null, metal: r.metalness, rough: r.roughness, tipo: kind };
  applicaTexture(m);   // v2: micro-dettaglio come mappe (spazzolatura, tornitura, strati di stampa, grana)
  applyMode(m); return (matCache[k] = m);
}
// v2: spigoli grigio chiaro sottili e quote in ambra (sez. 11.2, studio scuro)
export const EDGE = new THREE.LineBasicMaterial({ color: 0xc8cbd0, transparent: true, opacity: .32 });
export const QMAT = new THREE.LineBasicMaterial({ color: 0xf5b942, depthTest: false, transparent: true });
const RIGHELLO = new THREE.MeshBasicMaterial({ color: 0xd6d6da });

export let D = null, root = null, car = null, rotor = null, pivot = null, hoseMesh = null, bodies = [], results = [], viti = [], armDeg = 0;
// esploso: nodo, spostamento (nello spazio del genitore), posizione di montaggio
export let EXP = [];
export function ex(nodes, v) { for (const n of nodes) if (n) EXP.push({ n, v: v.clone(), b: n.position.clone() }); return nodes; }

/* ---------- quote derivate (solo formule su CONFIG) ---------- */
export function derive() {
  const C = CONFIG, t = C.tubo, cr = C.cremagliera, pg = C.pignone, mo = C.motore, ru = C.ruote, ec = C.eccentrico,
    bx = C.box, sv = C.servo, br = C.braccetto, ri = C.ringhiera, st = C.staffe, mt = C.morsettiere, ec_ = C.eccentrico, Mv = C.iso[ru.vite], ma = C.manicotto, as = C.staffe.asole;
  const d = {};
  d.h = t.lato / 2;
  d.m = cr.modulo; d.alpha = cr.angoloPressione * D2R; d.p = Math.PI * d.m;
  d.yPitch = d.h + cr.altezzaPrimitiva;
  d.yRoot = d.yPitch - cr.dedendum * d.m; d.yTip = d.yPitch + cr.addendum * d.m; d.yRackTop = d.h + cr.altezza;
  d.hwRoot = d.p / 4 + cr.dedendum * d.m * Math.tan(d.alpha);
  d.hwTip = d.p / 4 - cr.addendum * d.m * Math.tan(d.alpha);
  d.nDenti = Math.floor(cr.spezzone / d.p + 1e-9); d.Lseg = d.nDenti * d.p;  // spezzone a passo continuo
  d.r = d.m * pg.denti / 2; d.ra = d.r + cr.addendum * d.m; d.rf = d.r - cr.dedendum * d.m; d.rb = d.r * Math.cos(d.alpha);
  d.yAxis = d.yPitch + d.r;                       // ingranamento: centro = linea primitiva + raggio primitivo
  d.mmGiro = Math.PI * d.m * pg.denti;
  d.zF = pg.larghezza / 2 - mo.alberoL;           // faccia motore: punta dell'albero a filo del pignone
  d.zMot0 = d.zF - mo.lunghezza;
  d.zConn0 = d.zMot0 - mo.connettore.sporgenza;
  d.g = bx.gioco; d.w = bx.parete;
  d.zRight = d.h - bx.arretramentoBracci;
  d.yMotBot = d.yAxis - mo.lato / 2; d.yMotTop = d.yAxis + mo.lato / 2;
  // ruote
  d.Ro = ru.diametro / 2; d.half = ru.larghezza / 2; d.Rhub = ru.foro / 2;
  d.gHalf = Math.min(d.half, ru.profonditaGola * Math.tan(ru.angoloGola / 2 * D2R));
  d.Ra = d.Ro - ru.profonditaGola;                 // raggio del vertice della gola
  d.cTop = d.h + d.Ra / SQ2;                       // vertice della gola sullo spigolo virtuale del tubo
  d.xSt = [-ru.passo / 2, ru.passo / 2];
  d.yTopWheelLow = d.cTop - (d.half + d.Ro) / SQ2;
  d.kT = ru.testa === 'bombata' ? Mv.kB : Mv.k; d.dkT = ru.testa === 'bombata' ? Mv.dkB : Mv.dk;
  d.yTopHeadLow = d.cTop - (d.half + ru.spallamento.l + d.kT + d.dkT / 2) / SQ2;
  d.yParTop = Math.min(d.yTopWheelLow, d.yTopHeadLow, d.yMotBot) - d.g;   // paratia acqua/asciutto
  d.yParBot = d.yParTop - d.w;
  d.zLat = -d.h - d.Ro; d.yLat = ru.laterale.y;
  d.ecc = ec.eccentricita; d.phi = ec.angolo * D2R;
  d.yShank = -d.h - d.Ro + d.ecc * Math.cos(d.phi);                      // all'angolo di montaggio la ruota tocca
  d.zBlk1 = -d.h - d.g; d.zBlk0 = d.zBlk1 - ec.gamboL;                   // blocchetto dell'eccentrico fuori dall'ingombro del tubo
  d.aE = d.zBlk0 - ec.lunghezza - ru.inferiore.z;                        // faccia esterna della testa esagonale (coord. assiale)
  d.Linf = stdLen(d.half + ru.spallamento.l - d.aE + Mv.rh + Mv.m + C.iso.sporgenza);
  d.zInfTip = ru.inferiore.z + d.half + ru.spallamento.l - d.Linf;        // punta della vite M3 della ruota inferiore
  d.zWet1 = Math.min(-d.h - 2 * d.Ro, d.zInfTip) - d.g; d.zWet0 = d.zWet1 - d.w; // parete del vano acqua
  d.yBotIn = Math.min(d.yShank - d.ecc - d.Ro, d.yLat - d.half - ru.spallamento.l - d.kT, d.yShank - ec_.esagono / SQ3) - d.g;
  d.distInf = (ru.inferiore.z - d.half) - d.zBlk1;               // distanziale tra ruota inferiore e blocchetto
  d.yBotOut = d.yBotIn - d.w;
  // vano acqua: SG90 con albero lungo X, braccetto che scende dall'asola nel fondo
  d.zServo = d.zWet0 - d.g - sv.w / 2;
  d.yServo0 = d.yBotIn + d.g + (sv.alette.l - sv.l) / 2;
  d.yPivot = d.yServo0 + sv.albero.offset;
  // servo nel vano asciutto (tasca sotto la paratia, aperta verso l'alto): albero lungo X → giunto → prolunga → parete con boccola e O-ring → mozzo del braccetto
  const ts = C.trasmissioneServo;
  d.xHalf = ru.passo / 2 + d.Ro + d.ecc + d.g + d.w; d.xIn = d.xHalf - d.w;
  d.xServo0 = -d.xIn + d.g;
  d.xS1 = d.xServo0 + sv.h;                                  // faccia del servo con l'albero scanalato
  d.xG0 = d.xS1 + ts.giunto.gioco; d.xG1 = d.xG0 + ts.giunto.l; d.xGs = d.xS1 + sv.albero.h;   // giunto; fine scanalato
  d.xW0 = d.xG1 + d.g; d.xW1 = d.xW0 + d.w;                  // parete vano servo / vano acqua
  d.xR1 = d.xW1 + ts.ritegno.s;                              // ghiera dell'O-ring
  d.xH0 = d.xR1 + ts.mozzo.gioco; d.xH1 = d.xH0 + ts.mozzo.l; // mozzo del braccetto
  d.xArm = (d.xH0 + d.xH1) / 2;
  d.slotOff = (d.yPivot - d.yBotOut) * Math.tan(br.angolo * D2R);
  d.slotZ0 = d.zServo - d.slotOff - br.d / 2 - br.giocoAsola; d.slotZ1 = d.zServo + br.d / 2 + br.giocoAsola;
  d.slotX0 = d.xArm - br.d / 2 - br.giocoAsola; d.slotX1 = d.xArm + br.d / 2 + br.giocoAsola;
  // parete sinistra: la più esterna tra spina del motore, servo, asola del braccetto, morsettiera
  const cand = [d.zConn0 - mo.spazioSpina, d.zServo - sv.w / 2 - d.g, d.slotZ0];
  if (d.yMotBot - d.yParTop < mt.h + d.g) cand.push(d.zMot0 - d.g - mt.w - d.g);  // morsettiere a sinistra del motore
  d.zLeftIn = Math.min(...cand); d.zLeftOut = d.zLeftIn - d.w;
  d.yTopIn = Math.max(d.yMotTop, d.yAxis + d.ra) + d.g; d.yTopOut = d.yTopIn + d.w;
  d.cutZ0 = -d.h - d.g; d.cutY0 = -d.h - d.g; d.cutY1 = d.yRackTop + d.g;
  // ringhiera e staffa
  d.zFerri = d.h + ri.distanza; d.zFerroC = d.zFerri + ri.ferro / 2;
  d.zMontante = d.zFerri - ri.sporgenzaMontante; d.zRailNear = Math.min(d.zFerri, d.zMontante);
  d.zRuotaMax = d.h + ru.sporgenzaSupDx;
  d.zEnd = d.zFerri - ma.spessore;                                 // la staffa appoggia sul manicotto del ferro
  d.zSlot = d.zEnd - as.daEstremo;                                 // asse delle asole per le fascette
  d.zTall = d.zRuotaMax + C.tolleranze.giocoRinghiera;             // oltre qui la staffa può salire sopra la ruota
  d.yTall0 = as.yCentro - as.interasse / 2 - as.l / 2 - as.bordo; d.yTall1 = as.yCentro + as.interasse / 2 + as.l / 2 + as.bordo;
  d.sbraccio = d.zEnd - d.h;
  return d;
}
export const stdLen = req => CONFIG.iso.lunghezze.find(l => l >= req - 1e-9) ?? NaN;
export const stdLenMax = max => [...CONFIG.iso.lunghezze].reverse().find(l => l <= max + 1e-9) ?? NaN;

/* ---------- primitive ---------- */
export let building = null, GC = {};
export const geoC = (k, f) => GC[k] || (GC[k] = f());
export function mesh(parent, geo, mat, id, asm, opt = {}) {
  const me = new THREE.Mesh(geo, mat); parent.add(me);
  me.castShadow = !mat.transparent; me.receiveShadow = true;
  if (id) { me.name = id; bodies.push({ id, asm: asm || id, mesh: me, mob: building === 'car', guscio: !!opt.guscio, allow: opt.allow || [], circ: opt.circ }); }
  return me;
}
export function boxGeo(sx, sy, sz, r) {
  r = Math.min(Math.max(r || 0, .3), Math.min(sx, sy, sz) / 2 - .01);   // v2: nessuno spigolo perfettamente vivo (min 0,3 mm)
  return geoC(`box${sx.toFixed(4)}|${sy.toFixed(4)}|${sz.toFixed(4)}|${r.toFixed(3)}`, () => r > .05 ? new RoundedBoxGeometry(sx, sy, sz, 2, r) : new THREE.BoxGeometry(sx, sy, sz));
}
export function boxMM(parent, x0, x1, y0, y1, z0, z1, mat, id, asm, opt = {}) {
  const me = mesh(parent, boxGeo(x1 - x0, y1 - y0, z1 - z0, opt.r), mat, id, asm, opt);
  me.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  if (opt.guscio) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0)), EDGE); e.raycast = () => {}; me.add(e); }
  return me;
}
export function orient(me, center, dir) { me.position.copy(center); me.quaternion.setFromUnitVectors(AXY, dir.clone().normalize()); return me; }
// v2: cilindro con smusso a 45° sugli spigoli, dentro l'ingombro del cilindro originale (raggio r, lunghezza len)
export function cilindroSmussato(r, len, n) {
  const c = Math.min(.5, Math.max(.2, r * .12), len * .2, r * .3);
  const g = new THREE.LatheGeometry([v2(0, -len / 2), v2(r - c, -len / 2), v2(r, -len / 2 + c), v2(r, len / 2 - c), v2(r - c, len / 2), v2(0, len / 2)], n);
  // piccoli poligoni (dadi, esagoni): facce piatte
  if (n <= 8) { const q = g.toNonIndexed(); q.computeVertexNormals(); return q; }
  return g;
}
export function cyl(parent, r, len, center, dir, mat, id, asm, opt, seg) {
  const n = seg || CONFIG.render.segmenti;
  return orient(mesh(parent, geoC(`cyl${r.toFixed(4)}|${len.toFixed(4)}|${n}`, () => cilindroSmussato(r, len, n)), mat, id, asm, opt), center, dir);
}
export function lathe(parent, prof, mat, id, asm, opt) {
  return mesh(parent, geoC('lathe' + JSON.stringify(prof), () => new THREE.LatheGeometry(prof.map(([r, a]) => v2(r, a)), CONFIG.render.segmenti)), mat, id, asm, opt);
}
// vite TCEI: base = superficie d'appoggio sotto la testa, dir = verso del gambo
export function vite(parent, asm, M, L, base, dir, allow, allowTesta, tipo) {
  const s = CONFIG.iso[M], Z = MAT('zincato'), B = tipo === 'bombata';
  const k = B ? s.kB : s.k, dk = B ? s.dkB : s.dk, c = k * .12;
  const prof = B ? [...Array(9)].map((_, i) => { const t = i / 8 * Math.PI / 2; return [dk / 2 * Math.sin(t), k / 2 - k * Math.cos(t)]; }).concat([[0, k / 2]])
    : [[0, -k / 2], [dk / 2 - c, -k / 2], [dk / 2, -k / 2 + c], [dk / 2, k / 2], [0, k / 2]];
  const head = mesh(parent, geoC('lathe' + JSON.stringify(prof), () => new THREE.LatheGeometry(prof.map(([r, a]) => v2(r, a)), CONFIG.render.segmenti)), Z, asm + '_testa', asm, { allow: allowTesta });
  orient(head, base.clone().addScaledVector(dir, -k / 2), dir);
  const cv = (B ? s.cavaB : s.cava) / SQ3, cava = new THREE.Mesh(geoC('cava' + cv, () => new THREE.CylinderGeometry(cv, cv, .3, 6)), MAT('scuro'));
  cava.position.y = -k / 2 - .1; head.add(cava);
  const sh = cyl(parent, s.d / 2, L, base.clone().addScaledVector(dir, L / 2), dir, matFiletto(), asm + '_gambo', asm, { allow });
  viti.push({ id: asm, voce: `Vite ${B ? 'testa bombata' : 'TCEI'} ${M}x${L}`, norma: B ? 'ISO 7380' : 'ISO 4762' });
  return [head, sh];
}
export function dado(parent, id, asm, M, base, dir, allow) {
  const s = CONFIG.iso[M];
  viti.push({ id, voce: `Dado ${M}`, norma: 'ISO 4032' });
  return cyl(parent, s.s / SQ3, s.m, base.clone().addScaledVector(dir, s.m / 2), dir, MAT('zincato'), id, asm, { allow }, 6);
}
export function rondella(parent, id, asm, M, base, dir) {
  const s = CONFIG.iso[M];
  viti.push({ id, voce: `Rondella ${M}`, norma: 'ISO 7089' });
  return cyl(parent, s.rd2 / 2, s.rh, base.clone().addScaledVector(dir, s.rh / 2), dir, MAT('zincato'), id, asm);
}
export function rr(w, h, r, path) {
  const s = path ? new THREE.Path() : new THREE.Shape(), x = w / 2, y = h / 2;
  if (r <= 0) { s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); s.lineTo(-x, -y); return s; }
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2, false);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, 1.5 * Math.PI, false);
  return s;
}
export function asola(cx, cy, rad, corsa) {
  const p = new THREE.Path();
  p.moveTo(cx + rad, cy - corsa); p.lineTo(cx + rad, cy + corsa); p.absarc(cx, cy + corsa, rad, 0, Math.PI, false);
  p.lineTo(cx - rad, cy - corsa); p.absarc(cx, cy - corsa, rad, Math.PI, 2 * Math.PI, false); return p;
}
export const cerchio = r => { const p = new THREE.Path(); p.absarc(0, 0, r, 0, 2 * Math.PI, false); return p; };

/* ---------- cremagliera: profilo trapezio ISO 53 ---------- */
export function rackGeo(xa, xb) {
  const cr = CONFIG.cremagliera, s = new THREE.Shape();
  s.moveTo(xa, D.h); s.lineTo(xb, D.h); s.lineTo(xb, D.yRoot);
  const j0 = Math.ceil((xa - cr.inizio) / D.p - 1e-9), j1 = Math.floor((xb - cr.inizio) / D.p + 1e-9) - 1;
  for (let j = j1; j >= j0; j--) {
    const c = cr.inizio + (j + .5) * D.p;
    s.lineTo(c + D.hwRoot, D.yRoot); s.lineTo(c + D.hwTip, D.yTip); s.lineTo(c - D.hwTip, D.yTip); s.lineTo(c - D.hwRoot, D.yRoot);
  }
  s.lineTo(xa, D.yRoot); s.lineTo(xa, D.h);
  const geo = new THREE.ExtrudeGeometry(s, { depth: cr.larghezza, bevelEnabled: false });
  geo.translate(0, 0, -cr.larghezza / 2); return geo;
}

/* ---------- pignone: profilo a evolvente ricavato da formula ---------- */
export function pinionGeo() {
  const pg = CONFIG.pignone, z = pg.denti, n = CONFIG.render.evolvente;
  const inv = a => Math.tan(a) - a;
  const beta = rho => Math.PI / (2 * z) + inv(D.alpha) - (rho > D.rb ? inv(Math.acos(D.rb / rho)) : 0);
  const P = (r, a) => v2(r * Math.cos(a), r * Math.sin(a));
  const r0 = Math.max(D.rf, D.rb), pts = [];
  for (let i = 0; i < z; i++) {
    const psi = i * 2 * Math.PI / z;
    if (D.rf < r0) pts.push(P(D.rf, psi - beta(D.rf)));
    for (let k = 0; k <= n; k++) { const rho = r0 + (D.ra - r0) * k / n; pts.push(P(rho, psi - beta(rho))); }
    const bt = beta(D.ra);
    for (let k = 1; k < 3; k++) pts.push(P(D.ra, psi - bt + 2 * bt * k / 3));
    for (let k = n; k >= 0; k--) { const rho = r0 + (D.ra - r0) * k / n; pts.push(P(rho, psi + beta(rho))); }
    if (D.rf < r0) pts.push(P(D.rf, psi + beta(D.rf)));
    const a0 = psi + beta(D.rf), a1 = psi + 2 * Math.PI / z - beta(D.rf);
    for (let k = 1; k < 4; k++) pts.push(P(D.rf, a0 + (a1 - a0) * k / 4));
  }
  const s = new THREE.Shape(pts); s.holes.push(cerchio(pg.foro / 2));
  const geo = new THREE.ExtrudeGeometry(s, { depth: pg.larghezza, bevelEnabled: false, curveSegments: CONFIG.render.segmenti });
  geo.translate(0, 0, -pg.larghezza / 2); return geo;
}
export const thetaAt = X => -Math.PI / 2 - (X - CONFIG.cremagliera.inizio) / D.r;

/* ---------- motore NEMA17 pancake: corpo smussato + etichetta ---------- */
export function motorGeo() {
  const mo = CONFIG.motore, b = CONFIG.smussi.alluminio, a = mo.lato / 2 - b, c = mo.smusso, s = new THREE.Shape();
  s.moveTo(-a + c, -a); s.lineTo(a - c, -a); s.lineTo(a, -a + c); s.lineTo(a, a - c); s.lineTo(a - c, a); s.lineTo(-a + c, a); s.lineTo(-a, a - c); s.lineTo(-a, -a + c); s.lineTo(-a + c, -a);
  const geo = new THREE.ExtrudeGeometry(s, { depth: mo.lunghezza - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 2 });
  geo.translate(0, 0, b); return geo;
}
// v2: la targhetta disegnata sul motore ("NEMA 17 …") è stata tolta (sez. 10 "nessuna scritta", 2.4)

/* ---------- ruote ---------- */
export const wheelProfile = () => [[D.Rhub, -D.half], [D.Ro, -D.half], [D.Ro, -D.gHalf], [D.Ra, 0], [D.Ro, D.gHalf], [D.Ro, D.half], [D.Rhub, D.half]];
// la ruota V623ZZ è il cuscinetto: lathe del profilo + spallamento sull'anello interno dal lato testa
export function wheelCore(grp, id, sgn, tocca) {
  const ru = CONFIG.ruote, sp = ru.spallamento;
  const w = lathe(grp, [...wheelProfile(), [D.Rhub, -D.half]], MAT('acciaio', 'guide'), id, id, { allow: tocca ? ['tubo'] : [] });
  const s1 = cyl(grp, sp.d / 2, sp.l, v3(0, -sgn * (D.half + sp.l / 2), 0), AXY, MAT('zincato'), id + '_spall', id);
  return [w, s1];
}
export function screwFrom(grp, id, L, sgn, allow) {     // vite dal lato testa (oltre lo spallamento), verso il lato supporto
  const ru = CONFIG.ruote, a0 = D.half + ru.spallamento.l;
  return vite(grp, id + '_vite', ru.vite, L, v3(0, -sgn * a0, 0), v3(0, sgn, 0), allow, [], ru.testa);
}
export function topWheel(G, S, xs, side) {
  const C = CONFIG, ru = C.ruote, Mv = ru.vite, s = C.iso[Mv], sp = ru.supporto, P = MAT('petgPieno');
  const id = `ruotaSup${side > 0 ? 'Dx' : 'Sx'}_${S}`, tag = `${side > 0 ? 'Dx' : 'Sx'}_${S}`;
  const grp = new THREE.Group(); grp.position.set(xs, D.cTop, side * D.cTop); grp.rotation.x = -side * Math.PI / 4; G.add(grp);
  const [wh, s1] = wheelCore(grp, id, +1, true);
  const aS1 = D.half + ru.distanziale.l, aB1 = aS1 + sp.spessore;
  const di = cyl(grp, ru.distanziale.d / 2, ru.distanziale.l, v3(0, (D.half + aS1) / 2, 0), AXY, MAT('zincato'), id + '_dist', id);
  boxMM(grp, -sp.sezione / 2, sp.sezione / 2, aS1, aB1, -sp.sezione / 2, sp.sezione / 2, P, 'box_bloccoSup' + tag, 'box', { r: C.smussi.petg });
  const aN0 = aB1 - sp.fondoDado - s.m;
  const nut = dado(grp, id + '_dado', id, Mv, v3(0, aN0, 0), AXY, ['box_bloccoSup', 'box_ponte']);  // dado imprigionato nel pezzo stampato
  const sc = screwFrom(grp, id, stdLen(D.half + ru.spallamento.l + aN0 + s.m + C.iso.sporgenza), +1, ['box_bloccoSup', 'box_ponte', id]);
  ex([wh], v3(0, -14, 0)); ex([s1], v3(0, -20, 0)); ex(sc, v3(0, -34, 0)); ex([di], v3(0, -7, 0)); ex([nut], v3(0, 16, 0));
  const am = (aS1 + aB1) / 2, bcY = D.cTop + am / SQ2, bcZ = side * (D.cTop - am / SQ2);
  const z0 = bcZ - sp.sezione / 2, z1 = side > 0 ? Math.min(bcZ + sp.sezione / 2, D.zRight) : bcZ + sp.sezione / 2;
  boxMM(G, xs - sp.sezione / 2, xs + sp.sezione / 2, bcY, D.yTopIn, z0, z1, P, 'box_ponte' + tag, 'box', { r: C.smussi.petg });
}
export function latWheel(G, S, xs) {
  const C = CONFIG, ru = C.ruote, Mv = ru.vite, s = C.iso[Mv], la = ru.laterale, sp = ru.spallamento, id = 'ruotaLat_' + S;
  const grp = new THREE.Group(); grp.position.set(xs, D.yLat, D.zLat); G.add(grp);
  const [wh, s1] = wheelCore(grp, id, +1, false);
  const s2 = cyl(grp, sp.d / 2, sp.l, v3(0, D.half + sp.l / 2, 0), AXY, MAT('zincato'), id + '_spall2', id);
  const a0 = D.half + sp.l, a1 = D.yParBot - D.yLat;
  cyl(grp, la.mozzo / 2, a1 - a0, v3(0, (a0 + a1) / 2, 0), AXY, MAT('petgPieno'), 'box_mozzoLat_' + S, 'box');
  const aN0 = a0 + la.fondoDado;
  const nut = dado(grp, id + '_dado', id, Mv, v3(0, aN0, 0), AXY, ['box_mozzoLat']);
  const sc = screwFrom(grp, id, stdLen(a0 + aN0 + s.m + C.iso.sporgenza), +1, ['box_mozzoLat', id]);
  ex([wh], v3(0, -14, 0)); ex([s1], v3(0, -20, 0)); ex(sc, v3(0, -34, 0)); ex([s2], v3(0, -7, 0)); ex([nut], v3(0, 16, 0));
}
export function botWheel(G, S, xs) {
  const C = CONFIG, ru = C.ruote, ec = C.eccentrico, Mv = ru.vite, s = C.iso[Mv], sp = ru.supporto, id = 'ruotaInf_' + S, zI = ru.inferiore.z;
  // boccola eccentrica: gambo nel blocchetto, testa esagonale sul lato esterno; il foro M3 è spostato di 'eccentricita'
  const eg = new THREE.Group(); eg.position.set(xs, D.yShank, 0); eg.rotation.z = D.phi; G.add(eg);
  const gb = cyl(eg, ec.gamboD / 2, ec.gamboL, v3(0, 0, (D.zBlk0 + D.zBlk1) / 2), AXZ, matEcc(), id + '_eccGambo', id, { allow: ['box_bloccoInf'] });
  const hx = cyl(eg, ec.esagono / SQ3, ec.lunghezza, v3(0, 0, D.zBlk0 - ec.lunghezza / 2), AXZ, matEcc(), id + '_ecc', id, {}, 6);
  const wg = new THREE.Group(); wg.position.set(0, -D.ecc, zI); wg.rotation.x = Math.PI / 2; eg.add(wg);
  const [wh, s1] = wheelCore(wg, id, -1, false);
  const aD1 = D.zBlk1 - zI, aE = D.zBlk0 - ec.lunghezza - zI;    // coordinate assiali (asse = +Z) relative alla ruota
  const di = cyl(wg, ru.distanziale.d / 2, -D.half - aD1, v3(0, (aD1 - D.half) / 2, 0), AXY, MAT('zincato'), id + '_dist', id, { allow: [] });
  const r2 = rondella(wg, id + '_rond2', id, Mv, v3(0, aE, 0), v3(0, -1, 0));
  const nut = dado(wg, id + '_dado', id, Mv, v3(0, aE - s.rh, 0), v3(0, -1, 0));
  const sc = screwFrom(wg, id, D.Linf, -1, ['box_bloccoInf', id]);
  boxMM(G, xs - sp.sezione / 2, xs + sp.sezione / 2, D.yBotIn, D.yShank + sp.sezione / 2, D.zBlk0, D.zBlk1, MAT('petgPieno'), 'box_bloccoInf_' + S, 'box', { r: C.smussi.petg });
  ex([wh], v3(0, 14, 0)); ex([s1], v3(0, 20, 0)); ex(sc, v3(0, 34, 0)); ex([di], v3(0, 7, 0)); ex([r2], v3(0, -16, 0)); ex([nut], v3(0, -22, 0));
  ex([gb, hx], v3(0, 0, -14));
  // traiettoria del centro ruota (cerchio, 65 punti) e corsa verticale (segmento): preallocati, nascosti; disegnati in scala ×esagerazione
  const R = ec.esagerazione * D.ecc, yc = D.yShank - R, nC = 65, pc = new Float32Array(nC * 3);
  for (let i = 0; i < nC; i++) { const a = i / (nC - 1) * 2 * Math.PI; pc[i * 3] = xs + R * Math.sin(a); pc[i * 3 + 1] = yc - R * Math.cos(a); pc[i * 3 + 2] = zI; }
  const gC = new THREE.BufferGeometry(); gC.setAttribute('position', new THREE.BufferAttribute(pc, 3)); gC.setDrawRange(0, 0);
  const cerchio = new THREE.Line(gC, QMAT); cerchio.renderOrder = 999; cerchio.visible = false; cerchio.raycast = () => { }; G.add(cerchio);
  const gS = new THREE.BufferGeometry(); gS.setAttribute('position', new THREE.BufferAttribute(new Float32Array([xs + R * 1.6, yc - R, zI, xs + R * 1.6, yc + R, zI]), 3));
  const corsa = new THREE.Line(gS, QMAT); corsa.renderOrder = 999; corsa.visible = false; corsa.raycast = () => { }; G.add(corsa);
  D.eccGroups.push({ eg, wg, cerchio, corsa, nC });
}

/* ---------- parte fissa: tubo, cremagliera, staffe, ringhiera ---------- */
export function buildFixed(G, senzaRinghiera) {
  const C = CONFIG, t = C.tubo, cr = C.cremagliera, st = C.staffe, ri = C.ringhiera, iso = C.iso, AL = MAT('alluminio');
  const x0 = C.vista.inizio, x1 = x0 + C.vista.lunghezza;
  const sh = rr(t.lato, t.lato, t.raggioEsterno), wi = t.lato - 2 * t.spessore;
  sh.holes.push(rr(wi, wi, Math.max(0, t.raggioEsterno - t.spessore), true));
  const tg = new THREE.ExtrudeGeometry(sh, { depth: x1 - x0, bevelEnabled: false, curveSegments: C.render.spigolo });
  tg.rotateY(-Math.PI / 2); tg.translate(x1, 0, 0);
  mesh(G, tg, AL, 'tubo', 'tubo');
  const xa = cr.inizio + Math.ceil((x0 - cr.inizio) / D.p - 1e-9) * D.p, xb = cr.inizio + Math.floor((x1 - cr.inizio) / D.p + 1e-9) * D.p;
  D.giunzioni = [];
  for (let k = 0; ; k++) {
    const s0 = cr.inizio + k * D.Lseg, s1 = s0 + D.Lseg;
    if (s0 >= xb) break; if (s1 <= xa) continue;
    if (s0 > xa) D.giunzioni.push(s0);
    const a = Math.max(s0, xa), b = Math.min(s1, xb);
    mesh(G, rackGeo(a, b), MAT('pom', 'trasmissione'), 'crem_' + k, 'crem_' + k);
    const sv = iso[cr.vite];
    for (let xs = s0 + cr.primaVite; xs < s1; xs += cr.passoViti) if (xs > a && xs < b) {
      const base = v3(xs, D.yRoot - cr.giocoTestaFondo - sv.k, 0);
      ex(vite(G, `viteCrem_${Math.round(xs)}`, cr.vite, stdLen(base.y - D.h + t.spessore + cr.inserto), base, v3(0, -1, 0), ['crem_', 'tubo'], ['crem_']), v3(0, 30, 0));
    }
  }
  // ringhiera: ferri tondi, montanti coassiali al posto di un ferro
  const R_ = MAT('verniciato'), ma = C.manicotto, fa = C.fascette, as = st.asole;
  const nearPost = x => { const k = Math.round((x - ri.primoMontante) / ri.passoMontanti); return Math.abs(x - (ri.primoMontante + k * ri.passoMontanti)) < 1e-6; };
  D.ferri = [];
  for (let k = Math.ceil((x0 - ri.inizioFerri) / ri.passoFerri); ri.inizioFerri + k * ri.passoFerri < x1; k++) {
    const xf = ri.inizioFerri + k * ri.passoFerri;
    if (senzaRinghiera) { D.ferri.push(xf); continue; }
    if (nearPost(xf)) {
      if (xf - ri.montante / 2 >= x0 && xf + ri.montante / 2 <= x1)
        boxMM(G, xf - ri.montante / 2, xf + ri.montante / 2, -ri.sotto, ri.sopra, D.zMontante, D.zMontante + ri.montante, R_, 'montante_' + xf, 'montante_' + xf, { r: C.smussi.alluminio });
    } else if (xf - ri.ferro / 2 >= x0 && xf + ri.ferro / 2 <= x1) {
      D.ferri.push(xf);
      cyl(G, ri.ferro / 2, ri.sopra + ri.sotto, v3(xf, (ri.sopra - ri.sotto) / 2, D.zFerroC), AXY, R_, 'ferro_' + xf, 'ferro_' + xf);
    }
  }
  // staffe a L sui ferri: rivetti filettati sul tubo, 2 fascette nelle asole, manicotto in gomma sul ferro
  const sv = iso[st.vite], yM = (st.yBasso + st.yAlto) / 2, t3 = st.spessore;
  D.staffe = [];
  for (let xb_ = st.prima; xb_ < t.lunghezza; xb_ += st.passo) {
    if (!D.ferri.includes(xb_) || xb_ + t3 / 2 - st.larghezza < x0) continue;
    D.staffe.push(xb_);
    const id = 'staffa_' + xb_, xa1 = xb_ + t3 / 2, xa0 = xa1 - st.larghezza;
    boxMM(G, xa0, xa1, st.yBasso, st.yAlto, D.h, D.h + t3, AL, id + '_A', id, { r: C.smussi.alluminio });
    boxMM(G, xb_ - t3 / 2, xb_ + t3 / 2, st.yBasso, st.yAlto, D.h + t3, D.zTall, AL, id + '_B', id, { r: C.smussi.alluminio });
    const sh2 = new THREE.Shape(); sh2.moveTo(D.zTall, D.yTall0); sh2.lineTo(D.zEnd, D.yTall0); sh2.lineTo(D.zEnd, D.yTall1); sh2.lineTo(D.zTall, D.yTall1); sh2.lineTo(D.zTall, D.yTall0);
    for (const sy of [-1, 1]) { const yc = as.yCentro + sy * as.interasse / 2, hp = new THREE.Path();
      hp.moveTo(D.zSlot - as.w / 2, yc - as.l / 2); hp.lineTo(D.zSlot + as.w / 2, yc - as.l / 2); hp.lineTo(D.zSlot + as.w / 2, yc + as.l / 2); hp.lineTo(D.zSlot - as.w / 2, yc + as.l / 2); hp.lineTo(D.zSlot - as.w / 2, yc - as.l / 2); sh2.holes.push(hp); }
    const g2 = new THREE.ExtrudeGeometry(sh2, { depth: t3, bevelEnabled: false }); g2.rotateY(-Math.PI / 2); g2.translate(xb_ + t3 / 2, 0, 0);
    mesh(G, g2, AL, id + '_C', id);
    for (let i = 0; i < st.rivetti; i++) {
      const xr = (xa0 + xa1) / 2 + (i - (st.rivetti - 1) / 2) * st.interasseRivetti, vid = `${id}_riv${i}`;
      rondella(G, vid + '_r', vid, st.vite, v3(xr, yM, D.h + t3), AXZ);
      ex(vite(G, vid, st.vite, stdLen(sv.rh + t3 + t.spessore + st.inserto), v3(xr, yM, D.h + t3 + sv.rh), v3(0, 0, -1), ['tubo', id]), v3(0, 0, 20));
    }
    const mid = 'manicotto_' + xb_, rm0 = ri.ferro / 2, rm1 = rm0 + ma.spessore, L2 = ma.lunghezza / 2;
    const mm = lathe(G, [[rm0, -L2], [rm1, -L2], [rm1, L2], [rm0, L2], [rm0, -L2]], MAT('nylon'), mid, mid, { allow: ['ferro_'] });
    mm.position.set(xb_, as.yCentro, D.zFerroC);
    for (const sy of [-1, 1]) {
      const fid = `fascetta_${xb_}_${sy > 0 ? 'a' : 'b'}`, y = as.yCentro + sy * as.interasse / 2;
      const fm = mesh(G, tieGeo(xb_, y), MAT('nylon'), fid, fid, { allow: ['manicotto_', 'ferro_', 'staffa_'] });
      const zb = D.zFerroC + ri.ferro / 2 + ma.spessore + fa.spessore;      // testina dietro il ferro, lontano dal tubo
      boxMM(G, xb_ - fa.testa[0] / 2, xb_ + fa.testa[0] / 2, y - fa.testa[1] / 2, y + fa.testa[1] / 2, zb, zb + fa.testa[2], MAT('nylon'), fid + '_testina', fid, { r: C.smussi.plastica });
    }
  }
}
// fascetta: nastro chiuso nel piano orizzontale, passa nell'asola e avvolge il manicotto del ferro
export function tieGeo(xf, y) {
  const C = CONFIG, fa = C.fascette, tb = fa.spessore, hw = fa.larghezza / 2, xo = C.staffe.spessore / 2 + tb / 2;
  const Rl = C.ringhiera.ferro / 2 + C.manicotto.spessore + tb / 2, zc = D.zFerroC, th0 = Math.asin(Math.min(1, xo / Rl));
  const P = [[-xo, D.zSlot], [xo, D.zSlot]];
  for (let i = 0; i <= 24; i++) { const th = th0 + (2 * Math.PI - 2 * th0) * i / 24; P.push([Rl * Math.sin(th), zc - Rl * Math.cos(th)]); }
  const n = P.length, pos = [], idx = [];
  for (let i = 0; i < n; i++) {
    const [ax, az] = P[(i - 1 + n) % n], [bx, bz] = P[(i + 1) % n]; let tx = bx - ax, tz = bz - az; const l = Math.hypot(tx, tz); tx /= l; tz /= l;
    const nx = tz, nz = -tx, [px, pz] = P[i];
    for (const [o, dy] of [[-1, -1], [-1, 1], [1, 1], [1, -1]]) pos.push(xf + px + nx * o * tb / 2, y + dy * hw, pz + nz * o * tb / 2);
  }
  for (let i = 0; i < n; i++) { const a = i * 4, b = ((i + 1) % n) * 4;
    for (let f = 0; f < 4; f++) { const f1 = (f + 1) % 4; idx.push(a + f, b + f, b + f1, a + f, b + f1, a + f1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/* ---------- carrello ---------- */
export function buildCarriage(G) {
  const C = CONFIG, mo = C.motore, pm = C.piastraMotore, pg = C.pignone, sv = C.servo, br = C.braccetto, ug = C.ugello, mt = C.morsettiere, pc = C.pressacavo, iso = C.iso;
  const g = D.g, w = D.w, X0 = -D.xHalf, X1 = D.xHalf, B = MAT('petg'), o = { guscio: true, r: C.smussi.petg };
  // guscio a C aperto verso destra (PETG)
  ex([boxMM(G, X0, X1, D.yBotOut, D.yTopOut, D.zLeftOut, D.zLeftIn, B, 'box_parete', 'box', o)], v3(0, 0, -45));
  ex([boxMM(G, X0, X1, D.yTopIn, D.yTopOut, D.zLeftIn, D.zRight, B, 'box_coperchio', 'box', o)], v3(0, 75, 0));
  const fl = (xa, xb, za, zb, k) => { if (xb - xa > .01 && zb - za > .01) ex([boxMM(G, xa, xb, D.yBotOut, D.yBotIn, za, zb, B, 'box_fondo' + k, 'box', o)], v3(0, -45, 0)); };
  fl(X0, D.slotX0, D.zLeftIn, D.zRight, 1); fl(D.slotX1, X1, D.zLeftIn, D.zRight, 2);
  fl(D.slotX0, D.slotX1, D.zLeftIn, D.slotZ0, 3); fl(D.slotX0, D.slotX1, D.slotZ1, D.zRight, 4);
  const par = boxMM(G, X0, X1, D.yParBot, D.yParTop, D.zWet0, D.cutZ0, B, 'box_paratia', 'box', o);
  boxMM(G, D.xW0, X1, D.yParBot, D.yParTop, D.zLeftIn, D.zWet0, B, 'box_paratiaAcqua', 'box', o);   // sopra la tasca del servo è aperta
  boxMM(G, X0, X1, D.yBotIn, D.yParBot, D.zWet0, D.zWet1, B, 'box_pareteAcqua', 'box', o);
  boxMM(G, D.xW0, D.xW1, D.yBotIn, D.yParBot, D.zLeftIn, D.zWet0, B, 'box_pareteServo', 'box', o);  // tasca asciutta | vano acqua
  for (const [k, xa] of [[0, X0], [1, X1 - w]]) {
    const n = [boxMM(G, xa, xa + w, D.cutY1, D.yTopIn, D.zLeftIn, D.zRight, B, `box_testata${k}a`, 'box', o),
      boxMM(G, xa, xa + w, D.yBotIn, D.cutY1, D.zLeftIn, D.cutZ0, B, `box_testata${k}b`, 'box', o),
      boxMM(G, xa, xa + w, D.yBotIn, D.cutY0, D.cutZ0, D.zRight, B, `box_testata${k}c`, 'box', o)];
    ex(n, v3(k ? 45 : -45, 0, 0));
  }
  // motore NEMA17 pancake
  const yA = D.yAxis, cn = mo.connettore, T = 'trasmissione', MZ = v3(0, 0, -50);
  const mb = mesh(G, motorGeo(), MAT('nema', T), 'motore_corpo', 'motore'); mb.position.set(0, yA, D.zMot0);
  // v2: nessuna targhetta sul motore (niente scritte non presenti nei dati di progetto)
  const fg = cyl(G, mo.flangiaD / 2, mo.flangiaH, v3(0, yA, D.zF + mo.flangiaH / 2), AXZ, MAT('alluminio', T), 'motore_flangia', 'motore', { allow: ['piastra'] });
  const cm = boxMM(G, -cn.larghezza / 2, cn.larghezza / 2, yA - cn.altezza / 2, yA + cn.altezza / 2, D.zConn0, D.zMot0, MAT('nylon', 'elettronica'), 'motore_connettore', 'motore', { r: C.smussi.plastica });
  ex([mb, fg, cm], MZ);
  // rotore
  rotor = new THREE.Group(); rotor.position.set(0, yA, 0); G.add(rotor); ex([rotor], MZ);
  const pn = mesh(rotor, pinionGeo(), MAT('acciaio', T), 'pignone', 'rotore', { allow: ['crem_'], circ: { r: D.ra, l: pg.larghezza } });
  const Lr = mo.alberoL - mo.piattoL, phiF = Math.PI / pg.denti;
  cyl(rotor, mo.alberoD / 2, Lr, v3(0, 0, D.zF + Lr / 2), AXZ, MAT('acciaio'), 'albero', 'rotore', { allow: ['motore_flangia', 'piastra'] });
  const ds = new THREE.Shape(), rA = mo.alberoD / 2, bA = Math.acos((rA - mo.piatto) / rA);
  ds.absarc(0, 0, rA, phiF + bA, phiF - bA + 2 * Math.PI, false); ds.closePath();
  const dg = new THREE.ExtrudeGeometry(ds, { depth: mo.piattoL, bevelEnabled: false, curveSegments: C.render.segmenti });
  dg.translate(0, 0, D.zF + Lr); mesh(rotor, dg, MAT('acciaio'), 'albero_piatto', 'rotore', { allow: ['piastra'] });
  const rG0 = rA - mo.piatto, gL = pg.lunghezzaGrano, dG = v3(Math.cos(phiF), Math.sin(phiF), 0);
  const gr = cyl(rotor, iso[pg.grano].d / 2, gL, dG.clone().multiplyScalar(rG0 + gL / 2), dG, MAT('scuro'), 'pignone_grano', 'rotore');
  viti.push({ id: 'grano', voce: `Grano ${pg.grano}x${gL}`, norma: 'ISO 4026' });
  ex([pn], v3(0, 0, 80)); ex([gr], v3(0, 0, 80).addScaledVector(dG, 10));
  rotor.rotation.z = thetaAt(C.vista.carrello);
  // piastra motore con asole verticali
  const W2 = pm.larghezza / 2, pY0 = D.h + g, pY1 = D.yTopIn - pm.spessore, a2 = mo.interasseFori / 2, sM = iso[mo.viteFori], PY = v3(0, 40, 0);
  const ps = new THREE.Shape(); ps.moveTo(-W2, pY0); ps.lineTo(W2, pY0); ps.lineTo(W2, pY1); ps.lineTo(-W2, pY1); ps.lineTo(-W2, pY0);
  ps.holes.push(asola(0, yA, mo.flangiaD / 2 + pm.giocoFlangia, pm.regolazione));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) ps.holes.push(asola(sx * a2, yA + sy * a2, sM.foro / 2, pm.regolazione));
  const pgeo = new THREE.ExtrudeGeometry(ps, { depth: pm.spessore, bevelEnabled: false, curveSegments: C.render.segmenti });
  pgeo.translate(0, 0, D.zF);
  ex([mesh(G, pgeo, MAT('alluminio', T), 'piastra', 'piastra'), boxMM(G, -W2, W2, pY1, D.yTopIn, D.zF, D.zF + pm.spessore + pm.aletta, MAT('alluminio', T), 'piastra_aletta', 'piastra', { r: C.smussi.alluminio })], PY);
  const zW = D.zF + pm.spessore, Lm = stdLenMax(sM.rh + pm.spessore + mo.profonditaFiletto);
  D.viteMotore = { L: Lm, impegno: Lm - sM.rh - pm.spessore };
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const id = `viteMotore_${sx > 0 ? 'd' : 's'}${sy > 0 ? 'a' : 'b'}`, x = sx * a2, y = yA + sy * a2;
    ex([rondella(G, id + '_r', id, mo.viteFori, v3(x, y, zW), AXZ)], v3(0, 0, 12));
    ex(vite(G, id, mo.viteFori, Lm, v3(x, y, zW + sM.rh), v3(0, 0, -1), ['piastra', 'motore_corpo']), v3(0, 0, 22));
  }
  const sA = iso[pm.viteAletta], zS = D.zF + pm.spessore + pm.aletta / 2;
  for (const sx of [-1, 1]) {
    const id = 'vitePiastra_' + (sx > 0 ? 'd' : 's'), x = sx * pm.interasseViti / 2;
    ex([rondella(G, id + '_r1', id, pm.viteAletta, v3(x, pY1, zS), v3(0, -1, 0))], v3(0, 25, 0));
    ex([rondella(G, id + '_r2', id, pm.viteAletta, v3(x, D.yTopOut, zS), AXY), dado(G, id + '_dado', id, pm.viteAletta, v3(x, D.yTopOut + sA.rh, zS), AXY)], v3(0, 95, 0));
    ex(vite(G, id, pm.viteAletta, stdLen(sA.rh + pm.spessore + w + sA.rh + sA.m + iso.sporgenza), v3(x, pY1 - sA.rh, zS), AXY, ['piastra', 'box_coperchio']), v3(0, 15, 0));
  }
  // ruote
  D.eccGroups = [];
  D.xSt.forEach((xs, i) => { const S = i ? 'B' : 'A'; topWheel(G, S, xs, 1); topWheel(G, S, xs, -1); latWheel(G, S, xs); botWheel(G, S, xs); });
  // vano asciutto: morsettiere di arrivo (motore 4 poli + servo 3 poli) e pressacavo
  const E = 'elettronica', mz0 = D.zLeftIn + g; let mx = D.xW0 + g;          // sulla paratia del vano acqua
  mt.poli.forEach((n, i) => {
    const l = n * mt.passo;
    ex([boxMM(G, mx, mx + l, D.yParTop, D.yParTop + mt.h, mz0, mz0 + mt.w, MAT('morsetto', E), 'morsettiera_' + mt.nomi[i], 'morsettiera_' + mt.nomi[i], { r: C.smussi.plastica })], v3(0, 25, 0));
    mx += l + g;
  });
  const pcY = D.yParTop + g + pc.d / 2;
  const pressa = (id, x, y, f) => {
    const n = [cyl(G, pc.d / 2, pc.l, v3(x, y, D.zLeftOut + pc.l / 2 - pc.testa), AXZ, MAT('nylon', f), id, id, { allow: ['box_parete'] }),
      cyl(G, pc.chiave / SQ3, pc.testa, v3(x, y, D.zLeftOut - pc.testa / 2), AXZ, MAT('nylon', f), id + '_dado', id, {}, 6)];
    ex(n, v3(0, 0, -70));
  };
  pressa('pressacavo', mx + pc.chiave / SQ3, pcY, E);
  // vano asciutto basso: SG90 nella tasca, telaio di supporto
  const A = 'acqua', sx0 = D.xServo0, sY0 = D.yServo0, sz = D.zServo, tb = (sv.alette.l - sv.l) / 2, SX = v3(-35, 0, 0), ts = C.trasmissioneServo;
  ex([boxMM(G, sx0, sx0 + sv.h, sY0, sY0 + sv.l, sz - sv.w / 2, sz + sv.w / 2, MAT('servo', E), 'servo_corpo', 'servo', { r: C.smussi.plastica }),
    boxMM(G, sx0 + sv.alette.quota, sx0 + sv.alette.quota + sv.alette.s, sY0 - tb, sY0 + sv.l + tb, sz - sv.w / 2, sz + sv.w / 2, MAT('servo', E), 'servo_alette', 'servo')], SX);
  const xb0 = sx0 + sv.alette.quota + sv.alette.s, Pp = MAT('petgPieno'), pr = { r: C.smussi.petg };
  boxMM(G, xb0, xb0 + w, D.yBotIn, sY0, D.zLeftIn, D.zWet0, Pp, 'box_telaioServo_b', 'box', pr);
  boxMM(G, xb0, xb0 + w, sY0 + sv.l, sY0 + sv.l + tb + w, D.zLeftIn, D.zWet0, Pp, 'box_telaioServo_a', 'box', pr);
  boxMM(G, xb0, xb0 + w, sY0, sY0 + sv.l, D.zLeftIn, sz - sv.w / 2, Pp, 'box_telaioServo_s', 'box', pr);
  boxMM(G, xb0, xb0 + w, sY0, sY0 + sv.l, sz + sv.w / 2, D.zWet0, Pp, 'box_telaioServo_d', 'box', pr);
  // tenuta nella parete: boccola con flangia (lato asciutto) e O-ring con ghiera (lato acqua)
  const bc = ts.boccola, orr = ts.oring, rg = ts.ritegno;
  ex([cyl(G, bc.d / 2, D.w, v3((D.xW0 + D.xW1) / 2, D.yPivot, sz), AXX, MAT('ottone'), 'boccola', 'tenuta', { allow: ['box_pareteServo'] }),
    cyl(G, bc.flangia / 2, bc.sFlangia, v3(D.xW0 - bc.sFlangia / 2, D.yPivot, sz), AXX, MAT('ottone'), 'boccola_flangia', 'tenuta')], v3(-15, 0, 0));
  const orm = mesh(G, geoC('oring' + orr.dInt + orr.corda, () => new THREE.TorusGeometry(orr.dInt / 2 + orr.corda / 2, orr.corda / 2, 12, 32)), MAT('nylon', A), 'oring', 'tenuta', { allow: ['box_ritegno'] });
  orm.position.set(D.xW1 + orr.corda / 2, D.yPivot, sz); orm.rotation.y = Math.PI / 2;
  const rgm = cyl(G, rg.d / 2, rg.s, v3(D.xW1 + rg.s / 2, D.yPivot, sz), AXX, MAT('petgPieno'), 'box_ritegno', 'box');
  ex([orm], v3(14, 0, 0)); ex([rgm], v3(24, 0, 0));
  // gruppo rotante (asse = albero del servo): scanalato, giunto, prolunga, mozzo, braccetto, ugello
  pivot = new THREE.Group(); pivot.position.set(D.xArm, D.yPivot, sz); G.add(pivot); ex([pivot], v3(20, -60, 0));
  const lx = x => x - D.xArm, sc = sv.scanalato, nT = sc.denti;
  const spl = new THREE.Shape();
  for (let i = 0; i < nT; i++) { const a0 = i / nT * 2 * Math.PI, st_ = 2 * Math.PI / nT;
    [[sc.dInt / 2, 0], [sv.albero.d / 2, .25], [sv.albero.d / 2, .5], [sc.dInt / 2, .75]].forEach(([r, f], j) => { const a = a0 + f * st_; (i + j ? spl.lineTo : spl.moveTo).call(spl, r * Math.cos(a), r * Math.sin(a)); }); }
  const splGeo = new THREE.ExtrudeGeometry(spl, { depth: sv.albero.h, bevelEnabled: false }); splGeo.rotateY(Math.PI / 2);
  const sm = mesh(pivot, splGeo, MAT('pom', E), 'servo_scanalato', 'servo', { allow: ['giunto'] }); sm.position.x = lx(D.xS1);
  const eng = D.xGs - D.xG0, ring = new THREE.Shape(); ring.absarc(0, 0, ts.giunto.d / 2, 0, 2 * Math.PI, false);
  const hole = new THREE.Path(); spl.getPoints().forEach((p_, i) => (i ? hole.lineTo : hole.moveTo).call(hole, p_.x, p_.y)); ring.holes.push(hole);
  const gg = new THREE.ExtrudeGeometry(ring, { depth: eng, bevelEnabled: false, curveSegments: C.render.segmenti }); gg.rotateY(Math.PI / 2);
  const gm1 = mesh(pivot, gg, MAT('alluminio', A), 'giunto_scanalato', 'braccetto'); gm1.position.x = lx(D.xG0);
  const gm2 = cyl(pivot, ts.giunto.d / 2, D.xG1 - D.xGs, v3(lx((D.xGs + D.xG1) / 2), 0, 0), AXX, MAT('alluminio', A), 'giunto_corpo', 'braccetto');
  const gsc = cyl(pivot, iso[ts.giunto.grano].d / 2, ts.giunto.d / 2, v3(lx((D.xGs + D.xG1) / 2), ts.giunto.d / 4 + ts.prolunga.d / 4, 0), AXY, MAT('scuro'), 'giunto_grano', 'braccetto');
  const pl = cyl(pivot, ts.prolunga.d / 2, D.xH1 - D.xGs, v3(lx((D.xGs + D.xH1) / 2), 0, 0), AXX, MAT('acciaio', A), 'prolunga', 'braccetto', { allow: ['boccola', 'oring', 'box_ritegno', 'box_pareteServo'] });
  const hb = cyl(pivot, ts.mozzo.d / 2, ts.mozzo.l, v3(0, 0, 0), AXX, MAT('alluminio', A), 'mozzo_braccetto', 'braccetto');
  ex([sm], v3(-20, 0, 0)); ex([gm1, gm2, gsc], v3(-8, 0, 0)); ex([pl], v3(12, 0, 0)); ex([hb], v3(30, 0, 0));
  cyl(pivot, br.d / 2, br.lunghezza + br.sopra, v3(0, (br.sopra - br.lunghezza) / 2, 0), AXY, MAT('alluminio', A), 'braccetto', 'braccetto');
  const cone = mesh(pivot, new THREE.CylinderGeometry(ug.dIn / 2, ug.dOut / 2, ug.l, C.render.segmenti), MAT('ottone', A), 'ugello', 'braccetto');
  cone.position.set(0, -br.lunghezza - ug.l / 2, 0); ex([cone], v3(0, -25, 0));
  cyl(pivot, ug.portagomma.d / 2, ug.portagomma.l, v3(br.d / 2 + ug.portagomma.l / 2, br.sopra - ug.portagomma.d / 2, 0), AXX, MAT('ottone', A), 'ugello_portagomma', 'braccetto');
  pivot.rotation.x = armDeg * D2R;
  const ppX = D.xArm + br.d / 2 + ug.portagomma.l, ppY = D.yParBot - g - pc.chiave / SQ3;
  pressa('passaTubo', ppX, ppY, A);
  const hose = new THREE.CatmullRomCurve3([v3(ppX, ppY, D.zLeftIn + pc.l - pc.testa), v3(ppX + 4, ppY - 2, sz - 4), v3(ppX + 4, D.yPivot + br.sopra, sz), v3(ppX - .5, D.yPivot + br.sopra - ug.portagomma.d / 2, sz)]);
  hoseMesh = new THREE.Mesh(new THREE.TubeGeometry(hose, 24, ug.portagomma.d / 2 + .5, 12, false), MAT('tubetto', A)); G.add(hoseMesh);
  D.parNode = par;
}

/* ---------- righello 3D 100 mm ---------- */
// righello 100 mm con tacche ogni 10 mm: sempre parallelo allo schermo (si legge in ogni vista)
export let RUL = null;
export function ruler(G) {
  const L = 100, M = RIGHELLO, g = new THREE.Group();   // v2: righello chiaro sullo sfondo grafite
  g.position.set(0, D.yTopOut + 22, D.zLeftOut); G.add(g); RUL = g;
  const m = new THREE.Mesh(new THREE.BoxGeometry(L, 1, .5), M); g.add(m);
  for (let i = 0; i <= 10; i++) { const tk = new THREE.Mesh(new THREE.BoxGeometry(.6, i % 5 ? 3 : 6, .5), M); tk.position.set(-L / 2 + i * 10, (i % 5 ? 3 : 6) / 2, 0); g.add(tk); }
  const lab = (txt, x) => { const d = document.createElement('div'); d.className = 'mlbl'; d.textContent = txt; const o = new CSS2DObject(d); o.position.set(x, 12, 0); g.add(o); };
  lab('0', -L / 2); lab('100 mm', L / 2);
}

/* ---------- controlli automatici ---------- */
export function relMatrix(o) { return new THREE.Matrix4().copy(root.matrixWorld).invert().multiply(o.matrixWorld); }
export function obbOf(b) {
  const geo = b.mesh.geometry; if (!geo.boundingBox) geo.computeBoundingBox();
  const M = relMatrix(b.mesh), bb = geo.boundingBox;
  if (b.circ) {
    const a2 = AXZ.clone().transformDirection(M), ref = Math.abs(a2.x) < .9 ? AXX : AXY;
    const a0 = ref.clone().addScaledVector(a2, -ref.dot(a2)).normalize(), a1 = v3().crossVectors(a2, a0);
    return { c: bb.getCenter(v3()).applyMatrix4(M), ax: [a0, a1, a2], ex: [b.circ.r, b.circ.r, b.circ.l / 2] };
  }
  const c = bb.getCenter(v3()).applyMatrix4(M), e = bb.getSize(v3()).multiplyScalar(.5);
  const ax = [v3(), v3(), v3()]; M.extractBasis(ax[0], ax[1], ax[2]);
  const ex = [e.x * ax[0].length(), e.y * ax[1].length(), e.z * ax[2].length()];
  ax.forEach(a => a.normalize()); return { c, ax, ex };
}
export const zMaxOf = o => o.c.z + o.ax.reduce((s, a, i) => s + Math.abs(a.z) * o.ex[i], 0);
export function sweepX(o) {
  const k = o.ax.findIndex(a => Math.abs(a.x) > .9999);
  if (k >= 0) { const ex = o.ex.slice(); ex[k] = 1e6; return { c: o.c, ax: o.ax, ex }; }
  const h = [0, 1, 2].map(j => o.ax.reduce((s, a, i) => s + Math.abs(a.getComponent(j)) * o.ex[i], 0));
  return { c: o.c, ax: [AXX, AXY, AXZ], ex: [1e6, h[1], h[2]] };
}
export function sat(A, B) {
  const axes = [...A.ax, ...B.ax];
  for (const a of A.ax) for (const b of B.ax) { const c = v3().crossVectors(a, b); if (c.lengthSq() > 1e-10) axes.push(c.normalize()); }
  const d = v3().subVectors(B.c, A.c); let min = Infinity;
  for (const L of axes) {
    const rA = A.ex[0] * Math.abs(A.ax[0].dot(L)) + A.ex[1] * Math.abs(A.ax[1].dot(L)) + A.ex[2] * Math.abs(A.ax[2].dot(L));
    const rB = B.ex[0] * Math.abs(B.ax[0].dot(L)) + B.ex[1] * Math.abs(B.ax[1].dot(L)) + B.ex[2] * Math.abs(B.ax[2].dot(L));
    min = Math.min(min, rA + rB - Math.abs(d.dot(L)));
  }
  return min;
}
export const allowed = (A, B) => A.asm === B.asm || A.allow.some(p => B.id.startsWith(p)) || B.allow.some(p => A.id.startsWith(p));
export function sdTube(z, y) {
  const t = CONFIG.tubo, r = t.raggioEsterno, b = t.lato / 2;
  const qx = Math.abs(z) - b + r, qy = Math.abs(y) - b + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}
export function wheelContact(b) {
  const M = relMatrix(b.mesh), c = v3().applyMatrix4(M), ax = AXY.clone().transformDirection(M);
  const u = v2(ax.z, ax.y).normalize(); let n = v2(-u.y, u.x); if (n.x * -c.z + n.y * -c.y < 0) n.negate();
  const prof = wheelProfile(), seg = [];
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, a0] = prof[i], [r1, a1] = prof[i + 1]; let mn = Infinity;
    for (let k = 0; k <= 400; k++) {
      const f = k / 400, a = a0 + (a1 - a0) * f, rr_ = r0 + (r1 - r0) * f;
      mn = Math.min(mn, sdTube(c.z + a * u.x + rr_ * n.x, c.y + a * u.y + rr_ * n.y));
    }
    seg.push(mn);
  }
  return { min: Math.min(...seg), seg };
}
export function interferenze() {
  root.updateMatrixWorld(true);
  const ob = bodies.map(b => ({ b, o: obbOf(b) })); let n = 0; const bad = [];
  for (let i = 0; i < ob.length; i++) for (let j = i + 1; j < ob.length; j++) {
    const A = ob[i], Bq = ob[j]; if (allowed(A.b, Bq.b)) continue; n++;
    const ov = sat(A.o, Bq.o); if (ov > CONFIG.tolleranze.compenetrazione) bad.push(`${A.b.id} ↔ ${Bq.b.id} (${fmt(ov, 2)} mm)`);
  }
  return { n, bad, ob };
}
export function sweptMin(ob, test) {
  let g = Infinity, who = '';
  const F = ob.filter(q => !q.b.mob && test(q.b.id)), Mv = ob.filter(q => q.b.mob);
  for (const f of F) for (const m of Mv) { const gap = -sat(sweepX(m.o), f.o); if (gap < g) { g = gap; who = `${m.b.id} ↔ ${f.b.id}`; } }
  return { g, who };
}
export function runChecks() {
  const C = CONFIG, tol = C.tolleranze, cr = C.cremagliera, out = [];
  const add = (gruppo, nome, ok, dett, warn) => out.push({ gruppo, nome, ok: !!ok, dett, warn: !!warn });
  root.updateMatrixWorld(true);
  // 1) ingranamento (misurato sul modello costruito)
  const pin = bodies.find(b => b.id === 'pignone'), racks = bodies.filter(b => /^crem_\d+$/.test(b.id));
  const pc = v3().applyMatrix4(relMatrix(rotor));
  const pp = pin.mesh.geometry.attributes.position; let raG = 0, rfG = Infinity;
  for (let i = 0; i < pp.count; i++) { const r = Math.hypot(pp.getX(i), pp.getY(i)); raG = Math.max(raG, r); if (r > C.pignone.foro / 2 + .01) rfG = Math.min(rfG, r); }
  const rp = racks[0].mesh.geometry.attributes.position; let yTipG = -Infinity, yRootG = Infinity;
  for (let i = 0; i < rp.count; i++) { const y = rp.getY(i); yTipG = Math.max(yTipG, y); if (y > D.h + .01) yRootG = Math.min(yRootG, y); }
  const yPitchG = yTipG - cr.addendum * D.m, cMin = .25 * D.m;
  add('Ingranamento', 'Centro pignone − linea primitiva = raggio primitivo', Math.abs(pc.y - yPitchG - D.r) <= tol.ingranamento, `${fmt(pc.y - yPitchG, 3)} mm (r = ${fmt(D.r, 3)})`);
  add('Ingranamento', 'Gioco testa pignone − fondo cremagliera', (pc.y - raG) - yRootG >= cMin - tol.ingranamento, `${fmt((pc.y - raG) - yRootG, 3)} mm (min ${fmt(cMin, 2)})`);
  add('Ingranamento', 'Gioco testa cremagliera − fondo pignone', (pc.y - rfG) - yTipG >= cMin - tol.ingranamento, `${fmt((pc.y - rfG) - yTipG, 3)} mm (min ${fmt(cMin, 2)})`);
  const fw = Math.min(C.pignone.larghezza / 2, cr.larghezza / 2) - Math.max(-C.pignone.larghezza / 2, -cr.larghezza / 2);
  add('Ingranamento', 'Larghezza di dentatura in presa', fw >= C.pignone.larghezza - tol.ingranamento, `${fmt(fw, 1)} mm su ${fmt(C.pignone.larghezza, 1)}`);
  const step = 2 * Math.PI / C.pignone.denti; let rel = ((rotor.rotation.z + Math.PI / 2) % step + step) % step; if (rel > step / 2) rel -= step;
  let dg = ((pc.x + D.r * rel - cr.inizio) % D.p + D.p) % D.p; if (dg > D.p / 2) dg -= D.p;
  add('Ingranamento', 'Fase: dente del pignone centrato nel vano', Math.abs(dg) <= tol.ingranamento, `errore ${fmt(dg, 3)} mm`);
  const eps = (Math.sqrt(D.ra * D.ra - D.rb * D.rb) - D.r * Math.sin(D.alpha) + cr.addendum * D.m / Math.sin(D.alpha)) / (D.p * Math.cos(D.alpha));
  add('Ingranamento', 'Rapporto di condotta ≥ 1,2', eps >= 1.2, `ε = ${fmt(eps, 3)}`);
  add('Ingranamento', 'Corsa per giro = π·m·z', true, `${fmt(D.mmGiro, 2)} mm/giro`);
  for (const J of D.giunzioni) {
    const pitch = (J + D.p / 2) - (J - D.p / 2);
    add('Ingranamento', `Giunzione a X = ${fmt(J, 2)}: passo continuo`, Math.abs(pitch - D.p) <= tol.ingranamento,
      `passo ${fmt(pitch, 4)} mm; spezzone = ${D.nDenti} denti = ${fmt(D.Lseg, 2)} mm (${fmt(D.Lseg - cr.spezzone, 2)} sul nominale)`);
  }
  // 2) contatto delle ruote
  for (const b of bodies.filter(b => /^ruota(SupDx|SupSx|Lat|Inf)_[AB]$/.test(b.id))) {
    const r = wheelContact(b), top = b.id.startsWith('ruotaSup');
    const val = top ? Math.max(Math.abs(r.seg[2]), Math.abs(r.seg[3])) : Math.abs(r.min);
    const nome = { SupDx: 'superiore destra', SupSx: 'superiore sinistra', Lat: 'laterale', Inf: 'inferiore (eccentrico)' }[b.id.slice(5, -2)];
    add('Ruote', `Ruota ${nome} ${b.id.slice(-1)} tocca il tubo`, val <= tol.contatto && r.min >= -tol.contatto,
      top ? `fianchi a ${fmt(r.seg[2], 3)} / ${fmt(r.seg[3], 3)} mm dalle facce` : `distanza ${fmt(r.min, 3)} mm`);
  }
  const rs = C.tubo.raggioEsterno, lc = Math.hypot(D.gHalf, C.ruote.profonditaGola) - rs;
  add('Ruote', `Spigolo del tubo R ≤ ${fmt(tol.raggioSpigoloMax, 1)} mm (appoggio della gola sui fianchi)`, true,
    rs > tol.raggioSpigoloMax ? `WARNING: R ${fmt(rs, 2)} mm — la gola non appoggia sui fianchi` : `R ${fmt(rs, 2)} mm; appoggio utile per fianco ${fmt(lc, 2)} mm`, rs > tol.raggioSpigoloMax);
  // 3) bracci
  const zMaxG = Math.max(...bodies.filter(b => b.guscio).map(b => zMaxOf(obbOf(b))));
  add('Box', 'Bracci a filo della faccia destra (nessuna sporgenza)', zMaxG - D.h <= tol.contatto, `sporgenza ${fmt(zMaxG - D.h, 2)} mm`);
  // 4) compenetrazioni: braccetto a riposo e abbassato
  const a0 = armDeg; setArm(0); const I0 = interferenze(); setArm(C.braccetto.angolo); const I1 = interferenze(); setArm(a0);
  const bad = [...new Set([...I0.bad, ...I1.bad])];
  add('Compenetrazioni', 'Nessuna compenetrazione tra parti (braccetto 0° e ' + fmt(C.braccetto.angolo, 0) + '°)', bad.length === 0,
    `${I0.n} coppie controllate` + (bad.length ? ': ' + bad.slice(0, 8).join('; ') : ''));
  // 5) corsa: staffe, viti cremagliera, ringhiera
  const ob = I0.ob;
  const sS = sweptMin(ob, id => id.startsWith('staffa'));
  add('Corsa', `Passaggio sulle staffe (gioco ≥ ${fmt(tol.giocoMin, 1)} mm)`, sS.g >= tol.giocoMin - 1e-9, `gioco minimo ${fmt(sS.g, 2)} mm (${sS.who})`);
  const sR = sweptMin(ob, id => id.startsWith('viteCrem'));
  add('Corsa', 'Nessun urto con le viti della cremagliera', sR.g >= -tol.compenetrazione, `gioco minimo ${fmt(sR.g, 2)} mm`);
  const sF = sweptMin(ob, id => /^(ferro|manicotto)/.test(id)), sM_ = sweptMin(ob, id => id.startsWith('montante'));
  const gR = Math.min(sF.g, sM_.g); D.giocoRinghiera = { ferri: sF.g, montanti: sM_.g };
  const manca = tol.giocoRinghiera - gR;
  add('Ringhiera', `Gioco ruota–ringhiera ≥ ${fmt(tol.giocoRinghiera, 0)} mm lungo la corsa (ferri e montanti)`, gR >= tol.giocoRinghiera - 1e-9,
    `ferri ${fmt(sF.g, 2)} mm, montanti ${fmt(sM_.g, 2)} mm (${(sM_.g < sF.g ? sM_ : sF).who})` + (manca > 1e-9 ? ` — MANCANO ${fmt(manca, 2)} mm: distanza ringhiera ≥ ${fmt(C.ringhiera.distanza + manca, 1)} mm` : ''));
  // fascette: mai sul tubo né sulle tracce delle ruote
  const fas = ob.filter(q => q.b.id.startsWith('fascetta')), tubo = ob.find(q => q.b.id === 'tubo');
  const gT = Math.min(...fas.map(q => -sat(q.o, tubo.o))), sFa = sweptMin(ob, id => id.startsWith('fascetta'));
  add('Fissaggio', 'Fascette lontane dal tubo', gT > tol.contatto, `distanza minima ${fmt(gT, 2)} mm`);
  add('Fissaggio', `Fascette fuori dalla corsa del carrello (gioco ≥ ${fmt(tol.giocoMin, 1)} mm)`, sFa.g >= tol.giocoMin, `gioco minimo ${fmt(sFa.g, 2)} mm (${sFa.who})`);
  const fa = C.fascette, as = C.staffe.asole;
  add('Fissaggio', 'Fascetta passa nelle asole', fa.larghezza < as.l && fa.spessore < as.w, `nastro ${fmt(fa.larghezza, 1)} x ${fmt(fa.spessore, 1)} in asola ${fmt(as.l, 0)} x ${fmt(as.w, 0)}`);
  add('Fissaggio', 'Staffe sui ferri (interasse multiplo del passo dei ferri)', D.staffe.length > 0 && Math.abs((C.staffe.passo / C.ringhiera.passoFerri) % 1) < 1e-9,
    `staffe a X ${D.staffe.join(', ')}; interasse ${fmt(C.staffe.passo, 0)} = ${fmt(C.staffe.passo / C.ringhiera.passoFerri, 2)} ferri`);
  add('Fissaggio', 'Asole dentro la parte alta della staffa', D.zSlot - as.w / 2 - D.zTall >= tol.giocoMin, `${fmt(D.zSlot - as.w / 2 - D.zTall, 2)} mm dal bordo`);
  const zRm = Math.max(...bodies.filter(b => /^ruotaSupDx_[AB]$/.test(b.id)).map(b => zMaxOf(obbOf(b))));   // solo la ruota (il riquadro della testa bombata è più largo della testa)
  add('Ringhiera', 'Sporgenza ruota sup. destra: modello = CONFIG', Math.abs(zRm - D.zRuotaMax) <= tol.contatto,
    `modello ${fmt(zRm - D.h, 2)} mm, CONFIG ${fmt(C.ruote.sporgenzaSupDx, 2)} mm`);
  const s = CONFIG.iso[CONFIG.motore.viteFori];
  add('Minuteria', 'Viti motore: impegno ≤ profondità del filetto', D.viteMotore.impegno <= CONFIG.motore.profonditaFiletto + 1e-9 && D.viteMotore.impegno >= 1.5 * s.d,
    `M3x${D.viteMotore.L}: impegno ${fmt(D.viteMotore.impegno, 1)} mm (filetto ${fmt(CONFIG.motore.profonditaFiletto, 1)}, min 1,5·d)`);
  return out;
}
export function setArm(deg) { armDeg = deg; if (pivot) { pivot.rotation.x = deg * D2R; root.updateMatrixWorld(true); } }

export function quote() {
  const q = (voce, valore, nota) => ({ voce, 'valore (mm)': +valore.toFixed(2), nota });
  const C = CONFIG;
  return [
    q('Larghezza esterna (Z)', D.zRight - D.zLeftOut, 'da parete sinistra a faccia destra del tubo'),
    q('Altezza esterna (Y)', D.yTopOut - D.yBotOut, 'da fondo a coperchio'),
    q('Lunghezza esterna (X)', 2 * D.xHalf, 'passo ruote + ruota + eccentrico + gioco + parete'),
    q('Sporgenza a sinistra del tubo', -D.h - D.zLeftOut, 'asola del braccetto inclinato + parete'),
    q('Sopra il tubo', D.yTopOut - D.h, 'motore pancake + gioco + coperchio'), q('Sotto il tubo', -D.h - D.yBotOut, 'ruota inferiore + eccentrico'),
    q('Asse motore/pignone (Y)', D.yAxis, 'linea primitiva + 10'), q('Faccia motore (Z)', D.zF, 'punta albero a filo del pignone'),
    q('Paratia (Y, faccia sup.)', D.yParTop, 'sotto la ruota superiore sinistra − gioco'),
    q('Vano acqua (larghezza Z)', D.zWet0 - D.zLeftIn, 'servo + gioco + asola'),
    q('Ruote V623ZZ: Ø / larghezza / Ø fondo gola', C.ruote.diametro, `${fmt(C.ruote.larghezza, 1)} / ${fmt(2 * D.Ra, 1)}`),
    q('Distanziale ruota inferiore', D.distInf, 'tra ruota e blocchetto dell\'eccentrico'), q('Vano acqua (altezza Y)', D.yParBot - D.yBotIn, ''),
    q('Perno braccetto (Y)', D.yPivot, 'asse dell\'albero SG90'),
    q('Asola braccetto nel fondo (lungo Z)', D.slotZ1 - D.slotZ0, `larga ${fmt(D.slotX1 - D.slotX0, 1)} mm lungo X`),
    q('Sporgenza ruota sup. destra oltre il tubo', C.ruote.sporgenzaSupDx, 'CONFIG (derivata)'),
    q('Distanza faccia destra tubo – ringhiera', C.ringhiera.distanza, 'CONFIG — IPOTESI 30, da misurare'),
    q('Gioco ruota – ferri', D.giocoRinghiera.ferri, 'lungo tutta la corsa'),
    q('Gioco ruota – montanti', D.giocoRinghiera.montanti, 'lungo tutta la corsa'),
    q('Sbraccio staffa (dalla faccia del tubo)', D.sbraccio, 'fino al manicotto sul ferro'),
    q('Staffa: altezza massima vicino al tubo (Y)', C.staffe.yAlto, `ruota sup. dx più bassa a ${fmt(D.yTopWheelLow, 2)}`),
    q('Staffa: parte alta (Y da/a)', D.yTall1 - D.yTall0, `da Z ${fmt(D.zTall, 1)}: Y ${fmt(D.yTall0, 1)} … ${fmt(D.yTall1, 1)}`),
    q('Asole fascette: asse (Z)', D.zSlot, `2 asole ${fmt(C.staffe.asole.l, 0)}x${fmt(C.staffe.asole.w, 0)} a ${fmt(C.staffe.asole.interasse, 0)} mm`),
    q('Interasse staffe', C.staffe.passo, 'IPOTESI: un ferro ogni 4')
  ];
}

export const esito = r => r.warn ? 'WARN' : r.ok ? 'PASS' : 'FAIL';
export function report() {
  const ok = results.filter(r => r.ok && !r.warn).length, nw = results.filter(r => r.warn).length;
  console.log(`%cAutopla · meccanismo: ${ok}/${results.length} controlli PASS` + (nw ? `, ${nw} WARNING` : ''), 'font-weight:bold');
  for (const r of results) console.log(`%c${esito(r)}%c [${r.gruppo}] ${r.nome} — ${r.dett}`, `font-weight:bold;color:${r.warn ? '#9a6b00' : r.ok ? '#16723a' : '#b3261e'}`, 'color:inherit');
  console.table(quote());
  const box = $('mechChecks'); if (!box) return;
  let html = '', gr = '';
  for (const r of results) {
    if (r.gruppo !== gr) { gr = r.gruppo; html += `<h3>${gr}</h3>`; }
    html += `<div class="ck ${r.warn ? 'wn' : r.ok ? 'ok' : 'ko'}"><b>${esito(r)}</b><span>${r.nome} <i>${r.dett}</i></span></div>`;
  }
  box.innerHTML = html; $('mechCk').textContent = `Controlli ${ok}/${results.length}`;
}

export function dropLabels(G) { const l = []; G.traverse(o => { if (o.isCSS2DObject) l.push(o); }); l.forEach(o => o.removeFromParent()); }
export function dispose(G) { G.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }

/* ---------- etichette con linea guida (CSS2D) ---------- */
export let LAB = null;
export function buildLabels() {
  const C = CONFIG, h = D.h, Sb = D.xSt[1], mt = C.morsettiere, ri = C.ringhiera, as = C.staffe.asole;
  const lenM = mt.poli.reduce((s, n) => s + n * mt.passo, 0) + (mt.poli.length - 1) * D.g;
  const x0 = C.vista.inizio, xS = D.staffe[0], Rl = ri.ferro / 2 + C.manicotto.spessore;
  const xM = ri.primoMontante + Math.round((x0 + C.vista.lunghezza / 2 - ri.primoMontante) / ri.passoMontanti) * ri.passoMontanti;
  const car_ = [
    ['Box PETG (C aperta a destra)', [-D.xHalf, D.yTopOut, D.zLeftOut], [-25, 40, -30]],
    ['Motore NEMA17 pancake 42×23', [0, D.yMotTop, D.zMot0 + C.motore.lunghezza / 2], [-10, 55, -45]],
    ['Piastra motore con asole', [C.piastraMotore.larghezza / 2, D.yAxis + 12, D.zF + 1.5], [25, 60, 10]],
    ['Pignone m1 z20', [0, D.yAxis + D.ra, 0], [10, 70, 30]],
    ['Ruota sup. destra V623ZZ', [Sb, D.cTop + D.Ro / SQ2, D.cTop + D.Ro / SQ2], [30, 50, 40]],
    ['Ruota sup. sinistra V623ZZ', [Sb, D.cTop + D.Ro / SQ2, -D.cTop - D.Ro / SQ2], [35, 45, -55]],
    ['Ruota laterale V623ZZ', [Sb, D.yLat, D.zLat - D.Ro], [40, 5, -70]],
    ['Ruota inferiore + eccentrico', [Sb, D.yShank - D.Ro, C.ruote.inferiore.z], [35, -50, 25]],
    ['Paratia asciutto / acqua', [-D.xHalf + 8, D.yParTop, (D.zLeftIn + D.cutZ0) / 2], [-40, 5, -60]],
    ['Morsettiere 4 + 3 poli', [-D.xIn + D.g + lenM / 2, D.yParTop + mt.h, D.zLeftIn + D.g + mt.w / 2], [-30, 35, -55]],
    ['Pressacavo', [-D.xIn + D.g + lenM + D.g + C.pressacavo.chiave / SQ3, D.yParTop + D.g + C.pressacavo.d / 2, D.zLeftOut - C.pressacavo.testa], [0, 20, -45]],
    ['Servo SG90 (vano asciutto)', [D.xServo0, D.yServo0 + C.servo.l / 2, D.zServo - C.servo.w / 2], [-45, -15, -55]],
    ['Prolunga con O-ring e boccola', [D.xW1, D.yPivot, D.zServo], [10, -40, -60]],
    ['Braccetto Ø9', [D.xArm, D.yPivot - 110, D.zServo], [-40, 0, -45]],
    ['Ugello', [D.xArm, D.yPivot - C.braccetto.lunghezza - C.ugello.l / 2, D.zServo], [30, 0, -35]]
  ];
  const fix_ = [
    ['Tubo alluminio 40×40×2', [x0 + 50, -h, -h], [0, -50, -30]],
    ['Cremagliera m1 15×15 POM', [x0 + 80, D.yRackTop, 0], [0, 45, -25]],
    ['Staffa a L (rivetti filettati)', [xS - 15, C.staffe.yAlto, h + 3], [-25, 60, 30]],
    ['Fascette 7,6 mm', [xS, as.yCentro + as.interasse / 2, D.zFerroC + Rl], [25, 35, 25]],
    ['Manicotto in gomma', [xS, as.yCentro - C.manicotto.lunghezza / 2, D.zFerroC - Rl], [30, -35, 0]],
    [`Montante (sporge ${fmt(ri.sporgenzaMontante, 0)} mm)`, [xM, 70, D.zMontante], [0, 30, -25]],
    ['Ferro Ø16', [xS + ri.passoFerri, 110, D.zFerri], [0, 20, -25]]
  ].filter(l => l[1].every(Number.isFinite));
  // etichette disegnate in 2D: posizione iniziale proiettata, poi spinte via da sovrapposizioni e pannelli
  const prim = /^(Box|Motore|Pignone|Ruota sup\. destra|Ruota inferiore|Servo|Braccetto|Tubo|Cremagliera|Staffa|Fascette|Prolunga)/;
  const host = $('mechTags'); host.innerHTML = '';
  const items = [];
  for (const [G, list] of [[car, car_], [root, fix_]]) for (const [t, a, o] of list) {
    const el = document.createElement('div'); el.className = 'mtag'; el.textContent = t; host.appendChild(el);
    items.push({ el, parent: G, a: v3(...a), l: v3(...a).add(v3(...o)), prim: prim.test(t), w: 0, h: 0 });
  }
  LAB = { items };
}
/* ---------- instancing: parti uguali (stessa geometria e materiale) in un'unica InstancedMesh ---------- */
export let INST = [];
export function makeInstances() {
  INST.forEach(i => { i.im.removeFromParent(); i.im.dispose(); }); INST = [];
  const shared = new Set(Object.values(GC)), groups = new Map();
  root.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.material.transparent || !shared.has(o.geometry)) return;
    const k = o.geometry.uuid + o.material.uuid; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o);
  });
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const im = new THREE.InstancedMesh(list[0].geometry, list[0].material, list.length);
    im.castShadow = im.receiveShadow = true; im.frustumCulled = false; root.add(im);
    list.forEach(o => { o.visible = false; });
    INST.push({ im, list });
  }
  syncInstances();
}
export function syncInstances() {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), m = new THREE.Matrix4();
  for (const { im, list } of INST) { list.forEach((o, i) => im.setMatrixAt(i, m.multiplyMatrices(inv, o.matrixWorld))); im.instanceMatrix.needsUpdate = true; }
}

export function build() {
  if (root) { dropLabels(root); if (root.parent) root.parent.remove(root); dispose(root); INST = []; }
  D = derive(); bodies = []; viti = []; EXP = [];
  Object.values(GC).forEach(g => g.dispose()); GC = {};
  root = new THREE.Group(); root.name = 'meccanismo';
  const fixed = new THREE.Group(); root.add(fixed);
  car = new THREE.Group(); car.position.x = CONFIG.vista.carrello; root.add(car);
  building = 'fix'; buildFixed(fixed);
  building = 'car'; buildCarriage(car);
  building = null; ruler(car);
  root.traverse(o => { if (o.isMesh) uvMillimetri(o.geometry); });   // v2: UV in mm per le mappe di dettaglio
  root.updateMatrixWorld(true);
  results = runChecks(); report();
  buildLabels(); makeInstances();
  ST.X = CONFIG.vista.carrello; ST.X0 = ST.X; ST.esp = ST.espT = 0; ST.ecc = ST.eccT = 0;
  if (VISTA.V) VISTA.dopoBuild();
  if (MAINO) buildMain();
  return root;
}

/* ---------- copia del meccanismo per la scena della presentazione (cm) ---------- */
// o: { lunghezza (mm), inizioFerri (mm), staffaMin (mm), xFine, y, z (cm: estremo del tubo, asse del tubo) }
export let MAINO = null, MAIN = null; const mainMats = new Map();
export function buildMain(o) {
  if (o) MAINO = o; o = MAINO; if (!o) return null;
  const C = CONFIG, keep = { D, bodies, viti, EXP, rotor, pivot, hoseMesh, car, GC, root, RUL };
  const sv = [C.vista.inizio, C.vista.lunghezza, C.vista.carrello, C.ringhiera.inizioFerri, C.ringhiera.primoMontante, C.staffe.prima];
  if (MAIN) { MAIN.root.removeFromParent(); dispose(MAIN.root); }
  try {
    C.vista.inizio = 0; C.vista.lunghezza = o.lunghezza; C.vista.carrello = o.lunghezza / 2;
    C.ringhiera.inizioFerri = o.inizioFerri; C.ringhiera.primoMontante = -1e9;
    C.staffe.prima = o.inizioFerri + Math.ceil((o.staffaMin - o.inizioFerri) / C.ringhiera.passoFerri) * C.ringhiera.passoFerri;
    D = derive(); bodies = []; viti = []; EXP = []; GC = {};
    const r = new THREE.Group(), fx = new THREE.Group(); root = r; r.add(fx);
    car = new THREE.Group(); car.position.x = C.vista.carrello; r.add(car);
    building = 'fix'; buildFixed(fx, true); building = 'car'; buildCarriage(car); building = null;
    const grp = { tubo_al: new THREE.Group(), cremagliera: new THREE.Group(), staffe: new THREE.Group() };
    [...fx.children].forEach(m => { const k = m.name === 'tubo' ? 'tubo_al' : /^(crem|viteCrem)/.test(m.name) ? 'cremagliera' : 'staffe'; grp[k].add(m); });
    Object.entries(grp).forEach(([k, g]) => { g.userData.key = k; fx.add(g); });
    car.userData.key = 'carrello';
    r.scale.setScalar(.1); r.rotation.y = Math.PI; r.position.set(o.xFine, o.y, o.z);   // mm → cm, box verso il balcone
    // la scena della presentazione non ha mappa d'ambiente: variante poco metallica dei materiali
    r.traverse(m => { if (m.isMesh) { uvMillimetri(m.geometry); const k = m.material; if (!mainMats.has(k)) { const c = k.clone(); c.userData = k.userData; if (c.metalness > .5) c.roughness = Math.max(c.roughness, .55); mainMats.set(k, c); } m.material = mainMats.get(k); } });   // v2: con l'HDRI i materiali restano quelli veri
    const d = D, cone = pivot.children.find(c => c.name === 'ugello'), pc = car.getObjectByName('pressacavo'), pt = car.getObjectByName('passaTubo');
    const M = MAIN = { root: r, car, rotor, pivot, D: d, gruppi: grp,
      update(bx, arm) {   // bx (cm) = X del braccetto sopra il vaso
        const X = Math.min(o.lunghezza - d.xHalf, Math.max(d.xHalf, (o.xFine - bx) * 10 - d.xArm));
        M.car.position.x = X; M.rotor.rotation.z = -Math.PI / 2 - (X - CONFIG.cremagliera.inizio) / d.r; M.pivot.rotation.x = arm * D2R;
      },
      tip() { M.root.updateMatrixWorld(true); return cone.localToWorld(v3(0, -CONFIG.ugello.l / 2, 0)); },
      gland(k) { M.root.updateMatrixWorld(true); return (k === 'cavo' ? pc : pt).getWorldPosition(v3()); }
    };
  } finally {
    ({ D, bodies, viti, EXP, rotor, pivot, hoseMesh, car, GC, root, RUL } = keep);
    [C.vista.inizio, C.vista.lunghezza, C.vista.carrello, C.ringhiera.inizioFerri, C.ringhiera.primoMontante, C.staffe.prima] = sv;
  }
  if (o.onBuild) o.onBuild(MAIN);
  return MAIN;
}

/* ---------- stato della vista di dettaglio ---------- */
export const ST = { anim: false, dir: 1, X: 0, X0: 0, v: CONFIG.animazione.velocita, esp: 0, espT: 0, sez: false, xCut: 0, ecc: 0, eccT: 0, etichette: true, trasp: true };

/* ---------- vista ---------- */
export function setModo(f) {
  modoFunzione = f; Object.values(matCache).forEach(applyMode);
  $('mechColor').textContent = f ? 'Colori: funzioni' : 'Colori: reali';
  $('mechLegend').classList.toggle('off', !f);
}
export function setTrasp(on) {
  ST.trasp = on; const m = MAT('petg');
  m.transparent = on; m.opacity = on ? REALE.petg.opacity : 1; m.depthWrite = !on; m.needsUpdate = true;
  root.traverse(o => { if (o.isMesh && o.material === m) { o.castShadow = !on; o.receiveShadow = !on; } });   // v2: niente macchie d'ombra sulla box trasparente
  btn('trasparenza', on);
}
export function setEtichette(on) {
  ST.etichette = on;
  btn('etichette', on);
}
export const btn = (k, on) => { const b = document.querySelector(`#mechBar [data-a="${k}"]`); if (b) b.classList.toggle('on', !!on); };
export function panel(html) { const p = $('mechPanel'); p.hidden = !html; if (html) p.innerHTML = html; $('mechLegend').style.visibility = html && innerWidth < 700 ? 'hidden' : ''; }
export function info(t) { const i = $('mechInfo'); i.hidden = !t; if (t) i.innerHTML = t; }

// Animazione: il carrello trasla e il pignone ruota di conseguenza (π·m·z mm per giro)
export function animUI() {
  const disp = ST.X - ST.X0, giri = disp / D.mmGiro;
  const c = $('mechCnt'); if (c) c.innerHTML = `<b>${fmt(disp, 1)}</b> mm · <b>${fmt(giri, 3)}</b> giri <i>(${fmt(D.mmGiro, 2)} mm/giro)</i>`;
}
export function toggleAnim() {
  if (ST.ecc > 0 || ST.eccT > 0) stopEcc(true);
  ST.anim = !ST.anim; btn('animazione', ST.anim);
  if (ST.anim) {
    const A = CONFIG.animazione;
    panel(`<div class="mrow"><span id="mechCnt"></span></div>
      <label class="mrow">Velocità <input id="mechVel" type="range" min="${A.min}" max="${A.max}" step="1" value="${ST.v}"><span id="mechVelT">${ST.v} mm/s</span></label>`);
    $('mechVel').addEventListener('input', e => { ST.v = +e.target.value; $('mechVelT').textContent = `${ST.v} mm/s`; });
    animUI();
  } else if (!ST.sez) panel(null);
}
export function setX(X) {
  ST.X = X; car.position.x = X; rotor.rotation.z = thetaAt(X);
  if (ST.sez && VISTA.V.vista && VISTA.V.vista.startsWith('sezione')) {}
}
// Esploso: separazione lungo gli assi di montaggio
export function toggleEsploso() { ST.espT = ST.espT > 0 ? 0 : 1; btn('esploso', ST.espT > 0); }
export function applyEsploso(k) { for (const e of EXP) e.n.position.copy(e.b).addScaledVector(e.v, k); hoseMesh.visible = k < .02; }
// Sezione: piano di taglio perpendicolare alla rotaia, con cursore
export function stopEcc(snap) { ST.eccT = 0; if (snap) { ST.ecc = 0; applyEcc(0); } btn('eccentrico', false); info(null); setEtichette(ST.etichette); }
export function applyEcc(k) {
  const ec = CONFIG.eccentrico, x = ec.esagerazione, phi = Math.PI * ease(k);
  matEcc().emissiveIntensity = k > 0 ? .35 * Math.min(1, k * 4) : 0;
  for (const { eg, wg, cerchio, corsa, nC } of D.eccGroups) {
    cerchio.visible = corsa.visible = k > 0;
    if (k <= 0) { eg.rotation.z = D.phi; eg.position.y = D.yShank; wg.position.y = -D.ecc; continue; }
    cerchio.geometry.setDrawRange(0, Math.max(2, Math.round(ease(k) / 2 * (nC - 1)) + 1));
    eg.rotation.z = phi; eg.position.y = D.yShank - x * D.ecc; wg.position.y = -x * D.ecc;
  }
  if (k > 0) info(`<b>Eccentrico</b> · boccola ruotata di ${fmt(phi / D2R, 0)}° · la ruota sale di <b>${fmt(D.ecc * (1 - Math.cos(phi)), 2)} mm</b> (corsa totale ${fmt(2 * D.ecc, 2)} mm)<br><span class="warnx">Spostamento disegnato esagerato ×${ec.esagerazione}</span><br>Evidenziati boccola e albero; in ambra la traiettoria del centro ruota e la corsa verticale.`);
}
