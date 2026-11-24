import './style.css';
import * as THREE from 'three';
import pts from './portrait-points.json';

(function () {
  var P = pts;
  var N = P.x.length;
  var FOV = 40;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rnd = mulberry32(42);
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(x) { return Math.min(1, Math.max(0, x)); }
  function sstep(e0, e1, x) { var t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); }
  function cx(z) { return Math.sin(z * 0.11) * 0.35; }
  function cy(z) { return Math.cos(z * 0.083) * 0.22; }

  var canvas = document.getElementById('gl');
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, powerPreference: 'high-performance' });
  } catch (e) {
    document.getElementById('fail').style.display = 'flex';
    return;
  }
  renderer.setClearColor(0x04060a, 1);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 120);

  /* ---------- the neural network: dendrites, axons, somas ---------- */
  var projects = [
    /* demo: el proyecto funcionando · code: repositorio en GitHub. Si un enlace está vacío, no se muestra. */
    { name: 'Radar Tech', desc: 'Plataforma de eventos tech en España', demo: 'https://www.radartech.es/', code: 'https://github.com/brahimnr2003-beep/radartech', hex: '#4dd9c7', rgb: [0.30, 0.85, 0.78] },
    { name: 'NevadaRadar', desc: 'Avisos para esquiadores en Sierra Nevada', demo: 'https://t.me/NevadaRadar_Bot', code: 'https://github.com/brahimnr2003-beep/NevadaRadar', hex: '#66a6ff', rgb: [0.40, 0.65, 1.0] },
    { name: 'TFG', desc: 'Trabajo de fin de grado sobre influencers', demo: 'https://brahimnr2003-beep.github.io/Tfg_influencers/', code: 'https://github.com/brahimnr2003-beep/Tfg_influencers', hex: '#b394ff', rgb: [0.70, 0.58, 1.0] },
    { name: 'Atlas Horizon Group', desc: 'Proyecto de Business Intelligence', demo: 'https://brahimnr2003-beep.github.io/atlas-horizon-bi/', code: 'https://github.com/brahimnr2003-beep/atlas-horizon-bi', hex: '#ffb861', rgb: [1.0, 0.72, 0.38] },
    { name: 'Neoda', desc: 'Tendencias del agua en España con datos de la NASA · 3.er puesto en NASA Space Apps Granada 2026', demo: 'https://fpanero.github.io/Neoda_Heeramienta_Medicion/', code: 'https://github.com/brahimnr2003-beep/Neoda_Herramienta_', hex: '#ff7a85', rgb: [1.0, 0.48, 0.52] }
  ];
  var LPOS = [], LD = [], LPH = [], LC = [], SEG = [];
  var NPOS = [], NS = [], ND = [], NPH = [], NC = [], SOMAS = [];
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function rvec() { return [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1]; }
  function addSeg(a, b, d0, d1, ph, col) {
    LPOS.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    LD.push(d0, d1); LPH.push(ph, ph);
    LC.push(col[0], col[1], col[2], col[0], col[1], col[2]);
    SEG.push([a, b, d0, d1, ph, col]);
  }
  function addNode(p, size, dist, ph, col) {
    NPOS.push(p[0], p[1], p[2]); NS.push(size); ND.push(dist); NPH.push(ph); NC.push(col[0], col[1], col[2]);
  }
  function grow(pos, dir, len, depth, dist, ph, col) {
    var p = pos, d = dir, steps = 4, step = len / steps;
    for (var i = 0; i < steps; i++) {
      var r = rvec();
      d = norm([d[0] + r[0] * 0.38, d[1] + r[1] * 0.38, d[2] + r[2] * 0.38]);
      var q = [p[0] + d[0] * step, p[1] + d[1] * step, p[2] + d[2] * step];
      addSeg(p, q, dist, dist + step, ph, col);
      dist += step; p = q;
    }
    if (depth > 0) {
      var nb = rnd() < 0.8 ? 2 : 3;
      for (var b = 0; b < nb; b++) {
        var r2 = rvec();
        grow(p, norm([d[0] + r2[0], d[1] + r2[1], d[2] + r2[2]]), len * 0.72, depth - 1, dist, ph, col);
      }
      if (depth >= 2) addNode(p, 0.018, dist, ph, col);
    } else {
      addNode(p, 0.032, dist, ph, col);
    }
  }
  function neuron(S, scale, col, ph, outward) {
    var nd = 5 + Math.floor(rnd() * 2);
    for (var k = 0; k < nd; k++) {
      var r = rvec();
      var dir = norm([r[0] + outward[0] * 0.9, r[1] + outward[1] * 0.9, r[2] * 0.7]);
      grow(S, dir, 0.7 * scale, 3, 0, ph, col);
    }
  }
  function axon(S, T, ph, col, scale) {
    var mid = [(S[0] + T[0]) / 2, (S[1] + T[1]) / 2, (S[2] + T[2]) / 2];
    var r = rvec();
    var C = [mid[0] + r[0] * 1.2, mid[1] + r[1] * 1.2, mid[2] + r[2] * 0.4];
    var back = norm([S[0] - T[0], S[1] - T[1], S[2] - T[2]]);
    var E = [T[0] + back[0] * 0.28, T[1] + back[1] * 0.28, T[2] + back[2] * 0.28];
    var steps = 14, prev = S, dist = 0;
    for (var i = 1; i <= steps; i++) {
      var t = i / steps, u = 1 - t;
      var q = [u * u * S[0] + 2 * u * t * C[0] + t * t * E[0] + (rnd() - 0.5) * 0.05,
               u * u * S[1] + 2 * u * t * C[1] + t * t * E[1] + (rnd() - 0.5) * 0.05,
               u * u * S[2] + 2 * u * t * C[2] + t * t * E[2]];
      var dd = Math.hypot(q[0] - prev[0], q[1] - prev[1], q[2] - prev[2]);
      addSeg(prev, q, dist, dist + dd, ph, col);
      dist += dd; prev = q;
    }
    grow(prev, norm(rvec()), 0.5 * scale, 1, dist, ph, col);
  }

  /* one project every two layers starting at layer 3, plus one closing layer: 4 projects → 10 layers */
  var LAYERS = 2 * projects.length + 2, PER = 5, LZ0 = -2.5, LDZ = 4.2;
  var PROJ_LAYER = {};
  projects.forEach(function (_, k) { PROJ_LAYER[3 + 2 * k] = k; });
  var layers = [], projWorld = [];
  for (var l = 0; l < LAYERS; l++) {
    var zl = LZ0 - l * LDZ, row = [];
    for (var j = 0; j < PER; j++) {
      var th = (j / PER) * Math.PI * 2 + rnd() * 1.0 + l * 0.7;
      var rad = 1.5 + rnd() * 1.5;
      var zz = zl + (rnd() - 0.5) * 1.2;
      var S = [cx(zz) + rad * Math.cos(th), cy(zz) + rad * Math.sin(th) * 0.85, zz];
      var o = { pos: S, scale: 1.0, proj: -1, ph: rnd(), col: rnd() < 0.5 ? [0.40, 0.62, 0.88] : [0.55, 0.82, 0.92], out: [Math.cos(th), Math.sin(th)] };
      if (j === 0 && PROJ_LAYER[l] !== undefined) {
        var pk = PROJ_LAYER[l], side = (pk % 2 === 0) ? -1 : 1;
        o.pos = [cx(zl) + side * 1.55, cy(zl) + 0.15, zl];
        o.scale = 1.5; o.proj = pk; o.col = projects[pk].rgb; o.out = [side, 0.1];
        projWorld[pk] = new THREE.Vector3(o.pos[0], o.pos[1], o.pos[2]);
      }
      row.push(o);
    }
    layers.push(row);
  }
  layers.forEach(function (row, li) {
    row.forEach(function (o) {
      addNode(o.pos, o.proj >= 0 ? 0.40 : 0.12, 0, o.ph, o.col);
      SOMAS.push(o);
      neuron(o.pos, o.scale, o.col, o.ph, o.out);
      if (li < LAYERS - 1) {
        var next = layers[li + 1].slice().sort(function (a, b) {
          return Math.hypot(a.pos[0] - o.pos[0], a.pos[1] - o.pos[1]) - Math.hypot(b.pos[0] - o.pos[0], b.pos[1] - o.pos[1]);
        });
        var na = o.proj >= 0 ? 2 : 1 + (rnd() < 0.6 ? 1 : 0);
        for (var a2 = 0; a2 < na; a2++) axon(o.pos, next[a2].pos, o.ph, o.col, o.scale);
      }
    });
  });

  var lGeo = new THREE.BufferGeometry();
  lGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(LPOS), 3));
  lGeo.setAttribute('aDist', new THREE.BufferAttribute(new Float32Array(LD), 1));
  lGeo.setAttribute('aPh', new THREE.BufferAttribute(new Float32Array(LPH), 1));
  lGeo.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(LC), 3));
  var nGeo = new THREE.BufferGeometry();
  nGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NPOS), 3));
  nGeo.setAttribute('aS', new THREE.BufferAttribute(new Float32Array(NS), 1));
  nGeo.setAttribute('aDist', new THREE.BufferAttribute(new Float32Array(ND), 1));
  nGeo.setAttribute('aPh', new THREE.BufferAttribute(new Float32Array(NPH), 1));
  nGeo.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(NC), 3));

  /* ---------- portrait particles (they become the cells' electric dust) ---------- */
  var H_UNITS = 2.6;
  var sx = H_UNITS / P.h;
  var pos = new Float32Array(N * 3), tun = new Float32Array(N * 3), rr = new Float32Array(N * 3);
  var bb = new Float32Array(N), td = new Float32Array(N * 2), tc = new Float32Array(N * 3);
  var somaPick = [];
  SOMAS.forEach(function (o) { var w = o.proj >= 0 ? 7 : 1; for (var q = 0; q < w; q++) somaPick.push(o); });
  for (var i = 0; i < N; i++) {
    var b = P.b[i] / 255;
    pos[i * 3] = (P.x[i] - P.w / 2) * sx;
    pos[i * 3 + 1] = -(P.y[i] - P.h / 2) * sx;
    pos[i * 3 + 2] = (b - 0.5) * 0.5 + (rnd() - 0.5) * 0.04;
    bb[i] = b;
    rr[i * 3] = rnd(); rr[i * 3 + 1] = rnd(); rr[i * 3 + 2] = rnd();
    if (rnd() < 0.09) {
      var so = somaPick[Math.floor(rnd() * somaPick.length)];
      var rad2 = so.proj >= 0 ? 0.2 : 0.1, rv = rvec();
      tun[i * 3] = so.pos[0] + rv[0] * rad2; tun[i * 3 + 1] = so.pos[1] + rv[1] * rad2; tun[i * 3 + 2] = so.pos[2] + rv[2] * rad2;
      td[i * 2] = 0; td[i * 2 + 1] = so.ph;
      tc[i * 3] = so.col[0]; tc[i * 3 + 1] = so.col[1]; tc[i * 3 + 2] = so.col[2];
    } else {
      var sg = SEG[Math.floor(rnd() * SEG.length)], t2 = rnd(), jj = rvec();
      tun[i * 3] = lerp(sg[0][0], sg[1][0], t2) + jj[0] * 0.018;
      tun[i * 3 + 1] = lerp(sg[0][1], sg[1][1], t2) + jj[1] * 0.018;
      tun[i * 3 + 2] = lerp(sg[0][2], sg[1][2], t2) + jj[2] * 0.018;
      td[i * 2] = lerp(sg[2], sg[3], t2); td[i * 2 + 1] = sg[4];
      tc[i * 3] = sg[5][0]; tc[i * 3 + 1] = sg[5][1]; tc[i * 3 + 2] = sg[5][2];
    }
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aTunnel', new THREE.BufferAttribute(tun, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rr, 3));
  geo.setAttribute('aB', new THREE.BufferAttribute(bb, 1));
  geo.setAttribute('aTD', new THREE.BufferAttribute(td, 2));
  geo.setAttribute('aTC', new THREE.BufferAttribute(tc, 3));

  var U = {
    uTime: { value: 0 }, uIntro: { value: reduce ? 1 : 0.6 }, uMorph: { value: 0 },
    uScale: { value: 1000 }, uPR: { value: 1 }, uMouse: { value: new THREE.Vector2(20, 20) },
    uClick: { value: new THREE.Vector3(0, 0, -100) },
    uColA: { value: new THREE.Color(0.2, 0.32, 0.43) }, uColB: { value: new THREE.Color(0.86, 0.93, 1.0) },
    uReveal: { value: 0 }, uTun: { value: 0 }
  };

  var PULSE = [
    'float pulseF(float dist, float ph, float t){',
    '  float per = 5.5;',
    '  float c = mod(t + ph*per, per)*2.6;',
    '  float d = c - dist;',
    '  return d > 0.0 ? exp(-d*2.4) : 0.0;',
    '}'
  ].join('\n');

  var pMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: [
      PULSE,
      'attribute vec3 aTunnel; attribute vec3 aRand; attribute float aB; attribute vec2 aTD; attribute vec3 aTC;',
      'uniform float uTime; uniform float uIntro; uniform float uMorph; uniform float uScale; uniform float uPR; uniform vec2 uMouse; uniform vec3 uClick;',
      'varying float vB; varying float vA; varying float vM; varying float vP; varying float vBoost; varying vec3 vC;',
      'void main(){',
      '  vec3 p = position;',
      '  float ti = clamp(uIntro*1.5 - aRand.x*0.5, 0.0, 1.0);',
      '  ti = 1.0 - pow(1.0-ti, 3.0);',
      '  vec3 scatter = p + (aRand-0.5)*vec3(3.0,3.0,4.0);',
      '  p = mix(scatter, p, ti);',
      '  p.z += sin(uTime*0.8 + aRand.y*6.2831)*0.012;',
      '  p.xy += vec2(sin(uTime*0.6 + aRand.z*6.2831), cos(uTime*0.5 + aRand.x*6.2831))*0.004;',
      '  float live = 1.0 - uMorph;',
      '  vec2 d = p.xy - uMouse; float dist = length(d);',
      '  float f = exp(-dist*dist*18.0)*live;',
      '  float lant = exp(-dist*dist*7.0)*live;',
      '  p.xy += normalize(d + vec2(0.0001))*f*0.2;',
      '  p.z += f*0.3;',
      '  float age = uTime - uClick.z;',
      '  vec2 dc = p.xy - uClick.xy;',
      '  float rb = exp(-pow((length(dc) - age*2.2)*4.5, 2.0))*exp(-age*1.1)*live;',
      '  p.xy += normalize(dc + vec2(0.0001))*rb*0.16;',
      '  p.z += rb*0.4;',
      '  float m = clamp(uMorph*1.6 - aRand.x*0.6, 0.0, 1.0);',
      '  m = m*m*(3.0-2.0*m);',
      '  vec3 burst = vec3((aRand.yz-0.5)*2.0, 0.0)*3.5*sin(m*3.14159);',
      '  vec3 t = aTunnel + vec3(sin(uTime*0.4+aRand.y*6.2831), cos(uTime*0.35+aRand.z*6.2831), 0.0)*0.02;',
      '  p = mix(p, t, m) + burst;',
      '  vec4 mv = modelViewMatrix*vec4(p,1.0);',
      '  gl_Position = projectionMatrix*mv;',
      '  float dz = max(-mv.z, 0.001);',
      '  float pulse = pulseF(aTD.x, aTD.y, uTime)*m;',
      '  float sz = (0.0105 + aB*0.015)*(0.7 + aRand.z*0.6)*(1.0 + m*0.25 + pulse*1.3 + lant*0.5 + rb*0.8);',
      '  gl_PointSize = clamp(sz*uScale/dz, 1.4*uPR, 18.0*uPR);',
      '  vB = aB; vM = m; vP = pulse; vC = aTC;',
      '  vBoost = lant*0.9 + rb*1.5;',
      '  vA = mix(1.0, 0.22, smoothstep(6.0, 38.0, dz)) * smoothstep(0.1, 0.9, dz);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uColA; uniform vec3 uColB;',
      'varying float vB; varying float vA; varying float vM; varying float vP; varying float vBoost; varying vec3 vC;',
      'void main(){',
      '  vec2 c = gl_PointCoord - 0.5; float d = length(c);',
      '  if (d > 0.5) discard;',
      '  float a = smoothstep(0.5, 0.0, d); a *= a;',
      '  vec3 base = mix(uColA, uColB, vB);',
      '  base = mix(base, uColB, clamp(vBoost*0.4, 0.0, 1.0));',
      '  vec3 neural = vC*(0.55 + 1.3*vP) + vec3(vP*0.35);',
      '  vec3 col = mix(base, neural, vM);',
      '  float alphaP = (0.3 + 0.7*vB)*(1.0 + vBoost*1.3);',
      '  float alphaN = 0.2 + 1.0*vP + 0.25*vB;',
      '  gl_FragColor = vec4(col, a*vA*mix(alphaP, alphaN, vM));',
      '}'
    ].join('\n')
  });
  var points = new THREE.Points(geo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  var lMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: [
      PULSE,
      'attribute float aDist; attribute float aPh; attribute vec3 aCol;',
      'uniform float uTime; uniform float uReveal; varying float vP; varying vec3 vC; varying float vF;',
      'void main(){',
      '  vec4 mv = modelViewMatrix*vec4(position,1.0);',
      '  gl_Position = projectionMatrix*mv;',
      '  float dz = max(-mv.z, 0.001);',
      '  vP = pulseF(aDist, aPh, uTime); vC = aCol;',
      '  vF = uReveal*(1.0-smoothstep(8.0, 34.0, dz))*smoothstep(0.15, 1.0, dz);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying float vP; varying vec3 vC; varying float vF;',
      'void main(){',
      '  vec3 col = mix(vC*0.8, vec3(1.0), vP*0.5);',
      '  gl_FragColor = vec4(col*(0.8 + 1.1*vP), (0.2 + 0.85*vP)*vF);',
      '}'
    ].join('\n')
  });
  var netLines = new THREE.LineSegments(lGeo, lMat);
  netLines.frustumCulled = false;
  scene.add(netLines);

  var nMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: [
      PULSE,
      'attribute float aS; attribute float aDist; attribute float aPh; attribute vec3 aCol;',
      'uniform float uScale; uniform float uPR; uniform float uTime; uniform float uReveal;',
      'varying float vF; varying float vP; varying vec3 vC;',
      'void main(){',
      '  vec4 mv = modelViewMatrix*vec4(position,1.0);',
      '  gl_Position = projectionMatrix*mv;',
      '  float dz = max(-mv.z, 0.001);',
      '  vP = pulseF(aDist, aPh, uTime); vC = aCol;',
      '  gl_PointSize = clamp(aS*(1.0 + 0.7*vP)*uScale/dz, 1.5*uPR, 150.0*uPR);',
      '  vF = uReveal*(1.0-smoothstep(10.0, 38.0, dz))*smoothstep(0.2, 1.2, dz);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying float vF; varying float vP; varying vec3 vC;',
      'void main(){',
      '  vec2 c = gl_PointCoord - 0.5; float d = length(c);',
      '  if (d > 0.5) discard;',
      '  float core = smoothstep(0.16, 0.0, d);',
      '  float halo = pow(1.0 - d*2.0, 2.4);',
      '  vec3 col = mix(vC, vec3(1.0), 0.25 + 0.5*vP);',
      '  gl_FragColor = vec4(col*(0.5 + core), (0.5*halo + 0.9*core)*vF*(0.5 + 0.9*vP));',
      '}'
    ].join('\n')
  });
  var nodes = new THREE.Points(nGeo, nMat);
  nodes.frustumCulled = false;
  scene.add(nodes);

  /* ---------- exit tunnel: rings of light that lead out of the network ---------- */
  var LAST_LAYER_Z = LZ0 - (LAYERS - 1) * LDZ;
  var XN = 9000, X_START = LAST_LAYER_Z - 3.7, X_END = X_START - 46;
  var xpos = new Float32Array(XN * 3), xr = new Float32Array(XN * 3), xb = new Float32Array(XN), xs = new Float32Array(XN);
  for (var xi = 0; xi < XN; xi++) {
    var xz, xrad, xring = rnd() < 0.55;
    if (xring) { xz = X_START - (1 + Math.floor(rnd() * 29)) * 1.55 + (rnd() - 0.5) * 0.14; xrad = 1.7 + (rnd() - 0.5) * 0.35; }
    else { xz = X_START - rnd() * 46; xrad = 1.2 + Math.pow(rnd(), 2.2) * 2.2; }
    xz = Math.max(xz, X_END);
    var xth = rnd() * Math.PI * 2;
    xpos[xi * 3] = cx(xz) + xrad * Math.cos(xth);
    xpos[xi * 3 + 1] = cy(xz) + xrad * Math.sin(xth);
    xpos[xi * 3 + 2] = xz;
    xr[xi * 3] = rnd(); xr[xi * 3 + 1] = rnd(); xr[xi * 3 + 2] = rnd();
    var xnode = rnd() < 0.004;
    xb[xi] = xnode ? 1.0 : 0.25 + rnd() * 0.6;
    xs[xi] = xnode ? 0.12 : 0.02 + rnd() * 0.02;
  }
  var xGeo = new THREE.BufferGeometry();
  xGeo.setAttribute('position', new THREE.BufferAttribute(xpos, 3));
  xGeo.setAttribute('aRand', new THREE.BufferAttribute(xr, 3));
  xGeo.setAttribute('aB', new THREE.BufferAttribute(xb, 1));
  xGeo.setAttribute('aS', new THREE.BufferAttribute(xs, 1));
  var xMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: [
      'attribute vec3 aRand; attribute float aB; attribute float aS;',
      'uniform float uTime; uniform float uScale; uniform float uPR; uniform float uTun;',
      'varying float vB; varying float vA;',
      'void main(){',
      '  vec3 p = position + vec3(sin(uTime*0.4+aRand.y*6.2831), cos(uTime*0.35+aRand.z*6.2831), 0.0)*0.03;',
      '  vec4 mv = modelViewMatrix*vec4(p,1.0);',
      '  gl_Position = projectionMatrix*mv;',
      '  float dz = max(-mv.z, 0.001);',
      '  gl_PointSize = clamp(aS*(0.7 + aRand.z*0.6)*uScale/dz, 1.4*uPR, 14.0*uPR);',
      '  vB = aB;',
      '  vA = uTun*mix(1.0, 0.25, smoothstep(6.0, 40.0, dz))*smoothstep(0.1, 0.9, dz);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uColA; uniform vec3 uColB; varying float vB; varying float vA;',
      'void main(){',
      '  vec2 c = gl_PointCoord - 0.5; float d = length(c);',
      '  if (d > 0.5) discard;',
      '  float a = smoothstep(0.5, 0.0, d); a *= a;',
      '  gl_FragColor = vec4(mix(uColA, uColB, vB), a*vA*(0.3 + 0.7*vB));',
      '}'
    ].join('\n')
  });
  var exitTunnel = new THREE.Points(xGeo, xMat);
  exitTunnel.frustumCulled = false;
  scene.add(exitTunnel);

  /* ---------- labels ---------- */
  var labelsEl = document.getElementById('labels');
  var labelEls = projects.map(function (p) {
    var d = document.createElement('div');
    d.className = 'node';
    d.style.setProperty('--c', p.hex);
    var nb = document.createElement('b'); nb.textContent = p.name;
    var ns = document.createElement('span'); ns.className = 'mono'; ns.textContent = p.desc;
    d.appendChild(nb); d.appendChild(ns);
    var row = document.createElement('div'); row.className = 'go-row';
    [['Ver proyecto', p.demo], ['Ver código', p.code]].forEach(function (l) {
      if (!l[1]) return;
      var a = document.createElement('a');
      a.className = 'mono go'; a.href = l[1]; a.target = '_blank'; a.rel = 'noopener'; a.tabIndex = -1;
      a.textContent = l[0] + ' ↗';
      row.appendChild(a);
    });
    if (row.children.length) d.appendChild(row);
    labelsEl.appendChild(d);
    return d;
  });
  function setTab(el, on) {
    var as = el.getElementsByTagName('a');
    for (var i = 0; i < as.length; i++) as[i].tabIndex = on ? 0 : -1;
  }

  /* ---------- sizing ---------- */
  var Z0 = 4.2, W = 1, Hh = 1;
  function resize() {
    W = window.innerWidth; Hh = window.innerHeight;
    var pr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(W, Hh, false);
    camera.aspect = W / Hh;
    camera.updateProjectionMatrix();
    var t = Math.tan(FOV * Math.PI / 360);
    U.uScale.value = Hh * pr / (2 * t);
    U.uPR.value = pr;
    var needH = H_UNITS * 1.12 / (2 * t);
    var needW = (H_UNITS * P.w / P.h) * 1.1 / (2 * t * camera.aspect);
    Z0 = Math.max(needH, needW, 3.2);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- pointer: repel + lantern on hover, ripple on click ---------- */
  var ndc = null;
  function mouseWorld() {
    if (!ndc) { U.uMouse.value.set(20, 20); return null; }
    var dz0 = Math.max(0.5, camera.position.z);
    var hh = Math.tan(FOV * Math.PI / 360) * dz0;
    var x = ndc.x * hh * camera.aspect + camera.position.x, y = ndc.y * hh + camera.position.y;
    U.uMouse.value.set(x, y);
    return [x, y];
  }
  window.addEventListener('pointermove', function (e) { ndc = { x: (e.clientX / W) * 2 - 1, y: -((e.clientY / Hh) * 2 - 1) }; });
  window.addEventListener('pointerleave', function () { ndc = null; });
  window.addEventListener('pointerdown', function (e) {
    ndc = { x: (e.clientX / W) * 2 - 1, y: -((e.clientY / Hh) * 2 - 1) };
    var w = mouseWorld();
    if (w && U.uMorph.value < 0.5) U.uClick.value.set(w[0], w[1], U.uTime.value);
  });

  /* ---------- scroll journey: fly to a project, hold, fly to the next ---------- */
  /* timings in viewport heights (vh): portrait until 2.72, arrive at the first project at 4.16,
     then 0.56 per move/hold, and a final 0.48 hold on the last project */
  var STOPZ = projWorld.map(function (v) { return v.z + 4.6; });
  var BP_VH = [2.72, 4.16], BZ = [1.0, STOPZ[0]];
  for (var bk = 1; bk < STOPZ.length; bk++) {
    BP_VH.push(BP_VH[BP_VH.length - 1] + 0.56); BZ.push(STOPZ[bk - 1]);
    BP_VH.push(BP_VH[BP_VH.length - 1] + 0.56); BZ.push(STOPZ[bk]);
  }
  BP_VH.push(BP_VH[BP_VH.length - 1] + 0.48); BZ.push(STOPZ[STOPZ.length - 1]);
  var A_VH = BP_VH[BP_VH.length - 1];
  var BP = BP_VH.map(function (v) { return v / A_VH; });
  function journeyZ(p) {
    for (var s = 0; s < BP.length - 1; s++) {
      if (p <= BP[s + 1]) {
        var t = clamp01((p - BP[s]) / (BP[s + 1] - BP[s]));
        if (BZ[s] !== BZ[s + 1]) t = t * t * (3 - 2 * t);
        return lerp(BZ[s], BZ[s + 1], t);
      }
    }
    return BZ[BZ.length - 1];
  }
  function holdW(k, p) {
    var f0 = BP[2 * k], arr = BP[2 * k + 1], lea = BP[2 * k + 2], nxt = BP[2 * k + 3] !== undefined ? BP[2 * k + 3] : 1.1;
    var rise = sstep(arr - 0.55 * (arr - f0), arr, p);
    var fall = 1 - sstep(lea, lea + 0.5 * (nxt - lea), p);
    return rise * fall;
  }

  /* scroll is split in three: A = portrait + projects (A_VH), B = exit tunnel (340vh), O = final page scrolling in */
  var B_VH = 3.4, Z_END = X_START - 42;
  document.getElementById('scroller').style.height = ((A_VH + B_VH + 1) * 100).toFixed(0) + 'vh';
  var tS = 0, curS = 0;
  function readScroll() {
    var se = document.scrollingElement || document.documentElement;
    var sT = se.scrollTop || window.scrollY || 0, vh = window.innerHeight;
    tS = sT / vh;
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  var hero = document.getElementById('hero'), hint = document.getElementById('hint');
  var bar = document.getElementById('bar'), phase = document.getElementById('phase'), endEl = document.getElementById('end');
  var hud = document.querySelector('.top'), rail = document.querySelector('.rail');
  var v3 = new THREE.Vector3();
  var last = performance.now(), t0 = last, lastPhase = '';

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000); last = now;
    var tt = (now - t0) / 1000;
    var sm = reduce ? 1 : 1 - Math.pow(0.001, dt);
    curS += (tS - curS) * sm;
    var p = clamp01(curS / A_VH), pB = clamp01((curS - A_VH) / B_VH), curO = clamp01((curS - A_VH - B_VH) / 0.5);
    var sA = p * A_VH; /* progress through part A, in vh */
    U.uTun.value = sstep(A_VH - 0.8, A_VH, sA);

    U.uTime.value = tt;
    if (!reduce) U.uIntro.value = Math.min(1, 0.6 + tt / 2.6 * 0.4);
    U.uMorph.value = sstep(2.16, 4.16, sA);
    U.uReveal.value = sstep(2.4, 3.68, sA);

    var a = sstep(0.0, 2.4, sA);
    var z = sA < 2.72 ? lerp(Z0, 1.0, a) : journeyZ(p);
    if (pB > 0) { var eb = clamp01(pB / 0.88); eb = 0.5 * (eb + eb * eb * (3 - 2 * eb)); z = lerp(BZ[BZ.length - 1], Z_END, eb); }
    var bf = sstep(0.0, 1.0, (1.0 - z) / 6.0);
    var cxp = cx(z) * bf + Math.sin(tt * 0.5) * 0.035 * bf;
    var cyp = lerp(lerp(0, 0.28, a), cy(z), bf) + Math.cos(tt * 0.4) * 0.02 * bf;
    camera.position.set(cxp, cyp, z);
    var lz = z - 5;
    var lx = lerp(0, cx(lz), bf), ly = lerp(cyp, cy(lz), bf), lzz = lz;
    for (var h = 0; h < projWorld.length; h++) {
      var w = holdW(h, p) * 0.92 * (1 - sstep(0.0, 0.18, pB));
      if (w > 0.001) { lx += (projWorld[h].x - lx) * w; ly += (projWorld[h].y - ly) * w; lzz += (projWorld[h].z - lzz) * w; }
    }
    camera.lookAt(lx, ly, lzz);
    camera.updateMatrixWorld(true);
    mouseWorld();

    for (var k = 0; k < projWorld.length; k++) {
      var el = labelEls[k];
      var dz = z - projWorld[k].z;
      var vis = sstep(10.5, 7.0, dz) * sstep(0.8, 3.0, dz) * U.uReveal.value;
      if (vis < 0.01) { el.style.opacity = 0; el.style.pointerEvents = 'none'; setTab(el, false); continue; }
      v3.copy(projWorld[k]).project(camera);
      var px = (v3.x * 0.5 + 0.5) * W, py = (-v3.y * 0.5 + 0.5) * Hh;
      var sizePx = Math.min(150, 0.4 * U.uScale.value / Math.max(dz, 0.5) / U.uPR.value);
      el.style.opacity = vis.toFixed(3);
      el.style.pointerEvents = vis > 0.6 ? 'auto' : 'none';
      setTab(el, vis > 0.6);
      el.style.transform = 'translate(' + px.toFixed(1) + 'px,' + (py + sizePx * 0.5 + 16).toFixed(1) + 'px) translateX(-50%)';
    }

    var fade = 1 - sstep(0.0, 0.8, sA);
    hero.style.opacity = fade; hint.style.opacity = fade;
    bar.style.transform = 'scaleY(' + ((p * A_VH + pB * B_VH) / (A_VH + B_VH)).toFixed(4) + ')';
    endEl.style.opacity = sstep(A_VH - 0.2, A_VH - 0.04, sA) * (1 - sstep(0.05, 0.3, pB));
    var ph = sA < 2.16 ? 'Retrato' : sA < 4.16 ? 'Entrada' : pB <= 0.02 ? 'Red neuronal' : pB < 0.9 ? 'Salida' : 'Contacto';
    if (ph !== lastPhase) { phase.textContent = ph; lastPhase = ph; }
    var chrome = 1 - curO;
    hud.style.opacity = chrome; rail.style.opacity = chrome;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
})();
