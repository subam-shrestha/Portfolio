export function initUI() {
  document.getElementById('yr').textContent = new Date().getFullYear();
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: .15 });
  document.querySelectorAll('.rv').forEach(el => io.observe(el));
  const links = [...document.querySelectorAll('.nav nav a')];
  const so = new IntersectionObserver(es => es.forEach(e => e.isIntersecting &&
    links.forEach(a => a.classList.toggle('on', a.hash === '#' + e.target.id))), { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section').forEach(s => so.observe(s));
  // Reflex test: the one small easter egg.
  const b = document.getElementById('rt'), out = document.getElementById('rtout');
  let state = 'idle', t0 = 0, timer, best = Infinity;
  b.addEventListener('click', () => {
    if (state === 'idle') {
      state = 'wait'; b.textContent = 'Wait…'; out.textContent = '';
      timer = setTimeout(() => { state = 'go'; t0 = performance.now(); b.textContent = 'Now!'; b.classList.add('go-now'); }, 1000 + Math.random() * 2500);
    } else if (state === 'wait') {
      clearTimeout(timer); state = 'idle'; b.textContent = 'Too early — try again';
    } else {
      const ms = Math.round(performance.now() - t0); best = Math.min(best, ms);
      out.textContent = `${ms} ms · best ${best} ms`; state = 'idle'; b.classList.remove('go-now'); b.textContent = 'Again';
    }
  });
}
