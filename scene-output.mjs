import * as THREE from './assets/three.module.js';

export const AA_MODES = {
  off: {label:'关闭抗锯齿 · 最省性能', samples:0, scale:1},
  msaa2: {label:'MSAA 2× · 流畅', samples:2, scale:1},
  msaa4: {label:'MSAA 4× · 推荐', samples:4, scale:1},
  msaa8: {label:'MSAA 8× · 高质量', samples:8, scale:1},
  ssaa15: {label:'超采样 1.5× · 精细', samples:0, scale:1.5},
  ssaa2: {label:'超采样 2× · 极精细', samples:0, scale:2}
};

// Render at a bounded internal resolution; present/capture at the exact output size.
// Tone mapping and sRGB conversion occur once, on the final fullscreen pass.
export class SceneOutput {
  constructor(renderer) {
    this.renderer=renderer;
    const gl=renderer.getContext();
    this.hdr=!!gl.getExtension('EXT_color_buffer_float');
    this.supportedSamples=Array.from(gl.getInternalformatParameter(gl.RENDERBUFFER,
      this.hdr?gl.RGBA16F:gl.RGBA8, gl.SAMPLES)||[]);
    this.target=new THREE.WebGLRenderTarget(1,1,{type:this.hdr?THREE.HalfFloatType:THREE.UnsignedByteType,depthBuffer:true});
    this.material=new THREE.ShaderMaterial({
      uniforms:{image:{value:this.target.texture}}, depthTest:false, depthWrite:false,
      vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
      fragmentShader:`uniform sampler2D image; varying vec2 vUv;
      void main(){gl_FragColor=texture2D(image,vUv);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`
    });
    this.scene=new THREE.Scene();
    this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material);
    this.mesh.frustumCulled=false;this.scene.add(this.mesh);
    this.camera=new THREE.Camera();this.scale=1;this.samples=0;
  }
  configure(width,height,quality,mode,limit=Infinity) {
    const aa=AA_MODES[mode]||AA_MODES.msaa4;
    const max=this.renderer.capabilities.maxTextureSize;
    this.scale=Math.max(0.1,Math.min(quality*aa.scale,limit,2,
      Math.sqrt(8294400/(width*height)),max/width,max/height));
    const samples=Math.max(0,...this.supportedSamples.filter(n=>n<=aa.samples));
    if(this.target.samples!==samples){this.target.dispose();this.target.samples=samples;}
    this.samples=samples;
    this.target.setSize(Math.round(width*this.scale),Math.round(height*this.scale));
    if(this.renderer.domElement.width!==width||this.renderer.domElement.height!==height){
      this.renderer.setPixelRatio(1);this.renderer.setSize(width,height,false);
    }
  }
  render(scene,camera) {
    const r=this.renderer;
    r.shadowMap.needsUpdate=true;
    r.setRenderTarget(this.target);
    try {r.render(scene,camera);} finally {r.setRenderTarget(null);}
    r.render(this.scene,this.camera);
  }
}
