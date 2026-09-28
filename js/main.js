import { initScene } from './three-scene.js';
import { initUI } from './interactions.js';
initUI();
const reveal = () => document.body.classList.add('is-in');
try {
  initScene(document.getElementById('sword'), document.getElementById('stage'), reveal);
} catch (e) { console.warn('3D unavailable:', e); reveal(); }
