/* GradientWaves native port — ShadcnSpace, MIT. See components-NOTICE.txt.
 * GLSL wave/raymarch equations follow the author's Feature 28 source.
 * Native renderer adds lazy init, bounded resolution, 30fps and live reduced motion.
 */
(()=>{
 const host=document.querySelector('[data-gradient-waves]');if(!host)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const compact=matchMedia('(max-width:720px)');
 const vertex=`#version 300 es
 in vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}`;
 const fragment=`#version 300 es
 precision highp float;
 uniform vec2 iResolution;
 uniform float iTime;
 uniform vec3 uHorizonColor,uWaveColor,uCrestColor;
 out vec4 fragColor;
 const float MAX_DIST=2000.0;
 float plasma(vec3 r,vec2 freq,vec4 tc){
  float mx=r.x+tc.x;
  mx+=35.0*sin((r.y+mx)/20.0+tc.y);
  float my=r.y-tc.z;
  my+=20.0*cos(r.x/23.0+tc.w);
  return r.z-(sin(mx*freq.x)*2.5+sin(my*freq.y)*2.5+5.5);
 }
 float raymarch(vec3 pos,vec3 dir,vec2 freq,vec4 tc){
  float dist=0.0;
  for(int i=0;i<40;i++){
   float dscene=plasma(pos+dist*dir,freq,tc);
   if(abs(dscene)<0.1)break;
   dist+=0.9*dscene;
   if(!(abs(dist)<MAX_DIST))return MAX_DIST;
  }
  return dist;
 }
 void main(){
  float T=iTime*0.22;
  vec2 freq=vec2(0.6/7.0,(0.6*0.9)/3.0);
  vec4 tc=vec4(T/0.130,T/0.810,T/0.200,T/0.710);
  float c,s;
  float vfov=3.14159/2.3;
  vec3 cam=vec3(0.0,0.0,30.0);
  vec2 uv=(gl_FragCoord.xy/iResolution.xy)-0.5;
  uv.x*=iResolution.x/iResolution.y;uv.y*=-1.0;
  vec3 dir=vec3(0.0,0.0,-1.0);
  float ulen=length(uv),xrot=vfov*ulen;
  c=cos(xrot);s=sin(xrot);
  dir=mat3(1.0,0.0,0.0,0.0,c,-s,0.0,s,c)*dir;
  vec2 nuv=ulen>1e-5?uv/ulen:vec2(1.0,0.0);
  c=nuv.x;s=nuv.y;
  dir=mat3(c,-s,0.0,s,c,0.0,0.0,0.0,1.0)*dir;
  c=cos(1.11);s=sin(1.11);
  dir=mat3(c,0.0,s,0.0,1.0,0.0,-s,0.0,c)*dir;
  float dist=raymarch(cam,dir,freq,tc);
  vec3 pos=cam+dist*dir;
  float t=clamp(15.0/max(dist,0.001),0.0,1.0);
  vec3 body=mix(uWaveColor,uCrestColor,clamp(pos.z*0.08+0.5,0.0,1.0));
  vec3 col=clamp(mix(uHorizonColor,body,t),0.0,1.0);
  fragColor=vec4(col*t,t);
 }`;
 let gl,canvas,program,buffer,raf=0,visible=false,lastDraw=0,rendererFailed=false;
 const shaders=[];const started=performance.now();
 const rgb=hex=>hex.match(/../g).map(v=>parseInt(v,16)/255);
 host.dataset.waveMode='css';host.dataset.waveFrames='0';
 function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
 function init(){
  if(gl||rendererFailed)return;
  canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
  gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false,depth:false});
  if(!gl){rendererFailed=true;return;}
  try{
   const compile=(kind,source)=>{const shader=gl.createShader(kind);shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Wave shader failed');return shader;};
   program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Wave program failed');
   gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
   const location=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
   const palette=document.body.classList.contains('botanical')?['8e7b60','302921','e8dcc7']:document.body.classList.contains('cobalt')?['947464','392520','eabda7']:document.body.classList.contains('graphite')?['78918b','1b302b','c5dfd4']:['859e80','1b3429','d2e8c7'];
   ['uHorizonColor','uWaveColor','uCrestColor'].forEach((name,i)=>gl.uniform3fv(gl.getUniformLocation(program,name),rgb(palette[i])));
   host.appendChild(canvas);host.dataset.waveMode='webgl';
   canvas.addEventListener('webglcontextlost',()=>{stop();rendererFailed=true;host.dataset.waveMode='css';canvas.hidden=true;});
  }catch{rendererFailed=true;host.dataset.waveMode='css';canvas?.remove();gl=null;}
 }
 function draw(time=0){
  if(!gl||rendererFailed)return;
  const width=Math.max(1,Math.min(640,host.clientWidth));
  const height=Math.max(1,Math.round(width*host.clientHeight/Math.max(1,host.clientWidth)));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
  gl.useProgram(program);gl.uniform2f(gl.getUniformLocation(program,'iResolution'),width,height);gl.uniform1f(gl.getUniformLocation(program,'iTime'),time);
  gl.drawArrays(gl.TRIANGLES,0,3);host.dataset.waveFrames=String(Number(host.dataset.waveFrames)+1);
 }
 function loop(time){raf=0;if(!visible||document.hidden||reduce.matches||compact.matches)return;if(time-lastDraw>=1000/30){draw((time-started)/1000);lastDraw=time;}raf=requestAnimationFrame(loop);}
 function update(){
  stop();
  host.dataset.waveActive=String(visible&&!document.hidden&&!reduce.matches);
  if(compact.matches){if(canvas)canvas.hidden=true;host.dataset.waveMode='css';return;}
  if(!visible)return;
  init();if(canvas)canvas.hidden=rendererFailed;
  if(gl&&!rendererFailed){host.dataset.waveMode='webgl';draw(0);if(!reduce.matches&&!document.hidden)raf=requestAnimationFrame(loop);}
 }
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();},{rootMargin:'80px',threshold:0});observer.observe(host);
 const resize=new ResizeObserver(()=>{if(visible&&gl&&!compact.matches)draw(reduce.matches?0:(performance.now()-started)/1000);});resize.observe(host);
 reduce.addEventListener('change',update);compact.addEventListener('change',update);document.addEventListener('visibilitychange',update);
 addEventListener('pagehide',()=>{stop();observer.disconnect();resize.disconnect();reduce.removeEventListener('change',update);compact.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);if(gl){if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s));}},{once:true});
})();
