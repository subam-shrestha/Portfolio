const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const regen = () => document.dispatchEvent(new Event('regen'));

function split(el) { // wrap words for the masked rise-in reveal
  let d = 0;
  (function walk(n) {
    [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => {
          if (!t.trim()) return t && f.append(' ');
          const w = document.createElement('span'), i = document.createElement('span');
          w.className = 'w'; i.className = 'i'; i.style.transitionDelay = (d++ * .07) + 's'; i.textContent = t; w.append(i); f.append(w);
        });
        c.replaceWith(f);
      } else if (c.children?.length || c.tagName === 'EM') walk(c);
    });
  })(el);
}

export function initUI() {
  $('#yr').textContent = new Date().getFullYear();
  $$('.sp').forEach(split);
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: .15 });
  $$('.rv,.sp').forEach(el => io.observe(el));
  const links = $$('.nav nav a');
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting && links.forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id))), { rootMargin: '-45% 0px -50% 0px' })
    .observe && $$('main section').forEach(s => new IntersectionObserver(es => es.forEach(e => e.isIntersecting && links.forEach(a => a.classList.toggle('on', a.hash === '#' + s.id))), { rootMargin: '-45% 0px -50% 0px' }).observe(s));

  // scroll progress + parallax
  const prog = $('#prog');
  addEventListener('scroll', () => { const h = document.documentElement; prog.style.transform = `scaleX(${scrollY / (h.scrollHeight - innerHeight)})`; h.style.setProperty('--sy', scrollY); }, { passive: true });

  // custom cursor + magnetic buttons
  const cur = $('#cur');
  addEventListener('pointermove', e => { cur.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; cur.classList.add('on'); cur.classList.toggle('hot', !!e.target.closest('a,button,canvas')); }, { passive: true });
  $$('.mag').forEach(b => { b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; }); b.addEventListener('pointerleave', () => b.style.transform = ''); });

  // NPT clock, regenerate, Konami
  const clk = () => $('#clk').textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit' }); clk(); setInterval(clk, 30000);
  $('#regen').addEventListener('click', regen);
  const K = 'ArrowUp,ArrowUp,ArrowDown,ArrowDown,ArrowLeft,ArrowRight,ArrowLeft,ArrowRight,b,a'.split(','); let ki = 0;
  addEventListener('keydown', e => { ki = e.key === K[ki] ? ki + 1 : 0; if (ki === K.length) { ki = 0; regen(); document.documentElement.style.setProperty('--acc', '#ffb020'); } });

  // tabs
  $$('.tabs button').forEach(b => b.addEventListener('click', () => { $$('.tabs button,.gp').forEach(x => x.classList.remove('on')); b.classList.add('on'); $('#g-' + b.dataset.g).classList.add('on'); }));

  slashGame(); reflex(); guess(); duel();
}

function slashGame() {
  const cv = $('#arena'), c = cv.getContext('2d'), out = $('#sout'), W = cv.width, H = cv.height;
  let T = [], trail = [], score = 0, end = 0, run = false, next = 0, best = +localStorage.getItem('slashBest') || 0, down = false;
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
  cv.addEventListener('pointerdown', e => { down = true; cv.setPointerCapture(e.pointerId); });
  addEventListener('pointerup', () => down = false);
  cv.addEventListener('pointermove', e => {
    if (!down) return; const [x, y] = pos(e); trail.push({ x, y, l: 1 });
    if (run) T.forEach(t => { if (!t.dead && Math.hypot(t.x - x, t.y - y) < t.r + 6) { t.dead = 1; t.a = 1; score++; out.textContent = `Score ${score}`; } });
  });
  $('#sstart').addEventListener('click', () => { T = []; score = 0; run = true; end = performance.now() + 15000; next = 0; out.textContent = 'Score 0'; });
  (function loop(now) {
    requestAnimationFrame(loop); c.clearRect(0, 0, W, H);
    if (run) {
      if (now > next) { T.push({ x: 50 + Math.random() * (W - 100), y: 40 + Math.random() * (H - 80), r: 22 + Math.random() * 12, born: now, life: 1400 }); next = now + 380; }
      if (now > end) { run = false; if (score > best) { best = score; localStorage.setItem('slashBest', best); } out.textContent = `Time! Score ${score} · Best ${best}`; }
    }
    T = T.filter(t => t.dead ? (t.a -= .06) > 0 : now - t.born < t.life);
    T.forEach(t => { const p = t.dead ? 0 : (now - t.born) / t.life; c.strokeStyle = t.dead ? `rgba(242,239,233,${t.a})` : '#e5483d'; c.lineWidth = 2; c.beginPath(); c.arc(t.x, t.y, t.dead ? t.r * (2 - t.a) : t.r, 0, 6.3); c.stroke();
      if (!t.dead) { c.beginPath(); c.arc(t.x, t.y, t.r * (1 - p), 0, 6.3); c.fillStyle = 'rgba(229,72,61,.25)'; c.fill(); } });
    trail = trail.filter(p => (p.l -= .06) > 0); c.strokeStyle = '#f2efe9'; c.lineWidth = 3; c.lineCap = 'round';
    for (let i = 1; i < trail.length; i++) { c.globalAlpha = trail[i].l; c.beginPath(); c.moveTo(trail[i - 1].x, trail[i - 1].y); c.lineTo(trail[i].x, trail[i].y); c.stroke(); } c.globalAlpha = 1;
  })(0);
}

function reflex() {
  const b = $('#rt'), out = $('#rtout'); let s = 'idle', t0 = 0, tm, best = Infinity;
  b.addEventListener('click', () => {
    if (s === 'idle') { s = 'wait'; b.textContent = 'Wait…'; out.textContent = ''; tm = setTimeout(() => { s = 'go'; t0 = performance.now(); b.textContent = 'NOW'; b.classList.add('go-now'); }, 1000 + Math.random() * 2500); }
    else if (s === 'wait') { clearTimeout(tm); s = 'idle'; b.textContent = 'Too early. Try again'; }
    else { const ms = Math.round(performance.now() - t0); best = Math.min(best, ms); out.textContent = `${ms} ms · best ${best} ms`; s = 'idle'; b.classList.remove('go-now'); b.textContent = 'Again'; }
  });
}

function guess() { // a browser port of the Python Game Arcade idea
  let n = 1 + Math.floor(Math.random() * 100), tries = 0; const m = $('#gmsg'), i = $('#gin');
  const go = () => { const v = +i.value; if (!v) return; tries++; i.value = '';
    if (v === n) { m.textContent = `Got it: ${n} in ${tries} tries. New number ready.`; n = 1 + Math.floor(Math.random() * 100); tries = 0; }
    else m.textContent = `${v} is too ${v < n ? 'low' : 'high'}. Tries: ${tries}`; };
  $('#gbtn').addEventListener('click', go); i.addEventListener('keydown', e => e.key === 'Enter' && go());
}

function duel() {
  let me = 0, cpu = 0; const m = $('#pmsg'), N = ['Rock', 'Paper', 'Scissors'];
  $$('#g-rps [data-m]').forEach(b => b.addEventListener('click', () => {
    if (me === 2 || cpu === 2) me = cpu = 0;
    const a = +b.dataset.m, c = Math.floor(Math.random() * 3), r = (a - c + 3) % 3;
    if (r === 1) me++; else if (r === 2) cpu++;
    m.textContent = `${N[a]} vs ${N[c]}: ${r === 0 ? 'draw' : r === 1 ? 'you win the round' : 'I win the round'}. You ${me} — ${cpu} me${me === 2 ? ' · You win the duel!' : cpu === 2 ? ' · I win the duel.' : ''}`;
  }));
}
