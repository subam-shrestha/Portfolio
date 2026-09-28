import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const FLIP = false; // set true if the blade tip points down
export function initScene(canvas, host, onIntro) {
  const mobile = matchMedia('(max-width:800px)').matches;
  const still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const r = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true });
  r.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 0;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(r).fromScene(new RoomEnvironment(), 0.04).texture;
  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50); cam.position.z = 11;
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xff6a55, 2.6); rim.position.set(-4, 1, -3);
  const glint = new THREE.PointLight(0xdfe4ff, 0, 6); glint.position.z = 1.2;
  const fire = new THREE.PointLight(0xff4a2a, 0, 7); fire.position.z = 1.6;
  scene.add(key, rim, glint, fire, new THREE.AmbientLight(0xffffff, 0.15));

  const root = new THREE.Group(), tilt = new THREE.Group(), spin = new THREE.Group();
  root.add(tilt); tilt.add(spin); scene.add(root);
  root.rotation.z = -0.3; // diagonal, like a sword resting at an angle

  const U = { uP: { value: -9 }, uT: { value: 0 } }; const seen = new Set();
  const patch = mat => { if (seen.has(mat)) return; seen.add(mat); mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvW=(modelMatrix*vec4(position,1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;uniform float uP,uT;\nfloat hh(vec3 p){return fract(sin(dot(p,vec3(12.9,78.2,37.7)))*43758.5);}')
      .replace('#include <alphatest_fragment>', '#include <alphatest_fragment>\nfloat dd=vW.y-uP+(hh(floor(vW*36.+floor(uT*14.)))-.5)*.3;if(dd>0.)discard;float eg=smoothstep(-.4,0.,dd);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(4.,.8,.4)*eg*eg;'); }; };
  const N = 240, sp = new Float32Array(N * 3).fill(-99), sv = new Float32Array(N * 3), sl = new Float32Array(N); let si = 0;
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const pts = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xff6a3d, size: .055, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); pts.frustumCulled = false; scene.add(pts);
  const emit = (y, n, w = .5) => { for (let k = 0; k < n; k++) { const i = si++ % N; sp.set([(Math.random() - .5) * w + root.position.x, y, (Math.random() - .5) * .4], i * 3); sv.set([(Math.random() - .5) * 1.4, Math.random() * 1.6 + .3, (Math.random() - .5) * .8], i * 3); sl[i] = 1; } };
  const H = 4.4; let ready = false, t0 = 0;
  new GLTFLoader().load('assets/shusui.glb', gltf => {
    const m = gltf.scene, s = new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3());
    const holder = new THREE.Group(); holder.add(m); spin.add(holder);
    if (s.z >= s.x && s.z >= s.y) holder.rotation.x = -Math.PI / 2;      // long axis -> Y
    else if (s.x >= s.y) holder.rotation.z = Math.PI / 2;
    if (FLIP) holder.rotation.z += Math.PI;
    holder.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(holder), c = b2.getCenter(new THREE.Vector3()), k = H / b2.getSize(new THREE.Vector3()).y;
    holder.position.sub(c); spin.scale.setScalar(k); spin.userData.half = H / 2;
    m.traverse(o => { if (o.isMesh) { patch(o.material); o.material.envMapIntensity = 0.9; if (o.material.map) o.material.map.anisotropy = mobile ? 2 : 8; } });
    ready = true; t0 = performance.now(); document.body.classList.add('ready');
    setTimeout(onIntro, still ? 0 : 900);
  }, undefined, e => { console.warn('GLB failed (serve over http/https, not file://)', e); onIntro(); });

  // mouse tilt, drag to rotate, click to slash
  let mx = 0, my = 0, yaw = 0, vel = 0, drag = false, moved = 0, lastX = 0, idle = 0, slash = -1;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  canvas.addEventListener('pointerdown', e => { drag = true; moved = 0; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); vel = dx * 0.01; yaw += vel; idle = 0; });
  canvas.addEventListener('pointerup', () => { if (drag && moved < 5 && slash < 0) { slash = 0; emit(0, 60, 1.2); } drag = false; });
  document.addEventListener('regen', () => { t0 = performance.now(); });
  canvas.addEventListener('pointercancel', () => drag = false);

  const fit = () => { const w = host.clientWidth, h = host.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  new ResizeObserver(fit).observe(host); fit();
  let visible = true; new IntersectionObserver(([e]) => visible = e.isIntersecting).observe(host);

  const ease = x => 1 - Math.pow(1 - x, 3);
  let last = performance.now(), tx = 0, ty = 0;
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!visible || !ready) return;
    const dt = Math.min((now - last) / 1000, .05); last = now;
    const t = still ? 99 : (now - t0) / 1000;
    const rg = Math.min(Math.max((t - .2) / 2.2, 0), 1), front = -2.8 + ease(rg) * 5.6;   // regeneration sweep, bottom to top
    U.uP.value = rg >= 1 ? 99 : front; U.uT.value = t;
    const fl = Math.max(0, 1 - Math.abs(t - 2.5) / .3) * 1.1;                              // flash as it completes
    r.toneMappingExposure = 1.05 * ease(Math.min(t / .5, 1)) + fl;
    fire.intensity = rg > 0 && rg < 1 ? 30 : fl * 40; fire.position.y = front; if (rg > 0 && rg < 1) emit(front, 7);
    root.scale.setScalar(.96 + .04 * ease(Math.min(t / 2.6, 1)));
    const g = (t - 2.6) / 1.3, h = spin.userData.half;                                     // glint travels the blade
    glint.intensity = g > 0 && g < 1 ? 14 * Math.sin(g * Math.PI) : 0; glint.position.y = h - g * 2 * h;
    for (let i = 0; i < N; i++) { if (sl[i] > 0) { sl[i] -= dt * 1.1; sp[i * 3] += sv[i * 3] * dt; sp[i * 3 + 1] += sv[i * 3 + 1] * dt; sv[i * 3 + 1] -= dt * 1.6; sp[i * 3 + 2] += sv[i * 3 + 2] * dt; } else sp[i * 3 + 1] = -99; }
    sg.attributes.position.needsUpdate = true;
    tx += (mx * .35 - tx) * .06; ty += (my * .2 - ty) * .06;              // mouse tilt + parallax
    tilt.rotation.set(ty, tx, 0); root.position.x = tx * .35;
    key.position.x = 3 + mx * 4; key.position.y = 4 - my * 3;
    if (!drag) { yaw += vel; vel *= .92; idle += dt; if (idle > 3.5 && slash < 0) yaw += (Math.round(yaw / (2 * Math.PI)) * 2 * Math.PI - yaw) * .03; }
    let extra = 0;
    if (slash >= 0) { slash += dt / .9; extra = ease(Math.min(slash, 1)) * Math.PI * 2; glint.intensity = Math.max(glint.intensity, 10 * Math.sin(Math.min(slash, 1) * Math.PI)); glint.position.y = 0; if (slash < .5) emit((Math.random() - .5) * 4, 2, 1); if (slash >= 1) { slash = -1; yaw += Math.PI * 2; extra = 0; } }
    spin.rotation.y = yaw + extra;
    r.render(scene, cam);
  })(performance.now());
}
