import{r as l,j as b}from"./index-Bdh81gzm.js";import{W as N}from"./World-8ToqwoJW.js";import{u as U}from"./quality-CdlOtIYl.js";import{R as V,S as Y}from"./Residence-C0sHbpc7.js";import{E as A,a as P,b as z}from"./Effects-CyXCRolN.js";import{u as H}from"./cameraPath-Cbc9UfBK.js";import{u as k,a as I}from"./events-e51d7528.esm-QiMqE5jG.js";import{W as K,U as $,D as q,F as J,M as Q,a as C,V as W,B as X,P as Z,b as ee}from"./three.module-bag0Yvzb.js";const te=`
uniform sampler2D tGhostDepth;
uniform float uGhost;
uniform float uDraw;
uniform float uNear;
uniform float uFar;
uniform float uTime;

float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h1(i), h1(i + vec2(1, 0)), u.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), u.x), u.y);
}
float viewDist(float d) { return (uNear * uFar) / (uFar - (uFar - uNear) * d); }

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  if (uGhost < 0.002) { outputColor = inputColor; return; }
  vec2 px = texelSize;
  vec2 frag = uv * resolution;
  // a slightly hand-drawn line: the taps drift by whole texels along slow noise
  vec2 wob = (vec2(n2(frag * 0.02 + 3.1), n2(frag * 0.02 - 7.7)) - 0.5) * px * 2.0;
  vec2 c = (floor((uv + wob) * resolution) + 0.5) * px;
  float dc = texture2D(tGhostDepth, c).x;
  float dl = texture2D(tGhostDepth, c - vec2(px.x, 0.0)).x;
  float dr = texture2D(tGhostDepth, c + vec2(px.x, 0.0)).x;
  float dd = texture2D(tGhostDepth, c - vec2(0.0, px.y)).x;
  float du = texture2D(tGhostDepth, c + vec2(0.0, px.y)).x;
  float nearest = min(dc, min(min(dl, dr), min(dd, du)));
  if (nearest >= 0.99999) { outputColor = inputColor; return; }
  // second difference of 1/distance (zero on any plane), scaled back to metres
  float ic = 1.0 / viewDist(dc), il = 1.0 / viewDist(dl), ir = 1.0 / viewDist(dr), id = 1.0 / viewDist(dd), iu = 1.0 / viewDist(du);
  float lap = max(abs(il + ir - 2.0 * ic), abs(iu + id - 2.0 * ic));
  float line = smoothstep(0.012, 0.05, lap / (ic * ic));
  line *= 0.75 + 0.25 * n2(frag * 0.35);
  // only where the building isn't there yet (the scene is further than the finished house)
  float ghostDist = viewDist(nearest);
  float sceneDist = viewDist(depth);
  float unbuilt = smoothstep(0.1, 0.45, sceneDist - ghostDist);
  // a faint shimmer runs up the outline, like light catching chalk
  float shimmer = 0.85 + 0.15 * sin(frag.y * 0.05 - uTime * 2.0 + frag.x * 0.01);
  vec3 chalk = vec3(1.0, 0.975, 0.92);
  // the outline draws itself from the ground up, as if sketched in chalk
  float sweep = (1.0 - uv.y) * 0.7 + uv.x * 0.3 + (n2(frag * 0.012) - 0.5) * 0.18;
  float drawn = smoothstep(sweep - 0.06, sweep, uDraw * 1.3 - 0.12);
  float a = clamp(line * unbuilt * uGhost * 0.9 * shimmer * drawn, 0.0, 1.0);
  float veil = unbuilt * uGhost * drawn * (dc < 0.99999 ? 0.06 : 0.0);
  vec3 col = mix(inputColor.rgb, chalk, clamp(a + veil, 0.0, 1.0));
  outputColor = vec4(col, 1.0);
}
`;class oe extends A{constructor(){super("GhostOutline",te,{attributes:P.CONVOLUTION|P.DEPTH,uniforms:new Map([["tGhostDepth",new C(null)],["uGhost",new C(0)],["uDraw",new C(1)],["uNear",new C(.3)],["uFar",new C(3e4)],["uTime",new C(0)]])})}}function re(){return l.useMemo(()=>({effect:null,amount:0,draw:1,target:null}),[])}const ae=l.forwardRef(function({pipe:c},e){const f=l.useMemo(()=>new oe,[]);return l.useEffect(()=>(c.effect=f,typeof e=="function"?e(f):e&&(e.current=f),()=>f.dispose()),[f,c,e]),b.jsx("primitive",{object:f,dispose:null})});function se({pipe:s}){const{gl:c,scene:e,camera:f,size:w,viewport:y}=k(),n=l.useMemo(()=>{const x=new K(1,1,{type:$});return x.depthTexture=new q(1,1,J),x},[]);l.useEffect(()=>{n.setSize(Math.round(w.width*y.dpr),Math.round(w.height*y.dpr))},[n,w.width,w.height,y.dpr]),l.useEffect(()=>()=>n.dispose(),[n]);const _=l.useMemo(()=>new Q({colorWrite:!1}),[]);l.useEffect(()=>()=>_.dispose(),[_]);const F=l.useMemo(()=>new WeakMap,[]);return I(x=>{const h=s.effect;if(!h)return;const S=f;h.uniforms.get("uGhost").value=s.amount,h.uniforms.get("uDraw").value=s.draw,h.uniforms.get("uNear").value=S.near,h.uniforms.get("uFar").value=S.far,h.uniforms.get("uTime").value=x.clock.elapsedTime;const r=s.target,o=r?.root();if(!r||!o||s.amount<.002)return;r.before();let i=F.get(o);i||(i=[],o.traverse(a=>{const m=a;if(a.isPoints&&i.push(a),!m.isMesh)return;(Array.isArray(m.material)?m.material:[m.material]).some(D=>D.isShaderMaterial||D.alphaTest>0||D.transparent&&D.opacity<.5||/Water/i.test(D.name))&&i.push(m)}),F.set(o,i));const M=i.map(a=>a.visible);i.forEach(a=>a.visible=!1);const t=e.children.map(a=>a.visible);let p=o;for(;p.parent&&p.parent!==e;)p=p.parent;e.children.forEach(a=>a.visible=a===p);const v=e.background,u=e.overrideMaterial,d=c.shadowMap.autoUpdate;e.background=null,e.overrideMaterial=_,c.shadowMap.autoUpdate=!1,c.setRenderTarget(n),c.clear(),c.render(e,f),c.setRenderTarget(null),c.shadowMap.autoUpdate=d,e.overrideMaterial=u,e.background=v,e.children.forEach((a,m)=>a.visible=t[m]),i.forEach((a,m)=>a.visible=M[m]),r.after(),h.uniforms.get("tGhostDepth").value=n.depthTexture},-1),null}const ne=s=>s*s*(3-2*s),R=s=>1-Math.pow(1-s,3),E=(s,c,e)=>ne(Math.min(1,Math.max(0,(s-c)/(e-c)))),ie=[["Pool","reveal",.055,.13],["Pool_Detail","reveal",.12,.145],["Podium","reveal",.09,.15],["Terrace","reveal",.11,.17],["Terrace_Steps","reveal",.14,.19],["Slab_L1","reveal",.15,.185],["Stone_Core","reveal",.17,.27],["Columns","reveal",.18,.26],["Walls","reveal",.2,.28],["Stair","reveal",.23,.29],["Slab_L2","lower",.26,.31],["Roof_Soffit","lower",.3,.35],["Roof_Slab","lower",.3,.35],["Roof_Detail","reveal",.34,.36],["Roof_Lights","reveal",.345,.365],["Facade_L1_West","reveal",.35,.39],["Facade_L1_Front","reveal",.36,.4],["Facade_L1_East","reveal",.37,.41],["Facade_L2_West","reveal",.38,.42],["Facade_L2_Front","reveal",.39,.43],["Facade_L2_East","reveal",.4,.44],["Balustrade","reveal",.42,.45],["Pool_Water","reveal",.36,.45],["Terrace_Planters","settle",.44,.47],["Terrace_Olive","settle",.45,.49],["Terrace_Furniture","settle",.46,.5],["Terrace_Fire_Lounge","settle",.47,.51],["Terrace_Fire_Burner","reveal",.5,.51]],j=[.43,.52],B=[.47,.6],O=[.51,.57];function le(s,c){const e=s.clone();e.clippingPlanes=[c.plane],e.clipShadows=!0;const f=!e.transparent&&e.alphaTest===0;f&&(e.side=ee);const w=s.onBeforeCompile,y=s.customProgramCacheKey.bind(s);return e.onBeforeCompile=(n,_)=>{w.call(s,n,_),n.uniforms.uCut=c.cut,n.uniforms.uSeam=c.seam,n.vertexShader=n.vertexShader.replace("#include <common>",`#include <common>
varying float vCutY;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
vCutY = (modelMatrix * vec4(transformed, 1.0)).y;`),n.fragmentShader=n.fragmentShader.replace("#include <common>",`#include <common>
varying float vCutY;
uniform float uCut;
uniform float uSeam;`).replace("#include <dithering_fragment>",`#include <dithering_fragment>
        ${f?"if (!gl_FrontFacing) gl_FragColor.rgb = diffuseColor.rgb * 0.55;":""}
        float seam = 1.0 - smoothstep(0.0, 0.07, uCut - vCutY);
        gl_FragColor.rgb += vec3(1.0, 0.9, 0.74) * seam * seam * 2.2 * uSeam;`)},e.customProgramCacheKey=()=>`${y()}|build${f?"-solid":""}`,e}function ge({progress:s,curtains:c}){const e=k(r=>r.scene),f=k(r=>r.gl),w=l.useRef(null),y=l.useRef(null),n=re(),_=l.useRef(.1),F=l.useRef(0),x=l.useRef([]),h=l.useRef({padY:0}),S=l.useRef(new W(-.72,.2,.66).normalize());return l.useLayoutEffect(()=>(f.localClippingEnabled=!0,()=>{f.localClippingEnabled=!1}),[f]),l.useLayoutEffect(()=>{const r=y.current;if(!r)return;r.root.updateMatrixWorld(!0);const o=[],i=new X,M=(u,d,a,m)=>{if(!u)return;i.setFromObject(u);const G={obj:u,motion:d,a,b:m,pos:u.position.clone(),y0:i.min.y-.02,y1:i.max.y+.02,plane:new Z(new W(0,-1,0),1e4),cut:{value:1e4},seam:{value:0},meshes:[],state:null},D=new Map,L=T=>{let g=D.get(T);return g||D.set(T,g=le(T,G)),g};u.traverse(T=>{const g=T;g.isMesh&&G.meshes.push({mesh:g,real:g.material,build:Array.isArray(g.material)?g.material.map(L):L(g.material)})}),o.push(G)};for(const[u,d,a,m]of ie)M(r.node(u),d,a,m);const t=r.node("Interior"),p=t?[...t.children]:[];p.forEach((u,d)=>{const a=j[0]+d/Math.max(1,p.length)*(j[1]-j[0]-.035);M(u,u.name.startsWith("Curtain")?"reveal":"settle",a,a+.035)}),x.current=o;const v=e.getObjectByName("Building_Pad");return h.current={pad:v,pegs:e.getObjectByName("Setting_Out"),padY:v?.position.y??0},()=>{for(const u of o)for(const d of u.meshes)d.mesh.material=d.real}},[e]),U(l.useCallback(()=>{const r=[];for(const o of x.current)for(const i of o.meshes)r.push([i.mesh,i.mesh.material]),i.mesh.material=i.build;return()=>{for(const[o,i]of r)o.material=i}},[])),l.useLayoutEffect(()=>{const r=[];return n.target={root:()=>w.current,before:()=>{r.length=0;for(const o of x.current)r.push({obj:o.obj,pos:o.obj.position.clone(),vis:o.obj.visible}),o.obj.position.copy(o.pos),o.obj.visible=!0},after:()=>{for(const o of r)o.obj.position.copy(o.pos),o.obj.visible=o.vis}},()=>{n.target=null}},[n]),H(s,[{at:0,pos:[-60,-10,76],target:[-10,-.5,-2],fov:26},{at:.14,pos:[-54,-9,69],target:[-8.5,.2,-2],fov:26},{at:.32,pos:[-33,-1.5,45],target:[-5,2,-1.5],fov:31},{at:.47,pos:[-21,3.5,33],target:[-3,2.3,-.2],fov:33},{at:.59,pos:[-8,3.6,22],target:[-3.2,2.2,1],fov:36},{at:.72,pos:[10.6,2.3,12.4],target:[6,.55,6.3],fov:42},{at:.85,pos:[-4.3,1.65,7.4],target:[-4.6,1.35,-2],fov:44},{at:1,pos:[-3.4,1.55,2.5],target:[-6.4,1.2,-2.6],fov:50}],{damping:3,parallax:.25,drift:.05}),I(()=>{const r=s.current??0;for(const t of x.current){const p=Math.min(1,Math.max(0,(r-t.a)/(t.b-t.a))),v=t.obj,u=p<=0?"hidden":p>=1?"built":"building";if(u!==t.state){t.state=u,v.visible=u!=="hidden";for(const m of t.meshes)m.mesh.material=u==="building"?m.build:m.real}if(v.position.copy(t.pos),u!=="building")continue;let d=t.y1;t.motion==="reveal"?d=t.y0+(t.y1-t.y0)*R(p):t.motion==="settle"?(d=t.y0+(t.y1-t.y0+.4)*Math.min(1,p*1.6),v.position.y=t.pos.y+(1-R(p))*.3):(v.position.y=t.pos.y+(1-R(p))*3.5,d=1e4);const a=v.position.y-t.pos.y;t.plane.constant=d+a,t.cut.value=d+a,t.seam.value=t.motion==="lower"?0:1-E(p,.85,1)}const{pad:o,pegs:i,padY:M}=h.current;if(i&&(i.visible=r<.15),o){const t=E(r,.44,.54);o.position.y=M-t*.6,o.visible=t<.999}_.current=.1+.95*E(r,B[0],B[1]),F.current=E(r,O[0],O[1]),n.draw=E(r,0,.065),n.amount=1-E(r,.44,.52)}),b.jsxs(b.Fragment,{children:[b.jsx(N,{time:"golden",sunDir:S,shadowExtent:34,shadowCenter:[-1,1,2],envIntensity:.7}),b.jsx("group",{ref:w,children:b.jsx(V,{ref:y,lights:_,interiorFill:!0,curtains:c,fire:F})}),b.jsx(Y,{construction:!0}),b.jsx(se,{pipe:n}),b.jsx(z,{aoRadius:1.4,grade:!0,children:b.jsx(ae,{pipe:n})})]})}export{ge as HeroScene};
