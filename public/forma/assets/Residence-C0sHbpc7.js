import{r as w,j as M}from"./index-Bdh81gzm.js";import{b as B,u as C,c as X,d as Y,A as _,w as J}from"./World-8ToqwoJW.js";import{a as z}from"./events-e51d7528.esm-QiMqE5jG.js";import{j as Q,X as Z,b as ee,ae as T,i as te,l as ne,f as re,af as ae,C as R,ag as oe,n as P,ah as se,a5 as $,ai as ie,aj as E,V as S}from"./three.module-bag0Yvzb.js";function L(t){const i=t.onBeforeCompile,o=t.customProgramCacheKey;t.onBeforeCompile=(s,c)=>{i.call(t,s,c),s.fragmentShader=s.fragmentShader.replace("#include <alphatest_fragment>",`#ifdef USE_MAP
        {
          vec2 texel = vMapUv * vec2(textureSize(map, 0));
          vec2 ddx = dFdx(texel), ddy = dFdy(texel);
          float mip = max(0.0, 0.5 * log2(max(dot(ddx, ddx), dot(ddy, ddy))));
          diffuseColor.a *= 1.0 + mip * 0.5;
        }
        #endif
        #include <alphatest_fragment>`)},t.customProgramCacheKey=()=>`${o.call(t)}|coverage`}function G(t){const i=t.onBeforeCompile,o=t.customProgramCacheKey;t.onBeforeCompile=(c,d)=>{i.call(t,c,d),c.fragmentShader=c.fragmentShader.replace("normal *= faceDirection;","")},t.customProgramCacheKey=()=>`${o.call(t)}|crown-normals`,t.roughness=.82,t.envMapIntensity=.5,t.color.setRGB(.78,.9,.86);const s=t;s.isMeshPhysicalMaterial&&(s.sheen=.1,s.sheenRoughness=.7,s.sheenColor.set("#6f7d4a"),s.specularIntensity=.35)}const ce=`
uniform float uTime;
uniform float uAmount;
uniform float uSeed;
uniform float uLength;
varying vec2 vUv;
float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), u.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * n2(p); p *= 2.1; a *= 0.5; } return v; }
void main() {
  vec2 uv = vUv;
  float x = uv.x * uLength;           // metres along the burner
  float t = uTime;
  // turbulence rising through the flames
  vec2 q = vec2(x * 4.2 + uSeed, uv.y * 2.6 - t * 2.3);
  float turb = fbm(q) - 0.5;
  float x2 = x + turb * 0.12 * uv.y;
  // individual tongues along the line, each with its own height and lick
  float tongue = 0.5 + 0.5 * sin(x2 * 15.0 + fbm(vec2(x * 3.0, t * 0.8 + uSeed)) * 6.0);
  float height = 0.38 + 0.5 * tongue * (0.7 + 0.6 * fbm(vec2(x * 2.0 - t * 0.6, t * 1.7 + uSeed)));
  float y = uv.y / max(height, 0.05);
  float body = 1.0 - smoothstep(0.35 + turb * 0.5, 1.0, y + turb * 0.35);
  body *= smoothstep(0.0, 0.06, uv.y);
  // fade at the burner ends
  float ends = smoothstep(0.0, 0.08, uv.x) * smoothstep(1.0, 0.92, uv.x);
  float f = clamp(body * ends, 0.0, 1.0);
  // blue roots, a white-yellow core, orange tongues, deep red tips
  vec3 col = mix(vec3(1.2, 0.18, 0.02), vec3(3.2, 1.25, 0.25), smoothstep(0.08, 0.5, f));
  col = mix(col, vec3(5.0, 3.6, 1.6), smoothstep(0.6, 0.95, f) * (1.0 - smoothstep(0.0, 0.5, y)));
  col += vec3(0.1, 0.25, 1.2) * smoothstep(0.12, 0.0, uv.y) * f * 0.6;
  float a = f * smoothstep(0.02, 0.25, f) * uAmount;
  gl_FragColor = vec4(col * a, a);
}
`,le=`
uniform float uBillboard;
uniform float uLength;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  if (uBillboard > 0.5) {
    // turn the curtain about the vertical axis towards the camera; its apparent width follows the view
    vec3 centre = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    vec3 toCam = cameraPosition - centre;
    toCam.y = 0.0;
    toCam = normalize(toCam + 1e-4);
    vec3 lineDir = normalize((modelMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
    vec3 side = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
    float w = abs(dot(side, lineDir)) * uLength + (1.0 - abs(dot(side, lineDir))) * 0.22;
    vec3 world = centre + side * (uv.x - 0.5) * w + vec3(0.0, p.y, 0.0);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  } else {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
}
`;function F({position:t,rotation:i=0,length:o,height:s=.55,billboard:c=!1,amount:d=1,light:x=6,seed:g=0}){const l=w.useMemo(()=>{const m=[];for(let e=0;e<2;e++){const f=new Q(1,s*(1-e*.18),1,1);f.translate(.5,s*(1-e*.18)/2,0),c||f.scale(o,1,1),c||f.translate(-o/2,0,e*.02);const n=new Z({vertexShader:le,fragmentShader:ce,transparent:!0,depthWrite:!1,blending:T,side:ee,toneMapped:!1,uniforms:{uTime:{value:0},uAmount:{value:1},uSeed:{value:g*7.3+e*13.1},uLength:{value:o},uBillboard:{value:c?1:0}}}),v=new te(f,n);v.frustumCulled=!1,v.renderOrder=5,m.push(v)}return m},[c,o,s,g]),a=w.useMemo(()=>{const r=new ne;r.setAttribute("position",new re(new Float32Array(78),3));const e=Array.from({length:26},()=>({x:0,y:-1,z:0,vy:0,vx:0,life:Math.random()})),f=new ae({color:new R(4,1.6,.4),size:.035,transparent:!0,opacity:.9,depthWrite:!1,blending:T,toneMapped:!1}),n=new oe(r,f);return n.frustumCulled=!1,{pts:n,state:e}},[]),u=w.useRef(null),p=w.useRef(g*10);return z((m,r)=>{p.current+=r;const e=typeof d=="number"?d:d.current??0;for(const n of l){const v=n.material.uniforms;v.uTime.value=p.current,v.uAmount.value=e,n.visible=e>.002}if(u.current){const n=.82+.1*Math.sin(p.current*3.1)+.08*Math.sin(p.current*11.7+1.3)+.05*Math.sin(p.current*23);u.current.intensity=e>.002?x*n*e:0}const f=a.pts.geometry.attributes.position;a.pts.visible=e>.05,a.state.forEach((n,v)=>{n.life+=r*.55,(n.life>=1||n.y<0)&&(n.life=0,n.x=(Math.random()-.5)*o*.85,n.z=(Math.random()-.5)*.06,n.y=.05,n.vy=.35+Math.random()*.5,n.vx=(Math.random()-.5)*.1),n.y+=n.vy*r,n.x+=(n.vx+Math.sin(p.current*2+v)*.05)*r,f.setXYZ(v,n.x,n.y*(n.life<.92,1),n.z)}),f.needsUpdate=!0,a.pts.material.opacity=.85*e}),M.jsxs("group",{position:t,"rotation-y":i,children:[l.map((m,r)=>M.jsx("primitive",{object:m},r)),M.jsx("primitive",{object:a.pts}),M.jsx("pointLight",{ref:u,color:"#ff8f45",distance:7.5,decay:1.6,position:[0,.35,.05]})]})}const K=`
float nh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float nn(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(nh(i), nh(i + vec2(1, 0)), u.x), mix(nh(i + vec2(0, 1)), nh(i + vec2(1, 1)), u.x), u.y);
}
float nf(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * nn(p); p = r * p * 2.03; a *= 0.5; }
  return v;
}
// world-space triplanar sample of a tiling texture
vec3 triplanar(sampler2D t, vec3 p, vec3 n, float scale) {
  vec3 w = pow(abs(n), vec3(4.0));
  w /= (w.x + w.y + w.z);
  vec3 a = texture2D(t, p.zy * scale).rgb;
  vec3 b = texture2D(t, p.xz * scale).rgb;
  vec3 c = texture2D(t, p.xy * scale).rgb;
  return a * w.x + b * w.y + c * w.z;
}
`,V=`
// fracture lines: thin, dark, slightly sunken, running in two joint directions and along the sheeting
float graniteCracks(vec3 P) {
  float a = abs(nf(vec2(P.x * 0.21 + P.z * 0.13, P.y * 0.52)) - 0.5);
  float b = abs(nf(vec2(P.z * 0.24 - P.x * 0.09, P.y * 0.47) + 11.0) - 0.5);
  float c = abs(nf(vec2(P.x * 0.11 + P.z * 0.11, P.y * 1.3) + 23.0) - 0.5);
  float k = max(max(1.0 - smoothstep(0.0, 0.012, a), 1.0 - smoothstep(0.0, 0.011, b)), (1.0 - smoothstep(0.0, 0.008, c)) * 0.7);
  // cracks open and close along their length rather than running like lines on a map
  return k * smoothstep(0.35, 0.65, nf(P.xz * 0.5 + P.y * 0.6 + 5.0));
}
vec3 graniteColour(sampler2D t, vec3 P, vec3 N) {
  float big = nf(P.xz * 0.045 + P.y * 0.06);
  float mid = nf(P.xz * 0.38 + P.y * 0.45 + 7.0);
  float fine = nn(P.xz * 3.1 + P.y * 2.7);
  vec3 g = mix(vec3(0.17, 0.17, 0.175), vec3(0.4, 0.39, 0.375), smoothstep(0.25, 0.75, big));
  g *= (0.84 + 0.28 * mid) * (0.93 + 0.14 * fine);
  float grain = dot(triplanar(t, P, N, 1.25), vec3(0.333)) / 0.42;
  g *= mix(1.0, grain, 0.3);
  // pale crustose lichen in patches, dark streaks where water runs off the faces
  float lichen = smoothstep(0.62, 0.8, nf(P.xz * 0.22 + P.y * 0.3 + 3.0));
  g = mix(g, vec3(0.58, 0.59, 0.52) * (0.9 + 0.2 * fine), lichen * 0.55);
  float streak = smoothstep(0.55, 0.82, nf(vec2(P.x * 0.6 + P.z * 0.6, P.y * 0.07)));
  g *= 1.0 - 0.32 * streak * (1.0 - abs(N.y));
  g *= 1.0 - 0.45 * graniteCracks(P);
  return g;
}
`,N=`
varying vec3 vNW;
varying vec3 vNN;
`;function k(t){t.vertexShader=t.vertexShader.replace("#include <common>",`#include <common>
${N}`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
      #ifdef USE_INSTANCING
        vNW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        vNN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);
      #else
        vNW = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vNN = normalize(mat3(modelMatrix) * objectNormal);
      #endif`)}const U=`
vec3 bumpFrom(float hh, vec3 n, float k) {
  vec3 dpdx = dFdx(-vViewPosition), dpdy = dFdy(-vViewPosition);
  float dhx = dFdx(hh), dhy = dFdy(hh);
  vec3 r1 = cross(dpdy, n), r2 = cross(n, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(mix(n, normalize(abs(det) * n - grad), k));
}
`;function fe(t){const i=new P({color:"#ffffff",roughness:.95,metalness:0,envMapIntensity:.7});return i.onBeforeCompile=o=>{o.uniforms.tRock={value:t},k(o),o.fragmentShader=o.fragmentShader.replace("#include <common>",`#include <common>
${N}
uniform sampler2D tRock;
${K}
${V}
${U}`).replace("#include <color_fragment>",`#include <color_fragment>
        vec3 P = vNW;
        float slope = 1.0 - clamp(vNN.y, 0.0, 1.0);
        float house = length(P.xz - vec2(1.0, 1.0));
        float n1 = nf(P.xz * 0.045);
        float n2 = nf(P.xz * 0.35);
        float n3 = nn(P.xz * 2.2);
        // meadow: greens, dry sun-bleached patches, flowers of light
        vec3 grass = mix(vec3(0.085, 0.12, 0.035), vec3(0.16, 0.18, 0.06), smoothstep(0.3, 0.75, n2));
        grass = mix(grass, vec3(0.30, 0.26, 0.13), smoothstep(0.58, 0.82, n1) * 0.75);
        grass *= 0.85 + 0.3 * n3;
        // forest floor: needle litter and moss, deeper in and up the hill
        float forest = smoothstep(24.0, 60.0, house) * smoothstep(0.35, 0.6, nf(P.xz * 0.02 + 3.0) + 0.15);
        vec3 litter = mix(vec3(0.11, 0.075, 0.045), vec3(0.07, 0.085, 0.035), smoothstep(0.4, 0.7, n2));
        vec3 ground = mix(grass, litter * (0.85 + 0.3 * n3), forest);
        // granite where it is steep, with lichen and rain streaks from the texture
        float rockMask = smoothstep(0.42, 0.62, slope + (n2 - 0.5) * 0.25);
        vec3 granite = graniteColour(tRock, P, vNN);
        vec3 col = mix(ground, granite, rockMask);
        // wet, dark rock along the waterline
        float wet = 1.0 - smoothstep(-13.9, -12.9, P.y);
        col *= 1.0 - 0.45 * wet;
        // far up the hill the surface is the forest canopy seen from afar
        float canopy = smoothstep(70.0, 140.0, house) * (1.0 - rockMask);
        vec3 crowns = mix(vec3(0.022, 0.04, 0.025), vec3(0.06, 0.08, 0.04), smoothstep(0.35, 0.75, nf(P.xz * 0.11)));
        col = mix(col, crowns, canopy);
        diffuseColor.rgb = col;`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
roughnessFactor = mix(0.95, 0.72, wet);`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
        {
          float camDist = length(vViewPosition);
          float hh = nf(vNW.xz * 0.6) * 0.18 * (1.0 - rockMask)              // tussocks
                   + nf(vNW.xz * 2.4) * 0.03                                  // fine ground
                   + (nf(vNW.xz * 0.22 + vNW.y * 0.35) * 1.4 + nf(vNW.xz * 1.1 + vNW.y * 1.4) * 0.3 - graniteCracks(vNW) * 0.08) * rockMask  // joints, buttresses, cracks
                   + nf(vNW.xz * 0.12) * 2.2 * canopy;                        // tree crowns far away
          normal = bumpFrom(hh, normal, 0.9 / (1.0 + camDist / 220.0));
        }`)},i.customProgramCacheKey=()=>"forma-terrain",i}function O(t){const i=t.map;t.normalMap=null,t.onBeforeCompile=o=>{o.uniforms.tRock={value:i},k(o),o.fragmentShader=o.fragmentShader.replace("#include <common>",`#include <common>
${N}
uniform sampler2D tRock;
${K}
${V}
${U}`).replace("#include <map_fragment>",`vec3 granite = graniteColour(tRock, vNW, vNN);
        diffuseColor.rgb *= granite;`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
        normal = bumpFrom(dot(granite, vec3(0.333)) * 0.3 - graniteCracks(vNW) * 0.06 + nf(vNW.xz * 1.5 + vNW.y) * 0.04, normal, 0.85 / (1.0 + length(vViewPosition) / 120.0));`)},t.customProgramCacheKey=()=>"forma-granite"}function me(t){const i=t.onBeforeCompile,o=t.customProgramCacheKey;t.onBeforeCompile=(s,c)=>{i.call(t,s,c),s.uniforms.uSunDir=B.dir,s.uniforms.uSunCol=B.color,s.vertexShader.includes("varying vec3 vNW;")||k(s),s.fragmentShader=s.fragmentShader.replace("#include <common>",`#include <common>
${s.fragmentShader.includes("varying vec3 vNW;")?"":N}
uniform vec3 uSunDir;
uniform vec3 uSunCol;`).replace("#include <lights_fragment_end>",`#include <lights_fragment_end>
        {
          vec3 V = normalize(vNW - cameraPosition);
          float back = pow(max(dot(V, normalize(uSunDir)), 0.0), 3.0);
          totalEmissiveRadiance += diffuseColor.rgb * uSunCol * back * 0.18 * smoothstep(-0.05, 0.1, uSunDir.y);
        }`)},t.customProgramCacheKey=()=>`${o.call(t)}|translucent`}const ue={Curtain_L1_Front:{axis:"x",end:-1},Curtain_L1_West:{axis:"z",end:-1},Curtain_L2_Front:{axis:"x",end:1},Curtain_L2_West:{axis:"z",end:-1},Curtain_L2_East:{axis:"z",end:-1}},pe=new R("#ffb46e"),Me=w.forwardRef(function({lights:i=0,mode:o="real",interiorFill:s=!1,curtains:c=1,fire:d=1,clip:x},g){const l=C(_.residence),{root:a,emissive:u,fills:p,nodes:m,drapes:r}=w.useMemo(()=>ve(l.scene),[l.scene]);w.useImperativeHandle(g,()=>({root:a,node:f=>m.get(f)}),[a,m]),w.useLayoutEffect(()=>{const f=new P({color:"#f1ede6",roughness:.92}),n=new P({color:"#f4f2ee",roughness:.4,transparent:!0,opacity:.35,depthWrite:!1}),v=h=>h.transparent&&h.opacity<.5;return a.traverse(h=>{const y=h;if(!y.isMesh)return;const b=y.userData.real;if(o==="real")y.material=b;else{const j=H=>v(H)?n:f;y.material=Array.isArray(b)?b.map(j):j(b)}}),()=>{f.dispose(),n.dispose()}},[a,o]),w.useLayoutEffect(()=>{if(!x)return;const f=[];return a.traverse(n=>{const v=n;if(v.isMesh)for(const h of Array.isArray(v.material)?v.material:[v.material])h.clippingPlanes=x,h.clipShadows=!0,f.push(h)}),()=>{for(const n of f)n.clippingPlanes=null}},[a,o,x]);const e=w.useMemo(()=>({v:typeof c=="number"?c:c.current??1}),[c]);return z((f,n)=>{const v=typeof c=="number"?c:c.current??1;e.v+=(v-e.v)*(1-Math.exp(-n*2.8));for(const y of r)y.mesh.scale[y.axis]=1-.85*e.v,y.mesh.scale[y.axis==="x"?"z":"x"]=1+.9*e.v;J.value=performance.now()/1e3;const h=typeof i=="number"?i:i.current;for(const y of u)y.mat.emissiveIntensity=y.base*(o==="real"?h:0);for(const y of p)y.intensity=y.userData.base*h}),M.jsxs("group",{children:[M.jsx("primitive",{object:a}),s&&p.map((f,n)=>M.jsx("primitive",{object:f},n)),o==="real"&&M.jsxs(M.Fragment,{children:[M.jsx(F,{position:[6.05,.39,6.75],length:.9,height:.5,billboard:!0,amount:d,light:7,seed:1}),M.jsx(F,{position:[-4,.46,-3.91],length:2.3,height:.36,amount:d,light:3.5,seed:2})]})]})});function ve(t){const i=t.clone(!0),o=new Map,s=[],c=new Map,d=X(),x=m=>{if(m.name==="Pool_Water")return d;let r=o.get(m);if(!r){r=m.clone(),o.set(m,r);const e=r;if(e.normalMap&&e.normalScale.multiplyScalar(/Concrete|Travertine|Granite|Paving/.test(e.name)?1.6:1.3),/Travertine|Paving|Oak/.test(e.name)&&(e.envMapIntensity=1.15),/Concrete|Travertine|Paving|Oak|Granite/.test(e.name)&&e.map&&de(e),/Bronze|Steel|Brass/.test(e.name)&&(e.envMapIntensity=1.4),e.emissive&&e.emissiveIntensity>0&&e.emissive.getHex()!==0&&s.push({mat:e,base:e.emissiveIntensity}),e.transmission>0&&(e.transmission=0,e.transparent=!0,e.opacity=1,e.depthWrite=!1,e.roughness=.03,e.metalness=0,e.envMapIntensity=1.15,e.specularIntensity=1,e.color.set("#dfe9e6"),e.onBeforeCompile=f=>{f.fragmentShader=f.fragmentShader.replace("#include <opaque_fragment>",`{
              float NdV = abs(dot(normal, normalize(vViewPosition)));
              float fres = 0.04 + 0.96 * pow(1.0 - NdV, 5.0);
              diffuseColor.a = clamp(0.07 + fres * 0.9, 0.0, 0.85);
            }
            #include <opaque_fragment>`)},e.customProgramCacheKey=()=>"forma-fresnel-glass"),e.transparent&&e.opacity<1&&(e.depthWrite=!1),/Sheer/i.test(e.name)){e.opacity=.34,e.roughness=1,e.sheen=.6,e.sheenColor?.set("#fff3e2"),e.emissive.set("#f6dcc0"),e.emissiveIntensity=.12;const f=e.onBeforeCompile;e.onBeforeCompile=(n,v)=>{f.call(e,n,v),n.fragmentShader=n.fragmentShader.replace("normal *= faceDirection;","")},e.customProgramCacheKey=()=>"forma-sheer"}e.alphaTest>0&&e.map&&(L(e),G(e))}return r},g=new Map,l=m=>{let r=g.get(m);return r||(r=x(m).clone(),Y(r,-.06,[-13.1,4.75,-1.4,9.05]),g.set(m,r)),r},a=m=>{for(let r=m;r;r=r.parent)if(r.name==="Pool")return!0;return!1};i.traverse(m=>{m.name&&c.set(m.name,m);const r=m;if(!r.isMesh)return;const e=a(r)?l:x;r.material=Array.isArray(r.material)?r.material.map(e):e(r.material),r.userData.real=r.material;const f=Array.isArray(r.material)?r.material:[r.material],n=f.every(h=>h.transparent&&h.opacity<1),v=f.every(h=>h.emissiveIntensity>0&&h.emissive?.getHex()!==0);r.castShadow=!n&&!v,r.receiveShadow=!0});const u=[[-4.3,2.3,-.4,10],[1,2.3,.6,9],[5.2,2.3,-.2,8],[-5.6,6.2,.2,9],[4,6.2,-.8,8]].map(([m,r,e,f])=>{const n=new se(pe,0,f,1.6);return n.position.set(m,r,e),n.userData.base=14,n}),p=[];for(const[m,r]of Object.entries(ue)){const e=c.get(m);let f;if(e?.traverse(h=>{!f&&h.isMesh&&(f=h)}),!f)continue;const n=f.geometry.clone();n.computeBoundingBox();const v=r.end<0?n.boundingBox.min[r.axis]:n.boundingBox.max[r.axis];r.axis==="x"?n.translate(-v,0,0):n.translate(0,0,-v),f.geometry=n,f.position[r.axis]+=v,p.push({mesh:f,axis:r.axis})}return{root:i,emissive:s,fills:u,nodes:c,drapes:p}}function de(t){const i=t.onBeforeCompile,o=t.customProgramCacheKey;t.onBeforeCompile=(s,c)=>{i.call(t,s,c),s.vertexShader=s.vertexShader.replace("#include <common>",`#include <common>
varying vec3 vSDW;`).replace("#include <worldpos_vertex>",`#include <worldpos_vertex>
vSDW = (modelMatrix * vec4(transformed, 1.0)).xyz;`),s.fragmentShader=s.fragmentShader.replace("#include <common>",`#include <common>
        varying vec3 vSDW;
        float sdh(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float sdn(vec3 p) {
          vec3 i = floor(p), f = fract(p);
          vec3 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(sdh(i), sdh(i + vec3(1, 0, 0)), u.x), mix(sdh(i + vec3(0, 1, 0)), sdh(i + vec3(1, 1, 0)), u.x), u.y),
                     mix(mix(sdh(i + vec3(0, 0, 1)), sdh(i + vec3(1, 0, 1)), u.x), mix(sdh(i + vec3(0, 1, 1)), sdh(i + vec3(1, 1, 1)), u.x), u.y), u.z);
        }`).replace("#include <map_fragment>",`#include <map_fragment>
        float sdm = sdn(vSDW * 0.35) * 0.6 + sdn(vSDW * 1.3) * 0.4;
        diffuseColor.rgb *= 0.93 + 0.13 * sdm;`).replace("#include <roughnessmap_fragment>",`#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor + (sdn(vSDW * 2.2) - 0.5) * 0.14, 0.02, 1.0);`)},t.customProgramCacheKey=()=>`${o.call(t)}|surface`}const A={value:0},he=["Building_Pad","Setting_Out"],I=new WeakMap;function D(t){const i=I.get(t);if(i)return i;t.updateMatrixWorld(!0);let o=null;t.traverse(l=>{const a=l;if(a.isMesh)for(const u of Array.isArray(a.material)?a.material:[a.material])/Granite/i.test(u.name)&&u.map&&(o=u.map)});const s=fe(o),c=new Map,d=l=>{let a=c.get(l);if(a)return a;if(/Terrain/i.test(l.name))a=s;else{a=l.clone();const u=a;/Granite/i.test(l.name)&&O(u),/Grass/i.test(l.name)?W(u,"grass"):/Shrub/i.test(l.name)?W(u,"shrub"):/Pine|Foliage|Olive/i.test(l.name)&&W(u,"tree"),a.alphaTest>0&&u.map&&(L(u),G(u),me(u))}return c.set(l,a),a},x=new Map;t.traverse(l=>{if(!l.name.startsWith("Tree_"))return;const a=[];l.traverse(u=>{const p=u;p.isMesh&&a.push({geometry:p.geometry.clone().applyMatrix4(p.matrixWorld),material:Array.isArray(p.material)?p.material.map(d):d(p.material)})}),a.length&&x.set(l.name,a)});const g={own:d,variants:x,rockMap:o};return I.set(t,g),g}function q(t,i,o){const s=new Map;for(const l of i)s.set(l[0],[...s.get(l[0])??[],l]);const c=new E,d=new S(0,1,0),x=new $,g=[];for(const[l,a]of s)for(const u of t.variants.get(l)??[]){const p=new ie(u.geometry,u.material,a.length);a.forEach(([,m,r,e,f,n],v)=>{c.setFromAxisAngle(d,f),x.compose(new S(m,r,e),c,new S(n,n,n)),p.setMatrixAt(v,x)}),p.instanceMatrix.needsUpdate=!0,p.computeBoundingSphere(),p.castShadow=o(l),p.receiveShadow=!0,g.push({mesh:p,spots:a})}return g}function be({construction:t=!1}){const i=C(_.site),{root:o,props:s}=w.useMemo(()=>{const c=D(i.scene),d=i.scene.clone(!0),x=[],g=[];d.traverse(l=>{if(he.includes(l.name)&&x.push(l),l.name.startsWith("Tree_")&&(l.visible=!1,typeof l.userData.instances=="string"))for(const[u,p,m,r,e]of JSON.parse(l.userData.instances))g.push([l.name,u,p,m,r,e]);const a=l;a.isMesh&&(a.castShadow=!0,a.receiveShadow=!0,a.material=Array.isArray(a.material)?a.material.map(c.own):c.own(a.material))});for(const l of q(c,g,a=>!/Lo/.test(a)))d.add(l.mesh);return{root:d,props:x}},[i.scene]);return w.useLayoutEffect(()=>{for(const c of s)c.visible=t},[s,t]),z((c,d)=>{A.value+=d}),M.jsx("primitive",{object:o})}function Se({trees:t,grow:i}){const o=C(_.site),s=w.useMemo(()=>q(D(o.scene),t,()=>!0),[o.scene,t]),c=w.useMemo(()=>new $,[]),d=w.useMemo(()=>new E,[]),x=w.useMemo(()=>new S(0,1,0),[]),g=w.useRef(-1);return z((l,a)=>{A.value+=a;const u=i?i.current:1;if(!(Math.abs(u-g.current)<1e-4)){g.current=u;for(const{mesh:p,spots:m}of s)m.forEach(([,r,e,f,n,v],h)=>{const y=Math.min(1,Math.max(0,u*1.6-h/Math.max(1,m.length)*.6)),b=y*y*(3-2*y);d.setFromAxisAngle(x,n+(1-b)*.4),c.compose(new S(r,e,f),d,new S(v*Math.max(.001,b),v*Math.max(.001,b),v*Math.max(.001,b))),p.setMatrixAt(h,c)}),p.instanceMatrix.needsUpdate=!0,p.visible=u>.001}}),M.jsx(M.Fragment,{children:s.map((l,a)=>M.jsx("primitive",{object:l.mesh},a))})}function Pe(){const t=C(_.site);return w.useMemo(()=>{const i=new P({color:"#ffffff",roughness:.88,map:D(t.scene).rockMap});return O(i),i},[t.scene])}function W(t,i){t.onBeforeCompile=o=>{o.uniforms.uWind=A;const s=i==="grass"?"fract(uv.y * 2.0)":i==="shrub"?"fract(uv.y * 4.0)":"1.0";o.vertexShader=o.vertexShader.replace("#include <common>",`#include <common>
uniform float uWind;`).replace("#include <begin_vertex>",`#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec4 wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        #else
          vec4 wp = modelMatrix * vec4(transformed, 1.0);
        #endif
        float gust = 0.65 + 0.35 * sin(uWind * 0.37 + wp.x * 0.05);
        float sway = (sin(uWind * 1.3 + wp.x * 0.35 + wp.z * 0.21) * 0.6 + sin(uWind * 2.7 + wp.y * 0.9) * 0.25) * gust;
        ${i==="tree"?`float reach = clamp((transformed.y + 2.0) * 0.045, 0.0, 1.0);
        transformed.x += sway * 0.06 * reach;
        transformed.z += sway * 0.04 * reach;`:`float t = ${s};
        float flutter = sin(uWind * ${i==="grass"?"3.1":"4.3"} + wp.x * 1.7 + wp.z * 1.3) * 0.5 + sway * 0.5;
        transformed.x += flutter * t * t * ${i==="grass"?"0.07":"0.025"};
        transformed.z += flutter * t * t * ${i==="grass"?"0.05":"0.02"};`}`)},t.customProgramCacheKey=()=>`forma-wind-${i}`}export{Se as G,Me as R,be as S,D as s,fe as t,Pe as u};
