'use strict';

let currentState = 1;
let currentSlide = 0;
const TOTAL_SLIDES = 4;
let wasBgMusicPlaying = false;

const states = {
  1: document.getElementById('state-1'),
  2: document.getElementById('state-2'),
  3: document.getElementById('state-3'),
};

const envelopeScene = document.getElementById('envelope-scene');
const envWrap = document.getElementById('env-wrap');
const envFlap = document.getElementById('env-flap');

const slidesContainer = document.getElementById('slides-container');
const progressDots = document.querySelectorAll('.progress-dot');

const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('music-toggle');

const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');

function openEnvelope() {
  if (currentState !== 1) return;

  // Inicia a música principal no momento do clique no envelope
  tryPlayMusic();
  if (musicToggle) musicToggle.removeAttribute('hidden');

  envWrap.classList.add('opening');
  setTimeout(() => {
    goToState(2);
  }, 950);
}

envelopeScene.addEventListener('click', openEnvelope);
envelopeScene.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openEnvelope();
  }
});

function showSlide(index) {
  const slides = slidesContainer.querySelectorAll('.slide');
  slides.forEach((slide, i) => {
    if (i === index) {
      slide.removeAttribute('hidden');
      void slide.offsetWidth;
      slide.style.animation = 'none';
      void slide.offsetWidth;
      slide.style.animation = '';
    } else {
      slide.setAttribute('hidden', '');
    }
  });

  progressDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  currentSlide = index;
}

slidesContainer.addEventListener('click', e => {
  const btn = e.target.closest('.btn-advance');
  if (!btn) return;

  const next = btn.dataset.next;
  if (next === 'final') {
    goToState(3);
  } else {
    showSlide(parseInt(next, 10));
    states[2].scrollTo({ top: 0, behavior: 'smooth' });
  }
});

function initState3() {
  document.querySelectorAll('.mini-env').forEach(env => {
    env.classList.add('visible');
  });

  if (musicToggle) musicToggle.removeAttribute('hidden');
  tryPlayMusic();
}

function tryPlayMusic() {
  if (!bgMusic || !bgMusic.src || bgMusic.src.endsWith('/')) return;
  if (!bgMusic.paused) return;
  bgMusic.play().catch(() => { });
}

if (bgMusic && musicToggle) {
  bgMusic.addEventListener('play', () => {
    musicToggle.setAttribute('aria-pressed', 'true');
    musicToggle.classList.remove('paused');
    musicToggle.querySelector('.music-icon').textContent = '♪';
  });

  bgMusic.addEventListener('pause', () => {
    musicToggle.setAttribute('aria-pressed', 'false');
    musicToggle.classList.add('paused');
    musicToggle.querySelector('.music-icon').textContent = '▐▐';
  });

  musicToggle.addEventListener('click', () => {
    if (bgMusic.paused) {
      bgMusic.play().catch(() => { });
    } else {
      bgMusic.pause();
    }
  });
}

let activeModal = null;

document.querySelectorAll('.mini-env').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.dataset.modal;
    if (!modalId) return;
    openModal(modalId);
  });
});

function openModal(modalId) {
  if (activeModal) closeModal(activeModal);

  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  activeModal = modal;

  // Pausa a música principal para dar lugar à música da carta
  if (bgMusic && !bgMusic.paused) {
    bgMusic.pause();
    wasBgMusicPlaying = true;
  }

  const audio = modal.querySelector('.carta-audio');
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => { });
  }

  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) closeBtn.focus();

  const overlay = modal.querySelector('.modal-overlay');
  overlay.addEventListener('click', () => closeModal(modal), { once: true });
}

function closeModal(modal) {
  if (!modal) return;
  const audio = modal.querySelector('.carta-audio');
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
  }

  // Quando sair da carta, a música principal volta
  if (wasBgMusicPlaying && bgMusic) {
    bgMusic.play().catch(() => { });
    wasBgMusicPlaying = false;
  }

  modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
  activeModal = null;
}

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal');
    closeModal(modal);
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && activeModal) {
    closeModal(activeModal);
  }
});

function goToState(next) {
  if (next === currentState) return;

  if (activeModal) closeModal(activeModal);

  const from = states[currentState];
  const to = states[next];

  from.classList.remove('state--active');
  from.setAttribute('hidden', '');

  to.removeAttribute('hidden');
  to.classList.add('state--active');
  requestAnimationFrame(() => {
    to.classList.add('fade-enter');
    to.addEventListener('animationend', () => to.classList.remove('fade-enter'), { once: true });
  });

  window.scrollTo({ top: 0, behavior: 'instant' });

  if (next === 2) {
    showSlide(0);
    updateParticleMode('dark');
  }
  if (next === 3) {
    initState3();
    updateParticleMode('light');
  }
  if (next === 1) {
    updateParticleMode('light');
  }

  currentState = next;
  document.body.dataset.state = next;
}

let particleMode = 'light';

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });

class Particle {
  constructor(randomY) {
    this.init(randomY);
  }
  init(randomY) {
    this.x = Math.random() * canvas.width;
    this.y = randomY ? Math.random() * canvas.height : canvas.height + 16;
    this.size = 6 + Math.random() * 10;
    this.vx = (Math.random() - 0.5) * 0.45;
    this.vy = -(0.3 + Math.random() * 0.6);
    this.alpha = 0.07 + Math.random() * 0.14;
    this.rot = Math.random() * Math.PI * 2;
    this.rspd = (Math.random() - 0.5) * 0.016;
    this.type = Math.random() < 0.5 ? 'heart' : 'petal';
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rot += this.rspd;
    this.alpha -= 0.0003;
    if (this.y < -20 || this.alpha <= 0) this.init(false);
  }
  draw() {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    if (this.type === 'heart') {
      const r = this.size * 0.42;
      ctx.fillStyle = particleMode === 'dark'
        ? 'rgba(255,255,255,0.9)'
        : 'rgba(217,139,139,0.9)';
      ctx.beginPath();
      ctx.moveTo(0, r * 0.3);
      ctx.bezierCurveTo(0, -r * 0.4, -r * 1.1, -r * 0.4, -r * 1.1, r * 0.2);
      ctx.bezierCurveTo(-r * 1.1, r * 0.8, 0, r * 1.4, 0, r * 1.4);
      ctx.bezierCurveTo(0, r * 1.4, r * 1.1, r * 0.8, r * 1.1, r * 0.2);
      ctx.bezierCurveTo(r * 1.1, -r * 0.4, 0, -r * 0.4, 0, r * 0.3);
      ctx.closePath();
    } else {
      ctx.fillStyle = particleMode === 'dark'
        ? 'rgba(190,190,190,0.6)'
        : 'rgba(240,196,196,0.7)';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 0.45, this.size * 1.0, 0, 0, Math.PI * 2);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
  }
}

function updateParticleMode(mode) { particleMode = mode; }

const particles = Array.from({ length: 28 }, (_, i) => new Particle(true));

(function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animate);
})();

const HEARTS = ['🖤', '❤️', '🌸', '💗', '✨', '🌷'];

function spawnHeart(x, y) {
  const el = document.createElement('span');
  el.style.cssText = [
    'position:fixed',
    'left:' + x + 'px',
    'top:' + y + 'px',
    'transform:translate(-50%,-50%) scale(0.4)',
    'font-size:1.3rem',
    'pointer-events:none',
    'z-index:9999',
    'user-select:none',
    'animation:clickHeartAnim 0.95s ease forwards',
  ].join(';');
  el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

document.addEventListener('click', e => {
  if (e.target.closest('.modal-box') && !e.target.closest('.modal-overlay')) return;
  spawnHeart(e.clientX, e.clientY);
});

document.addEventListener('touchstart', e => {
  const t = e.touches[0];
  spawnHeart(t.clientX, t.clientY);
}, { passive: true });

const style = document.createElement('style');
style.textContent = `
  @keyframes clickHeartAnim {
    0%   { opacity:1; transform:translate(-50%,-50%) scale(0.5) rotate(0deg); }
    50%  { opacity:0.9; transform:translate(-50%,-130%) scale(1.2) rotate(14deg); }
    100% { opacity:0; transform:translate(-50%,-210%) scale(0.5) rotate(-8deg); }
  }
`;
document.head.appendChild(style);