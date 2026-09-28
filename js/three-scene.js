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
  const rim = new THREE.DirectionalLight(0x8f9bff, 2.4); rim.position.set(-4, 1, -3);
  const glint = new THREE.PointLight(0xdfe4ff, 0, 6); glint.position.z = 1.2;
  scene.add(key, rim, glint, new THREE.AmbientLight(0xffffff, 0.15));

  const root = new THREE.Group(), tilt = new THREE.Group(), spin = new THREE.Group();
  root.add(tilt); tilt.add(spin); scene.add(root);
  root.rotation.z = -0.3; // diagonal, like a sword resting at an angle

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
    m.traverse(o => { if (o.isMesh) { o.material.envMapIntensity = 0.9; if (o.material.map) o.material.map.anisotropy = mobile ? 2 : 8; } });
    ready = true; t0 = performance.now(); document.body.classList.add('ready');
    setTimeout(onIntro, still ? 0 : 1400);
  }, undefined, e => { console.warn('GLB failed (serve over http/https, not file://)', e); onIntro(); });

  // mouse tilt, drag to rotate, click to slash
  let mx = 0, my = 0, yaw = 0, vel = 0, drag = false, moved = 0, lastX = 0, idle = 0, slash = -1;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
  canvas.addEventListener('pointerdown', e => { drag = true; moved = 0; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); vel = dx * 0.01; yaw += vel; idle = 0; });
  canvas.addEventListener('pointerup', () => { if (drag && moved < 5 && slash < 0) slash = 0; drag = false; });
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
    r.toneMappingExposure = 1.05 * ease(Math.min(t / 2.2, 1));           // emerge from dark
    const a = ease(Math.min(t / 2.8, 1)); root.position.y = -0.7 * (1 - a); root.scale.setScalar(.94 + .06 * a);
    const g = (t - 2) / 1.3, h = spin.userData.half;                     // glint travels the blade
    glint.intensity = g > 0 && g < 1 ? 14 * Math.sin(g * Math.PI) : 0; glint.position.y = h - g * 2 * h;
    tx += (mx * .35 - tx) * .06; ty += (my * .2 - ty) * .06;              // mouse tilt + parallax
    tilt.rotation.set(ty, tx, 0); root.position.x = tx * .35;
    key.position.x = 3 + mx * 4; key.position.y = 4 - my * 3;
    if (!drag) { yaw += vel; vel *= .92; idle += dt; if (idle > 3.5 && slash < 0) yaw += (Math.round(yaw / (2 * Math.PI)) * 2 * Math.PI - yaw) * .03; }
    let extra = 0;
    if (slash >= 0) { slash += dt / .9; extra = ease(Math.min(slash, 1)) * Math.PI * 2; glint.intensity = Math.max(glint.intensity, 10 * Math.sin(Math.min(slash, 1) * Math.PI)); glint.position.y = 0; if (slash >= 1) { slash = -1; yaw += Math.PI * 2; extra = 0; } }
    spin.rotation.y = yaw + extra;
    r.render(scene, cam);
  })(performance.now());
}
