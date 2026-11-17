(() => {
  const nav = document.querySelector('.artwork-nav');
  if (!nav) return;

  const list = nav.querySelector('.artwork-nav-list');
  const toggle = nav.querySelector('.artwork-nav-toggle');
  const compact = window.matchMedia('(max-width: 1100px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const artworks = [];

  document.querySelectorAll('main .project').forEach((section) => {
    const heading = section.querySelector('h2');
    const title = heading?.textContent.trim();
    if (!title) return;

    // Keep existing anchors; make repeated artwork titles safe to link to.
    if (!section.id) {
      const slug = title.normalize('NFC').toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'artwork';
      let id = slug;
      let suffix = 2;
      while (document.getElementById(id)) id = `${slug}-${suffix++}`;
      section.id = id;
    }

    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${encodeURIComponent(section.id)}`;
    link.textContent = title;
    item.append(link);
    list.append(item);
    artworks.push({ section, heading, link });
  });

  if (!artworks.length) return;
  nav.hidden = false;
  document.body.classList.add('has-artwork-nav');

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('span').textContent = open ? '−' : '+';
    nav.classList.toggle('is-open', open);
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('click', (event) => {
    if (!nav.contains(event.target)) setOpen(false);
  });

  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  compact.addEventListener('change', () => setOpen(false));

  const setActive = (section) => {
    artworks.forEach((artwork) => {
      if (artwork.section === section) artwork.link.setAttribute('aria-current', 'location');
      else artwork.link.removeAttribute('aria-current');
    });
  };

  artworks.forEach(({ section, heading, link }) => {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      setOpen(false);
      if (window.location.hash !== link.hash) window.history.pushState(null, '', link.hash);
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
      section.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
    });
  });

  setActive(artworks[0].section);
  if (!('IntersectionObserver' in window)) return;

  let observer;
  let resizeFrame;
  const observeArtworks = () => {
    observer?.disconnect();
    const visible = new Set();
    // A narrow band near the top stays useful even for very tall image sections.
    const top = Math.round(window.innerHeight * 0.2);
    const bottom = Math.round(window.innerHeight * 0.75);
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      const active = artworks.find(({ section }) => visible.has(section));
      if (active) setActive(active.section);
    }, { rootMargin: `-${top}px 0px -${bottom}px 0px`, threshold: 0 });
    artworks.forEach(({ section }) => observer.observe(section));
  };

  observeArtworks();
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(observeArtworks);
  });

  // Generated anchors also work when arriving from a shared artwork link.
  const initial = artworks.find(({ link }) => link.hash === window.location.hash);
  if (initial) {
    initial.section.scrollIntoView({ behavior: 'instant', block: 'start' });
    setActive(initial.section);
  }
})();
