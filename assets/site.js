(() => {
  'use strict';
  const header = document.querySelector('.header');
  const button = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#navigation');
  if (!header || !button || !nav) return;
  const mobile = matchMedia('(max-width: 980px)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const setOpen = (open, returnFocus = false) => {
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.querySelector('span').textContent = open ? 'Cerrar' : 'Menú';
    document.documentElement.classList.toggle('menu-abierto', open);
    nav.inert = mobile.matches && !open;
    if (returnFocus) button.focus();
  };
  button.hidden = false;
  document.documentElement.classList.add('enhanced');
  setOpen(false);
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    setOpen(false);
    const section = document.querySelector(link.hash);
    if (section) { section.setAttribute('tabindex', '-1'); section.focus({preventScroll:true}); }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') setOpen(false, true);
  });
  document.addEventListener('click', event => { if (!header.contains(event.target)) setOpen(false); });
  header.addEventListener('focusout', event => { if (event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false); });
  mobile.addEventListener('change', () => setOpen(false));
  let queued = false;
  const updateHeader = () => { header.classList.toggle('scrolled', scrollY > 36); queued = false; };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(updateHeader); } }, {passive:true});
  updateHeader();
  // El salto entre secciones solo se registra en escritorio ancho.
  const escritorio = matchMedia('(min-width: 981px)');
  const secciones = () => [...document.querySelectorAll('.hero, .approach, .work, .coinvest, .about, .footer')];
  let ajustando = false;
  const siguiente = (direccion) => {
    const lista = secciones();
    if (!lista.length) return null;
    const margen = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    let indice = 0;
    lista.forEach((seccion, n) => { if (seccion.getBoundingClientRect().top <= margen + 8) indice = n; });
    const actual = lista[indice];
    const caja = actual.getBoundingClientRect();
    // Solo salta al llegar al borde de la sección actual.
    if (direccion > 0 && caja.bottom > innerHeight + 12) return null;
    if (direccion < 0 && caja.top < margen - 12) return null;
    return lista[indice + direccion] || null;
  };
  const irA = (seccion) => {
    if (!seccion || ajustando || reduced.matches || !escritorio.matches) return;
    ajustando = true;
    seccion.scrollIntoView({behavior:'smooth', block:'start'});
    setTimeout(() => { ajustando = false; }, 900);
  };
  const alGirar = (event) => {
    if (!escritorio.matches || reduced.matches || ajustando || header.classList.contains('menu-open')) return;
    if (Math.abs(event.deltaY) < 16) return;
    const destino = siguiente(event.deltaY > 0 ? 1 : -1);
    if (!destino) return;
    event.preventDefault();
    irA(destino);
  };
  let toqueY = 0;
  const alEmpezarToque = (event) => { if (event.touches[0]) toqueY = event.touches[0].clientY; };
  const alTerminarToque = (event) => {
    if (!escritorio.matches || reduced.matches || ajustando || header.classList.contains('menu-open')) return;
    const fin = event.changedTouches[0];
    if (!fin) return;
    const delta = toqueY - fin.clientY;
    if (Math.abs(delta) < 48) return;
    irA(siguiente(delta > 0 ? 1 : -1));
  };
  const cortarSalto = () => {
    removeEventListener('wheel', alGirar);
    removeEventListener('touchstart', alEmpezarToque);
    removeEventListener('touchend', alTerminarToque);
  };
  const sincronizarSalto = () => {
    cortarSalto();
    if (!escritorio.matches || reduced.matches) return;
    addEventListener('wheel', alGirar, {passive:false});
    addEventListener('touchstart', alEmpezarToque, {passive:true});
    addEventListener('touchend', alTerminarToque, {passive:true});
  };
  escritorio.addEventListener('change', sincronizarSalto);
  reduced.addEventListener('change', sincronizarSalto);
  sincronizarSalto();
  // Only arm reveals after an observer exists. An error handler reveals everything
  // if an unexpected runtime error occurs after initialization.
  if ('IntersectionObserver' in window && !reduced.matches) {
    const nodes = [...document.querySelectorAll('.reveal')];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('in-view'); observer.unobserve(entry.target);
      }
    }, {threshold:0.08, rootMargin:'0px 0px -24px 0px'});
    nodes.forEach(node => {
      if (node.getBoundingClientRect().top >= innerHeight) {node.classList.add('pending'); observer.observe(node);}
    });
    const showAll = () => {nodes.forEach(node => node.classList.add('in-view')); observer.disconnect();};
    reduced.addEventListener('change', event => {if (event.matches) showAll();});
    addEventListener('error', showAll, {once:true});
  }
})();
