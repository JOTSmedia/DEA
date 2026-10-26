(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  try { paused = paused || sessionStorage.getItem('dea-motion-paused') === 'true'; } catch (_) {}
  const finishIntro = () => { setLoadProgress(100); root.classList.add('ready'); document.querySelector('.loader').setAttribute('inert', ''); setTimeout(() => { document.querySelector('.loader').style.display = 'none'; }, 650); };
  const heroImage = document.querySelector('.hero-world-image');
  const start = performance.now();
  Promise.race([Promise.all([heroImage.decode?.().catch(() => {}), document.querySelector('.hero-dea img').decode?.().catch(() => {}), document.fonts.ready]), new Promise(resolve => setTimeout(resolve, 10000))]).then(() => {
    setTimeout(finishIntro, Math.max(0, 4200 - (performance.now() - start)));
  });
  function setLoadProgress(value) {
    document.getElementById('load-progress').textContent = value + '%';
    const track = document.querySelector('.loader-track');
    document.querySelector('.loader').style.setProperty('--load-progress', String(value / 100));
    track.setAttribute('aria-valuenow', String(value));
  }
  let tick = setInterval(() => {
    if (root.classList.contains('ready')) { clearInterval(tick); return; }
    setLoadProgress(Math.min(99, Math.round((performance.now() - start) / 42)));
  }, 70);

  // The frosted background begins at the real portrait edge at every screen size.
  const portraitFigure = document.querySelector('.hero-dea');
  const portraitImage = portraitFigure.querySelector('img');
  const positionFrost = () => {
    const edge = portraitFigure.offsetTop + portraitImage.offsetTop + portraitImage.offsetHeight;
    document.querySelector('.hero-world').style.setProperty('--portrait-edge', `${edge}px`);
  };
  if ('ResizeObserver' in window) new ResizeObserver(positionFrost).observe(portraitFigure);
  addEventListener('resize', positionFrost);
  portraitImage.addEventListener('load', positionFrost);
  portraitImage.decode?.().then(positionFrost).catch(() => {});
  requestAnimationFrame(positionFrost);

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
    // Reduced motion preserves the requested loading time; only visual movement pauses.
    document.dispatchEvent(new CustomEvent('dea:motion', {detail: {paused}}));
  }
  motionButtons.forEach(button => button.addEventListener('click', () => { paused = !paused; try {sessionStorage.setItem('dea-motion-paused', String(paused));} catch (_) {} updateMotion(); updateScroll(); }));
  reduced.addEventListener('change', event => { paused = event.matches; updateMotion(); updateScroll(); });
  updateMotion();
  let ticking = false;
  const hero = document.querySelector('.hero-world');
  function updateScroll() {
    ticking = false;
    if (paused) { hero.style.setProperty('--scroll-progress', '0'); return; }
    const rect = hero.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
    hero.style.setProperty('--scroll-progress', progress.toFixed(3));
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
    self: { question: 'What feels like you?', description: 'Make space to explore your own voice, your values, and what you want from this next part of your life.', offer: 'A starting point: a conversation with Déa.', label: 'Ask about a consultation', href: '#contact', topic: 'Finding myself' },
    relationships: { question: 'What needs to change?', description: 'Bring the relationship questions you’ve been carrying. Begin a conversation about connection, communication, and what matters to you.', offer: 'A starting point: private coaching with Déa.', label: 'Ask about private coaching', href: '#contact', topic: 'Healthier relationships' },
    change: { question: 'What comes next?', description: 'A changing relationship or a new season of life can leave you with a lot to untangle. Start by sharing where you are today.', offer: 'A starting point: a conversation with Déa.', label: 'Ask about a consultation', href: '#contact', topic: 'Starting a new chapter' },
    community: { question: 'Who grows with you?', description: 'Explore The Radiant Woman, Déa’s mentorship community for women seeking personal growth and healthier relationships.', offer: 'A starting point: The Radiant Woman mentorship.', label: 'Explore the mentorship', href: '#mentorship', topic: 'The Radiant Woman mentorship' }
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
    preserveNameCase(answer);
    requestAnimationFrame(() => answer.classList.add('changing'));
  }));
  // Local details and enquiry destinations keep the reader within the site.
  const revealDestination = hash => {
    if (!hash || !hash.startsWith('#')) return;
    const destination = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (destination?.tagName === 'DETAILS') destination.open = true;
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    revealDestination(link.getAttribute('href'));
    if (link.dataset.topic) document.getElementById('enquiry-topic').value = link.dataset.topic;
  });
  addEventListener('hashchange', () => revealDestination(location.hash));
  revealDestination(location.hash);
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

  function initWorld() {
    const canvas = document.getElementById('world-light');
    const ctx = canvas.getContext('2d');
    let animationFrame = 0;
    let worldVisible = true;
    let width = 0, height = 0;
    let lights = [];
    function fit() {
      const box = hero.getBoundingClientRect();
      width=box.width; height=box.height;
      const density=Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width=Math.round(width*density); canvas.height=Math.round(height*density);
      ctx.setTransform(density,0,0,density,0,0);
      lights=Array.from({length: width < 900 ? 14 : 26}, (_,i)=>({x:(i*0.61803398875%1)*width,y:(i*0.371%1)*height,r:.7+(i%4)*.5,phase:i*1.7}));
    }
    function draw(time) {
      ctx.clearRect(0,0,width,height);
      if(paused || !worldVisible || document.hidden) { animationFrame=0; return; }
      lights.forEach(light=>{
        const x=light.x+Math.sin(time/10000+light.phase)*20;
        const y=(light.y-time/180+height*100)%height;
        const opacity=.13+(Math.sin(time/3600+light.phase)+1)*.13;
        ctx.beginPath();ctx.arc(x,y,light.r,0,Math.PI*2);ctx.fillStyle=`rgba(213,239,255,${opacity})`;ctx.fill();
      });
      animationFrame=requestAnimationFrame(draw);
    }
    function sync(){ if(animationFrame)cancelAnimationFrame(animationFrame);animationFrame=0;if(!paused&&worldVisible&&!document.hidden)animationFrame=requestAnimationFrame(draw);else ctx.clearRect(0,0,width,height); }
    fit(); sync();
    addEventListener('resize',()=>{fit();sync()},{passive:true});
    document.addEventListener('visibilitychange',sync);
    document.addEventListener('dea:motion',()=>{sync();if(paused)stopBreath();});
    new IntersectionObserver(entries=>{worldVisible=entries[0].isIntersecting;sync()}).observe(hero);
    hero.addEventListener('pointermove',event=>{if(paused||event.pointerType==='touch')return;const box=hero.getBoundingClientRect();hero.style.setProperty('--pointer-x',((event.clientX-box.left)/box.width-.5)*-16+'px');hero.style.setProperty('--pointer-y',((event.clientY-box.top)/box.height-.5)*-10+'px');},{passive:true});
    hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--pointer-x','0px');hero.style.setProperty('--pointer-y','0px');});
    const breathButton=document.getElementById('breath-button');
    const breathLabel=document.getElementById('breath-label');
    const breathStatus=document.querySelector('.breath-status');
    let breathTimer=0, breathStep=0;
    function stopBreath(){clearTimeout(breathTimer);breathTimer=0;hero.classList.remove('breathing-in');breathLabel.textContent='Take a moment';breathButton.setAttribute('aria-pressed','false');}
    function breathe(){
      if(breathStep>=6){stopBreath();breathStatus.textContent='A little space, just for you.';return;}
      const inward=breathStep%2===0;
      breathLabel.textContent=inward?'Breathe in':'Breathe out';
      breathStatus.textContent=breathLabel.textContent;
      hero.classList.toggle('breathing-in',inward&&!paused);
      breathStep++;breathTimer=setTimeout(breathe,4500);
    }
    breathButton.setAttribute('aria-pressed','false');
    breathButton.addEventListener('click',()=>{if(breathTimer){stopBreath();breathStatus.textContent='Moment paused.';}else{breathStep=0;breathButton.setAttribute('aria-pressed','true');breathe();}});
  }

  function preserveNameCase(container) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while(walker.nextNode()) if (/déa/i.test(walker.currentNode.nodeValue) && !walker.currentNode.parentElement.closest('.name-case,script,style,textarea,option')) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      node.nodeValue.split(/(déa)/i).forEach(part => {
        if (/^déa$/i.test(part)) { const span = document.createElement('span'); span.className='name-case'; span.textContent=node.parentElement.closest('.site-header,.mobile-menu,.site-footer,.loader') ? 'déa' : 'DÉA'; fragment.append(span); }
        else fragment.append(document.createTextNode(part));
      });
      node.replaceWith(fragment);
    });
  }
  document.getElementById('year').textContent = new Date().getFullYear();
  updateScroll();
  initWorld();
})();
