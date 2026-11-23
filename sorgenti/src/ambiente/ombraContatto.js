// Ombra di contatto (v3, punto 4): profondità ortografica 512² dal pavimento verso l'alto, blur separabile in 2 passate,
// usata come alfa di un piano appena sopra il pavimento. Ricalcolata solo su richiesta (a fine movimento della box).
// Unità della scena: cm.
import * as THREE from 'three';
import { HorizontalBlurShader } from 'three/addons/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/addons/shaders/VerticalBlurShader.js';

const RIS = 512;
export function creaOmbraContatto(renderer, scene, oggetti, { x0, x1, z0, z1, y = .15, altezza = 90, opacita = .55, blur = 2.2 }) {
  const w = x1 - x0, d = z1 - z0;
  const rt = new THREE.WebGLRenderTarget(RIS, RIS), rtB = new THREE.WebGLRenderTarget(RIS, RIS);
  rt.texture.generateMipmaps = rtB.texture.generateMipmaps = false;
  const piano = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, opacity: opacita, depthWrite: false, color: 0x000000 }));
  piano.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); piano.renderOrder = 1; piano.raycast = () => { };
  // la texture è vista dal basso: ribalto le UV in z
  piano.scale.z = -1; piano.material.side = THREE.DoubleSide;
  scene.add(piano);
  const cam = new THREE.OrthographicCamera(-w / 2, w / 2, d / 2, -d / 2, 0, altezza);
  cam.position.copy(piano.position); cam.rotation.x = Math.PI / 2;   // guarda verso l'alto
  // profondità → nero con alfa decrescente con la distanza dal pavimento
  const mDepth = new THREE.MeshDepthMaterial();
  mDepth.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );', 'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) );'); };
  mDepth.depthTest = mDepth.depthWrite = false;
  const hB = new THREE.ShaderMaterial(HorizontalBlurShader), vB = new THREE.ShaderMaterial(VerticalBlurShader);
  hB.depthTest = vB.depthTest = false;
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(Math.PI / 2)); quad.position.copy(piano.position); quad.position.y += 1; quad.visible = false; scene.add(quad);
  const scenaD = new THREE.Scene();
  function sfoca(a) {
    quad.visible = true;
    quad.material = hB; hB.uniforms.tDiffuse.value = rt.texture; hB.uniforms.h.value = a / 256;
    renderer.setRenderTarget(rtB); renderer.render(quad, cam);
    quad.material = vB; vB.uniforms.tDiffuse.value = rtB.texture; vB.uniforms.v.value = a / 256;
    renderer.setRenderTarget(rt); renderer.render(quad, cam);
    quad.visible = false;
  }
  return {
    piano,
    aggiorna() {
      const prec = renderer.getRenderTarget(), clear = renderer.getClearAlpha(), ombre = renderer.shadowMap.autoUpdate;
      renderer.shadowMap.autoUpdate = false;
      // solo gli oggetti indicati: scena temporanea con i loro nodi (ripristinati subito dopo)
      const genitori = oggetti().map(o => [o, o.parent]);
      for (const [o] of genitori) { o.updateMatrixWorld(true); scenaD.attach(o); }
      scenaD.overrideMaterial = mDepth;
      renderer.setClearAlpha(0); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scenaD, cam);
      for (const [o, p] of genitori) p.attach(o);
      sfoca(blur); sfoca(blur * .4);
      renderer.setRenderTarget(prec); renderer.setClearAlpha(clear); renderer.shadowMap.autoUpdate = ombre;
    },
    dispose() { rt.dispose(); rtB.dispose(); piano.geometry.dispose(); piano.material.dispose(); quad.geometry.dispose(); hB.dispose(); vB.dispose(); mDepth.dispose(); }
  };
}
