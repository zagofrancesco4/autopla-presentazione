// Disegno diretto con il renderer: nessun post-processing.
// Antialiasing nativo (MSAA del canvas), tone mapping Neutral ed esposizione del renderer.
// Interfaccia minima usata dalla presentazione e dal gemello.
export class Pipeline {
  constructor(renderer, scene, camera) {
    Object.assign(this, { renderer, scene, camera });
    this.fotogrammi = 0;                       // fotogrammi disegnati (verifica "scena ferma")
  }
  get esposizione() { return this.renderer.toneMappingExposure; }
  set esposizione(v) { this.renderer.toneMappingExposure = v; }
  setSize() { /* il canvas è dimensionato da resize() */ }
  render() {
    const r = this.renderer;
    r.setRenderTarget(null); r.render(this.scene, this.camera);
    this.fotogrammi++;
    return true;
  }
}
