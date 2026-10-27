const F=`#version 300 es
in vec2 position;
out vec2 vUv;
void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }
`,P=`#version 300 es
precision highp float;
precision highp int;
#define varying in
#define texture2D texture
out highp vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
`,y="gl_FragColor = vec4(mix(pow(gl_FragColor.rgb, vec3(0.41666)) * 1.055 - vec3(0.055), gl_FragColor.rgb * 12.92, vec3(lessThanEqual(gl_FragColor.rgb, vec3(0.0031308)))), gl_FragColor.a);";function U(s){const e=s.getContext("webgl2",{antialias:!1,alpha:!1,depth:!1,stencil:!1,powerPreference:"high-performance"});if(!e)throw new Error("WebGL2 unavailable");const E=!!e.getExtension("EXT_color_buffer_float")||!!e.getExtension("EXT_color_buffer_half_float"),i=e.createVertexArray(),T=e.createBuffer();e.bindVertexArray(i),e.bindBuffer(e.ARRAY_BUFFER,T),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);const l=(o,r)=>{const t=e.createShader(o);if(e.shaderSource(t,r),e.compileShader(t),!e.getShaderParameter(t,e.COMPILE_STATUS)&&!e.isContextLost()){const n=e.getShaderInfoLog(t);throw e.deleteShader(t),new Error(`Shader compile failed: ${n}`)}return t},g=l(e.VERTEX_SHADER,F),d=new Set,u=new Set,m=o=>{const r=l(e.FRAGMENT_SHADER,P+o),t=e.createProgram();if(e.attachShader(t,g),e.attachShader(t,r),e.bindAttribLocation(t,0,"position"),e.linkProgram(t),e.deleteShader(r),!e.getProgramParameter(t,e.LINK_STATUS)&&!e.isContextLost())throw new Error(`Program link failed: ${e.getProgramInfoLog(t)}`);d.add(t);const n=new Map,h=c=>(n.has(c)||n.set(c,e.getUniformLocation(t,c)),n.get(c));return{program:t,draw:(c,f=null)=>{e.useProgram(t);let p=0;for(const w in c){const a=c[w],v=h(w);v&&(typeof a=="number"?e.uniform1f(v,a):Array.isArray(a)?e.uniform2f(v,a[0],a[1]):(e.activeTexture(e.TEXTURE0+p),e.bindTexture(e.TEXTURE_2D,a),e.uniform1i(v,p++)))}e.bindFramebuffer(e.FRAMEBUFFER,f?f.fb:null),f?e.viewport(0,0,f.w,f.h):e.viewport(0,0,e.drawingBufferWidth,e.drawingBufferHeight),e.bindVertexArray(i),e.drawArrays(e.TRIANGLES,0,3)},dispose:()=>{d.delete(t),e.deleteProgram(t)}}},x=()=>{const o=e.createTexture();return e.bindTexture(e.TEXTURE_2D,o),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE),u.add(o),o};return{gl:e,pass:m,texture:o=>{const r=x();return e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.texImage2D(e.TEXTURE_2D,0,e.SRGB8_ALPHA8,e.RGBA,e.UNSIGNED_BYTE,o),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),r},target:(o,r)=>{const t=x();E?e.texImage2D(e.TEXTURE_2D,0,e.RGBA16F,o,r,0,e.RGBA,e.HALF_FLOAT,null):e.texImage2D(e.TEXTURE_2D,0,e.RGBA8,o,r,0,e.RGBA,e.UNSIGNED_BYTE,null);const n=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,n),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0),e.bindFramebuffer(e.FRAMEBUFFER,null),{fb:n,tex:t,w:o,h:r}},disposeTarget:o=>{e.deleteFramebuffer(o.fb),u.delete(o.tex),e.deleteTexture(o.tex)},resize:o=>{const r=s.clientWidth,t=s.clientHeight;if(!r||!t)return!1;const n=Math.floor(r*o),h=Math.floor(t*o);return(s.width!==n||s.height!==h)&&(s.width=n,s.height=h),!0},dispose:()=>{d.forEach(o=>e.deleteProgram(o)),u.forEach(o=>e.deleteTexture(o)),e.deleteShader(g),e.deleteBuffer(T),e.deleteVertexArray(i)}}}async function k(s){const e=new Image;return e.crossOrigin="anonymous",e.decoding="async",e.src=s,await e.decode(),e}const L=`
uniform sampler2D uImg;
uniform vec2 uTexel;
varying vec2 vUv;
const int R = 4;
void main() {
  vec3 m[8];
  vec3 s[8];
  float w[8];
  for (int k = 0; k < 8; k++) { m[k] = vec3(0.0); s[k] = vec3(0.0); w[k] = 0.0; }
  for (int y = -R; y <= R; y++) {
    for (int x = -R; x <= R; x++) {
      vec2 d = vec2(float(x), float(y));
      float r2 = dot(d, d);
      if (r2 > float(R * R)) continue;
      vec3 c = texture2D(uImg, vUv + d * uTexel).rgb;
      float g = exp(-r2 / (2.0 * float(R * R) * 0.35));
      float a = atan(d.y, d.x);
      for (int k = 0; k < 8; k++) {
        float sk = cos(a - float(k) * 0.785398);
        float wk = r2 < 0.5 ? 0.125 : g * pow(max(sk, 0.0), 6.0);
        m[k] += c * wk;
        s[k] += c * c * wk;
        w[k] += wk;
      }
    }
  }
  vec3 outc = vec3(0.0);
  float tot = 0.0;
  for (int k = 0; k < 8; k++) {
    vec3 mean = m[k] / w[k];
    vec3 v = abs(s[k] / w[k] - mean * mean);
    float a = 1.0 / (1.0 + pow((v.r + v.g + v.b) * 900.0, 4.0));
    outc += mean * a;
    tot += a;
  }
  gl_FragColor = vec4(outc / tot, 1.0);
}
`,D=`
uniform sampler2D uImg;
uniform vec2 uTexel;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
// the photo is sampled in linear light; tone and edges are judged perceptually, as the eye sees them
float lum(vec3 c) { return pow(max(dot(c, vec3(0.2126, 0.7152, 0.0722)), 0.0), 1.0 / 2.2); }
// one family of hatching: lines across direction d, spacing texels apart, hw texels half-wide
float hatch(vec2 px, vec2 d, float spacing, float hw, float seed) {
  float j = (noise(px * 0.06 + seed) - 0.5) * 1.8;
  float off = abs(fract((dot(px, d) + j) / spacing) - 0.5) * spacing;
  float line = 1.0 - smoothstep(hw - 0.5, hw + 0.5, off);
  // pen pressure varies along the stroke, and strokes break now and then
  float pressure = 0.7 + 0.3 * noise(px * vec2(0.02, 0.09) + seed * 3.0);
  return line * pressure * step(0.18, noise(px * 0.035 + seed * 7.0));
}
void main() {
  vec2 px = vUv / uTexel;
  // hand wobble: the whole drawing drifts by a texel or so along slow noise
  vec2 wob = (vec2(noise(px * 0.015 + 2.0), noise(px * 0.015 - 5.0)) - 0.5) * uTexel * 2.4;
  vec2 uv = vUv + wob;

  // two Gaussians for the difference-of-Gaussians (σ 0.9 and 1.45 texels)
  float g1 = 0.0, w1 = 0.0, g2 = 0.0, w2 = 0.0;
  for (int y = -5; y <= 5; y++) {
    for (int x = -5; x <= 5; x++) {
      vec2 d = vec2(float(x), float(y));
      float r2 = dot(d, d);
      float l = lum(texture2D(uImg, uv + d * uTexel).rgb);
      float a = exp(-r2 / 1.62);
      float b = exp(-r2 / 4.2);
      g1 += l * a; w1 += a;
      g2 += l * b; w2 += b;
    }
  }
  g1 /= w1; g2 /= w2;
  // XDoG: a crisp line on the dark side of every edge, its weight following the contrast
  float D = g1 - 0.99 * g2;
  float pen = D < -0.009 ? tanh((-0.009 - D) * 80.0) : 0.0;
  pen = smoothstep(0.1, 0.7, pen);
  pen *= 0.78 + 0.22 * noise(px * 0.3);

  // tone → hatching: half-tones at 45°, shadow cross-hatched, deep shadow nearly solid
  // mostly white paper: only real shadow is hatched, only the deepest is near-solid
  float L = smoothstep(0.04, 0.8, g2);
  float t = 0.0;
  t = max(t, hatch(px, vec2(0.7071, 0.7071), 6.0, 0.45, 1.0) * (1.0 - smoothstep(0.22, 0.34, L)) * 0.38);
  t = max(t, hatch(px, vec2(0.7071, -0.7071), 6.0, 0.45, 2.0) * (1.0 - smoothstep(0.1, 0.18, L)) * 0.45);
  t = max(t, hatch(px, vec2(0.96, 0.28), 3.2, 0.45, 3.0) * (1.0 - smoothstep(0.03, 0.08, L)) * 0.5);

  // drafting paper: warm ivory, fibres, soft foxing towards the edges
  float grain = fbm(px * 0.6) * 0.05 + fbm(px * 0.008) * 0.05;
  vec3 paper = vec3(0.945, 0.925, 0.886) - grain * vec3(0.9, 0.95, 1.0);
  vec2 c = vUv - 0.5;
  paper *= 1.0 - dot(c, c) * 0.16;
  vec3 ink = vec3(0.14, 0.13, 0.12);
  float cover = clamp(max(pen, t), 0.0, 1.0);
  // paper and ink are display colours; store them linear like the photo
  gl_FragColor = vec4(pow(mix(paper, ink, cover), vec3(2.2)), pen);
}
`,I=`
uniform sampler2D uPhoto;
uniform sampler2D uPaint;
uniform vec2 uImg;
uniform vec2 uRes;
uniform vec2 uPos;
uniform vec2 uFocal;
uniform float uP;
varying vec2 vUv;

vec2 cover(vec2 uv) {
  float ri = uImg.x / uImg.y, rb = uRes.x / uRes.y;
  vec2 s = rb > ri ? vec2(1.0, ri / rb) : vec2(rb / ri, 1.0);
  return uv * s + (1.0 - s) * uPos;
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 q = vec2(uv.x * aspect, uv.y);

  // watercolour wash: pigment blooms outward from the house with a ragged, granulating edge
  float bloom = fbm(q * 3.4 + 1.7);
  float dist = length((uv - uFocal) * vec2(aspect, 1.0));
  float g = clamp(dist * 0.58 + bloom * 0.5 - 0.06, 0.0, 1.0);
  float p = uP * 1.4 - 0.2;
  float m = smoothstep(g - 0.07, g + 0.07, p);
  float rim = smoothstep(0.0, 0.5, m) * smoothstep(1.0, 0.5, m);

  vec2 cuv = cover(uv);
  vec4 drawing = texture2D(uPaint, cuv);
  // wet pigment bleeds a touch along the rim
  vec3 photo = texture2D(uPhoto, cuv + (vec2(bloom, fbm(q * 3.4 - 4.1)) - 0.5) * 0.012 * rim).rgb;

  vec3 col = mix(drawing.rgb, photo, m);
  // the pen lines linger over the colour, then fade as the wash dries
  col = mix(col, vec3(0.013, 0.011, 0.010), drawing.a * m * (1.0 - smoothstep(0.5, 1.0, uP)) * 0.55);
  // pigment pools darker where the wash stops
  col *= 1.0 - rim * 0.12;

  gl_FragColor = vec4(col, 1.0);
  ${y}
}
`;async function S(s,e,E){const i=U(s),T=Math.min(window.devicePixelRatio,1.25);let l;try{l=await k(e)}catch(a){throw i.dispose(),a}const g=i.texture(l),d=Math.min(1,1800/l.naturalWidth),u=Math.round(l.naturalWidth*d),m=Math.round(l.naturalHeight*d),x=[1/u,1/m],R=i.target(u,m),_=i.target(u,m),b=i.pass(L);b.draw({uImg:g,uTexel:x},R);const A=i.pass(D);A.draw({uImg:R.tex,uTexel:x},_),b.dispose(),A.dispose(),i.disposeTarget(R);const o=i.pass(I),r={uPhoto:g,uPaint:_.tex,uImg:[l.naturalWidth,l.naturalHeight],uRes:[1,1],uPos:E.position,uFocal:E.focal,uP:0},t=()=>o.draw(r),n=()=>{i.resize(T)&&(r.uRes=[s.clientWidth,s.clientHeight],t())};n();let h=0,c=!1,f=0,p=performance.now();const w=a=>{const v=Math.min(.05,(a-p)/1e3);p=a,r.uP+=(h-r.uP)*(1-Math.exp(-v*6)),t(),c&&(f=requestAnimationFrame(w))};return t(),{setProgress:a=>h=a,resize:n,setActive:a=>{a!==c&&(c=a,a?(p=performance.now(),f=requestAnimationFrame(w)):cancelAnimationFrame(f))},dispose:()=>{cancelAnimationFrame(f),i.disposeTarget(_),i.dispose()}}}export{S as createPainting};
