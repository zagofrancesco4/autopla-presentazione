// Rim fresnel per l'evidenziazione (v3, punto 9): iniettato una volta con onBeforeCompile (+ customProgramCacheKey),
// a runtime si anima solo l'uniform condiviso RIM. Sostituisce la luce di contorno (una DirectionalLight in meno per fragment).
import * as THREE from 'three';
export const RIM = { value: 0 };
const COL = new THREE.Color(0xffffff);
export function aggiungiRim(m) {
  if (!m || m.userData.rim || !m.isMeshStandardMaterial || m.transparent) return;
  if (m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile) return;   // shader già personalizzato (foglie): lasciato com'è
  m.userData.rim = true;
  m.onBeforeCompile = sh => {
    sh.uniforms.rimK = RIM; sh.uniforms.rimCol = { value: COL };
    sh.fragmentShader = 'uniform float rimK; uniform vec3 rimCol;\n' + sh.fragmentShader.replace('#include <opaque_fragment>',
      'outgoingLight += rimCol * pow(1. - abs(dot(normalize(vViewPosition), normal)), 3.) * rimK;\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'rim1';
}
