/* ============================================================
   PARA VOCE -- SPA 3 ESTADOS  |  script.js
   Maquina de estados: Estado 1 → 2 → 3
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   ESTADO GLOBAL
   ───────────────────────────────────────────────────────────── */
let currentState = 1;
let currentSlide = 0;
const TOTAL_SLIDES = 4;

/* ─────────────────────────────────────────────────────────────
   REFERÊNCIAS DOM
   ───────────────────────────────────────────────────────────── */
const states = {
  1: document.getElementById('state-1'),
  2: document.getElementById('state-2'),
  3: document.getElementById('state-3'),
};

const envelopeScene = document.getElementById('envelope-scene');
const envWrap       = document.getElementById('env-wrap');
const envFlap       = document.getElementById('env-flap');

const slidesContainer = document.getElementById('slides-container');
const progressDots    = document.querySelectorAll('.progress-dot');

const bgMusic      = document.getElementById('bgMusic');
const musicToggle  = document.getElementById('music-toggle');

const canvas = document.getElementById('particle-canvas');
const ctx    = canvas.getContext('2d');

/* ─────────────────────────────────────────────────────────────
   ESTADO 1 — ABERTURA DO ENVELOPE
   ───────────────────────────────────────────────────────────── */
function openEnvelope() {
  if (currentState !== 1) return;

  // Adiciona classe para a animação CSS do envelope
  envWrap.classList.add('opening');

  // Após a animação, transiciona para Estado 2
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

/* ─────────────────────────────────────────────────────────────
   ESTADO 2 — SLIDESHOW DE MANGÁ
   ───────────────────────────────────────────────────────────── */
function showSlide(index) {
  const slides = slidesContainer.querySelectorAll('.slide');

  slides.forEach((slide, i) => {
    if (i === index) {
      slide.removeAttribute('hidden');
      // Dispara reflow para a animação funcionar ao ser exibido
      void slide.offsetWidth;
      slide.style.animation = 'none';
      void slide.offsetWidth;
      slide.style.animation = '';
    } else {
      slide.setAttribute('hidden', '');
    }
  });

  // Atualiza indicador de progresso
  progressDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });

  currentSlide = index;
}

// Delegação de evento nos botões de avanço
slidesContainer.addEventListener('click', e => {
  const btn = e.target.closest('.btn-advance');
  if (!btn) return;

  const next = btn.dataset.next;

  if (next === 'final') {
    // Último slide → vai para Estado 3
    goToState(3);
  } else {
    showSlide(parseInt(next, 10));
    // Rola suave para o topo do estado
    states[2].scrollTo({ top: 0, behavior: 'smooth' });
  }
});

/* ─────────────────────────────────────────────────────────────
   ESTADO 3 — DESTINO FINAL
   ───────────────────────────────────────────────────────────── */
function initState3() {
  // Torna os mini envelopes visíveis
  document.querySelectorAll('.mini-env').forEach(env => {
    env.classList.add('visible');
  });

  // Botão de música
  musicToggle.removeAttribute('hidden');

  // Tenta tocar a música principal
  tryPlayMusic();
}

function tryPlayMusic() {
  if (!bgMusic || !bgMusic.src || bgMusic.src.endsWith('/')) return;
  bgMusic.play().then(() => {
    musicToggle.setAttribute('aria-pressed', 'true');
    musicToggle.classList.remove('paused');
    musicToggle.querySelector('.music-icon').textContent = '♪';
  }).catch(() => {
    // Autoplay bloqueado — o usuário precisará tocar manualmente
    musicToggle.setAttribute('aria-pressed', 'false');
    musicToggle.classList.add('paused');
  });
}

// Play / Pause da música principal
musicToggle.addEventListener('click', () => {
  if (bgMusic.paused) {
    bgMusic.play().then(() => {
      musicToggle.setAttribute('aria-pressed', 'true');
      musicToggle.classList.remove('paused');
      musicToggle.querySelector('.music-icon').textContent = '♪';
    });
  } else {
    bgMusic.pause();
    musicToggle.setAttribute('aria-pressed', 'false');
    musicToggle.classList.add('paused');
    musicToggle.querySelector('.music-icon').textContent = '▐▐';
  }
});

/* ─────────────────────────────────────────────────────────────
   MODAIS DAS CARTINHAS FLUTUANTES
   ───────────────────────────────────────────────────────────── */
let activeModal = null;

// Abrir modal
document.querySelectorAll('.mini-env').forEach(btn => {
  btn.addEventListener('click', () => {
    const modalId = btn.dataset.modal;
    if (!modalId) return;
    openModal(modalId);
  });
});

function openModal(modalId) {
  // Fecha qualquer modal aberto
  if (activeModal) closeModal(activeModal, false);

  const modal = document.getElementById(modalId);
  if (!modal) return;

  modal.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  activeModal = modal;

  // Foca o botão de fechar para acessibilidade
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) closeBtn.focus();

  // Fecha ao clicar no overlay
  const overlay = modal.querySelector('.modal-overlay');
  overlay.addEventListener('click', () => closeModal(modal, true), { once: true });
}

function closeModal(modal, pauseAudio) {
  if (!modal) return;
  if (pauseAudio !== false) {
    const audio = modal.querySelector('.carta-audio');
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      const btn = modal.querySelector('.btn-audio-play');
      if (btn) {
        btn.classList.remove('playing');
        btn.querySelector('.audio-play-icon').textContent = '▶';
        btn.querySelector('.audio-play-label').textContent = 'Ouvir música';
      }
    }
  }
  modal.setAttribute('hidden', '');
  document.body.style.overflow = '';
  activeModal = null;
}

// Fechar ao clicar no botão ✕
document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal');
    closeModal(modal, true);
  });
});

// Fechar com tecla Esc
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && activeModal) {
    closeModal(activeModal, true);
  }
});

// Players de áudio das cartas
document.querySelectorAll('.btn-audio-play').forEach(btn => {
  const modal = btn.closest('.modal');
  const audio = modal.querySelector('.carta-audio');
  if (!audio) return;

  btn.addEventListener('click', () => {
    if (audio.paused) {
      // Pausa qualquer outro áudio de carta tocando
      document.querySelectorAll('.carta-audio').forEach(a => {
        if (a !== audio && !a.paused) {
          a.pause();
          a.currentTime = 0;
          const otherModal = a.closest('.modal');
          if (otherModal) {
            const otherBtn = otherModal.querySelector('.btn-audio-play');
            if (otherBtn) {
              otherBtn.classList.remove('playing');
              otherBtn.querySelector('.audio-play-icon').textContent = '▶';
              otherBtn.querySelector('.audio-play-label').textContent = 'Ouvir música';
            }
          }
        }
      });
      audio.play().then(() => {
        btn.classList.add('playing');
        btn.querySelector('.audio-play-icon').textContent = '■';
        btn.querySelector('.audio-play-label').textContent = 'Pausar';
      }).catch(() => {/* audio nao disponivel */});
    } else {
      audio.pause();
      btn.classList.remove('playing');
      btn.querySelector('.audio-play-icon').textContent = '▶';
      btn.querySelector('.audio-play-label').textContent = 'Ouvir música';
    }
  });

  // Ao terminar a música da carta, reseta o botão
  audio.addEventListener('ended', () => {
    btn.classList.remove('playing');
    btn.querySelector('.audio-play-icon').textContent = '▶';
    btn.querySelector('.audio-play-label').textContent = 'Ouvir música';
  });
});

/* ─────────────────────────────────────────────────────────────
   MÁQUINA DE ESTADOS — TRANSIÇÃO ENTRE ESTADOS
   ───────────────────────────────────────────────────────────── */
function goToState(next) {
  if (next === currentState) return;

  const from = states[currentState];
  const to   = states[next];

  // Oculta o estado atual
  from.classList.remove('state--active');
  from.setAttribute('hidden', '');

  // Mostra o próximo estado com animação
  to.removeAttribute('hidden');
  to.classList.add('state--active');
  requestAnimationFrame(() => {
    to.classList.add('fade-enter');
    to.addEventListener('animationend', () => to.classList.remove('fade-enter'), { once: true });
  });

  // Rola para o topo da página
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Configurações específicas de cada estado
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

/* ─────────────────────────────────────────────────────────────
   CANVAS — PARTÍCULAS FLUTUANTES (corações e pétalas)
   ───────────────────────────────────────────────────────────── */
let particleMode = 'light'; // 'light' | 'dark'

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas, { passive: true });

class Particle {
  constructor(randomY) {
    this.init(randomY);
  }
  init(randomY) {
    this.x     = Math.random() * canvas.width;
    this.y     = randomY ? Math.random() * canvas.height : canvas.height + 16;
    this.size  = 6 + Math.random() * 10;
    this.vx    = (Math.random() - 0.5) * 0.45;
    this.vy    = -(0.3 + Math.random() * 0.6);
    this.alpha = 0.07 + Math.random() * 0.14;
    this.rot   = Math.random() * Math.PI * 2;
    this.rspd  = (Math.random() - 0.5) * 0.016;
    this.type  = Math.random() < 0.5 ? 'heart' : 'petal';
  }
  update() {
    this.x    += this.vx;
    this.y    += this.vy;
    this.rot  += this.rspd;
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
      ctx.bezierCurveTo(0, -r*0.4, -r*1.1, -r*0.4, -r*1.1, r*0.2);
      ctx.bezierCurveTo(-r*1.1, r*0.8, 0, r*1.4, 0, r*1.4);
      ctx.bezierCurveTo(0, r*1.4, r*1.1, r*0.8, r*1.1, r*0.2);
      ctx.bezierCurveTo(r*1.1, -r*0.4, 0, -r*0.4, 0, r*0.3);
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

/* ─────────────────────────────────────────────────────────────
   CLICK HEARTS (toque em qualquer lugar)
   ───────────────────────────────────────────────────────────── */
const HEARTS = ['🖤','❤️','🌸','💗','✨','🌷'];

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
  // Nao spawn dentro de modais ou botoes principais
  if (e.target.closest('.modal-box') && !e.target.closest('.modal-overlay')) return;
  spawnHeart(e.clientX, e.clientY);
});

document.addEventListener('touchstart', e => {
  const t = e.touches[0];
  spawnHeart(t.clientX, t.clientY);
}, { passive: true });

// Injeta o keyframe via JS (compatibilidade)
const style = document.createElement('style');
style.textContent = `
  @keyframes clickHeartAnim {
    0%   { opacity:1; transform:translate(-50%,-50%) scale(0.5) rotate(0deg); }
    50%  { opacity:0.9; transform:translate(-50%,-130%) scale(1.2) rotate(14deg); }
    100% { opacity:0; transform:translate(-50%,-210%) scale(0.5) rotate(-8deg); }
  }
`;
document.head.appendChild(style);