import{aV as P,S as w,au as I,v as q,aB as F,X as V,s as x,i as C,j as D,K as H,Q as k}from"./three.module-bag0Yvzb.js";import{q as U}from"./index-Bdh81gzm.js";const G=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,L=`
uniform sampler2D uA;
uniform sampler2D uB;
uniform vec2 uSizeA;
uniform vec2 uSizeB;
uniform vec2 uRes;
uniform float uT;
uniform float uTime;
uniform float uVel;
uniform vec2 uMouse;
uniform float uHover;
uniform float uIntro;
varying vec2 vUv;

vec2 cover(vec2 uv, vec2 img, vec2 box) {
  float ri = img.x / img.y;
  float rb = box.x / box.y;
  vec2 s = rb > ri ? vec2(1.0, ri / rb) : vec2(rb / ri, 1.0);
  return (uv - 0.5) * s + 0.5;
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

vec3 sampleImg(sampler2D tex, vec2 uv, vec2 size, float zoom, vec2 offset, float split) {
  vec2 c = cover(uv, size, uRes);
  c = (c - 0.5) / zoom + 0.5 + offset;
  vec3 col;
  col.r = texture2D(tex, c + vec2(split, 0.0)).r;
  col.g = texture2D(tex, c).g;
  col.b = texture2D(tex, c - vec2(split, 0.0)).b;
  return col;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;

  // lens toward the pointer
  vec2 d = (uv - uMouse) * vec2(aspect, 1.0);
  float lens = exp(-dot(d, d) * 9.0) * uHover;
  uv -= (uv - uMouse) * lens * 0.07;

  float t = uT;
  float bump = sin(t * 3.14159265);
  vec2 q = vec2(uv.x * aspect, uv.y);
  float n = fbm(q * 2.6 + vec2(0.0, uTime * 0.04));
  float n2 = fbm(q * 5.0 - vec2(uTime * 0.03, 0.0));

  // rising mist: bottom first, broken by noise
  float g = n * 0.55 + uv.y * 0.45;
  float m = smoothstep(g - 0.12, g + 0.12, t * 1.3 - 0.15);

  vec2 push = vec2(n2 - 0.5, n - 0.5) * 0.09 * bump;
  float split = clamp(uVel, -1.0, 1.0) * 0.0035 + bump * 0.0015;

  vec3 a = sampleImg(uA, uv, uSizeA, 1.0 + 0.12 * t, push * m, split);
  vec3 b = sampleImg(uB, uv, uSizeB, 1.12 - 0.12 * t, -push * (1.0 - m), split);
  vec3 col = mix(a, b, m);

  // soft ivory seam where the images meet
  float seam = smoothstep(0.0, 0.5, m) * smoothstep(1.0, 0.5, m);
  col = mix(col, vec3(0.957, 0.941, 0.910), seam * 0.55);

  // intro: the frame develops from ivory like a print in a tray
  float dev = smoothstep(g - 0.1, g + 0.1, uIntro * 1.25 - 0.12);
  col = mix(vec3(0.957, 0.941, 0.910), col, dev);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;async function j(f,S){const l=new P({canvas:f,antialias:!1,alpha:!1,powerPreference:"high-performance"});U(l),l.setPixelRatio(Math.min(window.devicePixelRatio,1.75)),l.outputColorSpace=w;const z=new I,a=await Promise.all(S.map(e=>new Promise((o,u)=>z.load(e,s=>{s.colorSpace=w,s.minFilter=q,s.generateMipmaps=!1,s.wrapS=s.wrapT=F,o(s)},void 0,u)))),v=e=>{const o=e.image;return new x(o.width,o.height)},t={uA:{value:a[0]},uB:{value:a[Math.min(1,a.length-1)]},uSizeA:{value:v(a[0])},uSizeB:{value:v(a[Math.min(1,a.length-1)])},uRes:{value:new x(1,1)},uT:{value:0},uTime:{value:0},uVel:{value:0},uMouse:{value:new x(.5,.5)},uHover:{value:0},uIntro:{value:0}},d=new V({vertexShader:G,fragmentShader:L,uniforms:t,depthTest:!1}),g=new C(new D(2,2),d),y=new H;y.add(g);const A=new k(-1,1,1,-1,0,1),r={pos:0,vel:0,mx:.5,my:.5,hover:0,intro:0},i={pos:0,vel:0,hover:0,intro:0};let p=!1,c=0,m=performance.now();const T=m,M=()=>{const e=f.clientWidth,o=f.clientHeight;!e||!o||(l.setSize(e,o,!1),t.uRes.value.set(e,o))};M();const n=(e,o,u,s)=>e+(o-e)*(1-Math.exp(-u*s)),B=e=>{const o=Math.min(1,Math.max(0,(e-.18)/.64));return o*o*(3-2*o)},b=e=>{const o=Math.min(.05,(e-m)/1e3);m=e,i.pos=n(i.pos,r.pos,7,o),r.vel=n(r.vel,0,6,o),i.vel=n(i.vel,r.vel,8,o),i.hover=n(i.hover,r.hover,5,o),i.intro=n(i.intro,r.intro,2.4,o);const u=a.length,s=Math.min(u-2,Math.max(0,Math.floor(i.pos))),R=i.pos-s;t.uA.value!==a[s]&&(t.uA.value=a[s],t.uSizeA.value=v(a[s]));const h=Math.min(u-1,s+1);t.uB.value!==a[h]&&(t.uB.value=a[h],t.uSizeB.value=v(a[h])),t.uT.value=B(R),t.uVel.value=i.vel,t.uHover.value=i.hover,t.uIntro.value=i.intro,t.uMouse.value.x=n(t.uMouse.value.x,r.mx,6,o),t.uMouse.value.y=n(t.uMouse.value.y,r.my,6,o),t.uTime.value=(e-T)/1e3,l.render(y,A),p&&(c=requestAnimationFrame(b))};return{setPosition:e=>r.pos=e,setVelocity:e=>r.vel=e,setIntro:e=>r.intro=e,setPointer:(e,o,u)=>{r.mx=e,r.my=o,r.hover=u?1:0},resize:M,setActive:e=>{e!==p&&(p=e,e?(m=performance.now(),c=requestAnimationFrame(b)):cancelAnimationFrame(c))},dispose:()=>{cancelAnimationFrame(c),a.forEach(e=>e.dispose()),d.dispose(),g.geometry.dispose(),l.dispose()}}}export{j as createReel};
