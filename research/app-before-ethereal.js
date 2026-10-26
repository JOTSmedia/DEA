(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  try { paused = paused || sessionStorage.getItem('dea-motion-paused') === 'true'; } catch (_) {}
  const finishIntro = () => { root.classList.add('ready'); document.querySelector('.loader').setAttribute('inert', ''); setTimeout(() => { document.querySelector('.loader').style.display = 'none'; }, 850); };
  const heroImage = document.querySelector('.hero-portrait img');
  const start = performance.now();
  Promise.race([Promise.all([heroImage.decode?.().catch(() => {}), document.fonts.ready]), new Promise(resolve => setTimeout(resolve, 1400))]).then(() => {
    setTimeout(finishIntro, paused ? 0 : Math.max(0, 950 - (performance.now() - start)));
  });
  document.getElementById('skip-intro').addEventListener('click', finishIntro);
  let tick = setInterval(() => {
    if (root.classList.contains('ready')) { clearInterval(tick); return; }
    document.getElementById('load-progress').textContent = Math.min(99, Math.round((performance.now() - start) / 14)) + '%';
  }, 70);

  const revealItems = [...document.querySelectorAll('[data-reveal], [data-image-reveal]')];
  if ('IntersectionObserver' in window && !paused) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.remove('pending'); entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    revealItems.forEach(el => { if (el.getBoundingClientRect().top > innerHeight) el.classList.add('pending'); observer.observe(el); });
  }
  const motionButtons = document.querySelectorAll('.motion-toggle');
  function updateMotion() {
    root.classList.toggle('motion-paused', paused);
    motionButtons.forEach(button => { button.setAttribute('aria-pressed', String(paused)); button.innerHTML = (paused ? 'Enable motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>'); });
    if (paused) finishIntro();
  }
  motionButtons.forEach(button => button.addEventListener('click', () => { paused = !paused; try {sessionStorage.setItem('dea-motion-paused', String(paused));} catch (_) {} updateMotion(); updateScroll(); }));
  reduced.addEventListener('change', event => { paused = event.matches; updateMotion(); updateScroll(); });
  updateMotion();
  let ticking = false;
  const hero = document.querySelector('.hero-run');
  function updateScroll() {
    ticking = false;
    if (paused || innerWidth <= 900) { heroImage.style.transform = ''; return; }
    const rect = hero.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
    heroImage.style.transform = `scale(${1.02 + progress * .07}) translateY(${progress * -1.6}%)`;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  addEventListener('resize', updateScroll, { passive: true });

  const menuButton = document.querySelector('.menu-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  function closeMenu() { menuButton.setAttribute('aria-expanded','false'); menuButton.setAttribute('aria-label','Open menu'); mobileMenu.hidden = true; }
  menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); mobileMenu.hidden = !open; });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileMenu.hidden) { closeMenu(); menuButton.focus(); } });
  window.matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  const paths = {
    self: { question: 'What feels most like you?', description: 'Make space to explore your own voice, your values, and what you want from this next part of your life.', offer: 'A starting point: a conversation with Déa.', label: 'Explore a consultation', href: 'https://www.coachingwithdea.com/book-online', topic: 'Finding myself' },
    relationships: { question: 'What needs to change?', description: 'Bring the relationship questions you’ve been carrying. Begin a conversation about connection, communication, and what matters to you.', offer: 'A starting point: private coaching with Déa.', label: 'Explore private coaching', href: 'https://www.coachingwithdea.com/book-online', topic: 'Healthier relationships' },
    change: { question: 'What comes next?', description: 'A changing relationship or a new season of life can leave you with a lot to untangle. Start by sharing where you are today.', offer: 'A starting point: a conversation with Déa.', label: 'Explore a consultation', href: 'https://www.coachingwithdea.com/book-online', topic: 'Starting a new chapter' },
    community: { question: 'Who grows with you?', description: 'Explore The Radiant Woman, Déa’s mentorship community for women seeking personal growth and healthier relationships.', offer: 'A starting point: The Radiant Woman mentorship.', label: 'Explore the mentorship', href: 'https://www.coachingwithdea.com/webinar-registration', topic: 'The Radiant Woman mentorship' }
  };
  document.querySelectorAll('.path-choice').forEach(button => button.addEventListener('click', () => {
    const path = paths[button.dataset.path];
    document.querySelectorAll('.path-choice').forEach(el => { const selected = el === button; el.classList.toggle('active', selected); el.setAttribute('aria-pressed', String(selected)); });
    const answer = document.querySelector('.path-answer');
    answer.classList.remove('changing');
    document.getElementById('path-question').textContent = path.question;
    document.getElementById('path-description').textContent = path.description;
    document.getElementById('path-offer').textContent = path.offer;
    const link = document.getElementById('path-link'); link.href = path.href; link.textContent = path.label;
    document.getElementById('enquiry-topic').value = path.topic;
    requestAnimationFrame(() => answer.classList.add('changing'));
  }));
  const form = document.getElementById('enquiry-form');
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const name = form.elements.name.value.trim();
    if (!name) { form.elements.name.setCustomValidity('Please enter your name.'); form.elements.name.reportValidity(); return; }
    const topic = form.elements.topic.value;
    const message = form.elements.message.value.trim();
    const subject = `Coaching enquiry — ${topic}`;
    const body = `Hi Déa,\n\nMy name is ${name}. I’d like to talk about ${topic.toLowerCase()}.\n\n${message ? message + '\n\n' : ''}I’d love to learn more about working with you.\n\nThank you,\n${name}`;
    const emailLink = 'mailto:coachingwithdea@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    const status = document.getElementById('form-status');
    status.textContent = 'Your message is ready. Complete and send it in your email app. If it didn’t open, use the email link below.';
    document.querySelector('.direct-email').href = emailLink;
    window.location.href = emailLink;
  });
  form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''));
  const creditToggle = document.querySelector('.credits-toggle');
  creditToggle.addEventListener('click', () => { const panel = document.getElementById('photo-credits'); panel.hidden = !panel.hidden; creditToggle.setAttribute('aria-expanded', String(!panel.hidden)); });
  document.getElementById('year').textContent = new Date().getFullYear();
  updateScroll();
})();
