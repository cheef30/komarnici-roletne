/* Komarnici i roletne Ivan: meni, tabovi, birac boje, galerija, forma, mapa. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const PHONE = '381601930660';
  const EMAIL = 'ivan.mijatovic.1984@gmail.com';

  /* ---------- meni na telefonu ---------- */
  const nav = $('.nav');
  const toggle = $('.nav-toggle');
  if (nav && toggle) {
    const label = $('.sr-only', toggle);
    const icon = $('use', toggle);
    const setOpen = (open) => {
      nav.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Zatvori meni' : 'Otvori meni';
      icon.setAttribute('href', open ? '#i-close' : '#i-menu');
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('nav-open')) { setOpen(false); toggle.focus(); }
    });
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('nav-open') && !nav.contains(e.target)) setOpen(false);
    });
    nav.addEventListener('focusout', (e) => {
      if (nav.classList.contains('nav-open') && e.relatedTarget && !nav.contains(e.relatedTarget)) setOpen(false);
    });
  }

  /* ---------- tabovi (WAI-ARIA tabs, automatska aktivacija) ---------- */
  $$('[role="tablist"]').forEach((list) => {
    const tabs = $$('[role="tab"]', list);
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (e) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        let next = null;
        if (e.key in keys) next = tabs[(i + keys[e.key] + tabs.length) % tabs.length];
        if (e.key === 'Home') next = tabs[0];
        if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
  });

  /* ---------- birac boje profila ---------- */
  $$('[data-picker]').forEach((picker) => {
    const frame = document.getElementById(picker.dataset.picker);
    const out = $('[data-picker-name]');
    picker.addEventListener('change', (e) => {
      frame.style.setProperty('--frame', e.target.dataset.color);
      if (out) out.textContent = e.target.value;
    });
  });

  /* ---------- galerija i lightbox (pravi se tek na prvi klik) ---------- */
  const triggers = $$('[data-lightbox]');
  let box, img, cap, count, opener;
  let index = 0;

  function show(i) {
    index = (i + triggers.length) % triggers.length;
    const t = triggers[index];
    const src = $('img', t);
    img.src = t.dataset.lightbox;
    img.alt = src ? src.alt : '';
    cap.textContent = src ? src.alt : '';
    count.textContent = `${index + 1} / ${triggers.length}`;
  }
  function close() {
    box.hidden = true;
    document.documentElement.style.overflow = '';
    if (opener) opener.focus();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(index - 1);
    else if (e.key === 'ArrowRight') show(index + 1);
    else if (e.key === 'Tab') {
      const f = $$('button', box);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function build() {
    box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Fotografije radova');
    box.innerHTML =
      '<div class="lb-bar"><span class="lb-count" aria-live="polite"></span>' +
      '<button class="lb-btn lb-close" type="button"><svg class="icon" aria-hidden="true"><use href="#i-close"/></svg><span class="sr-only">Zatvori</span></button></div>' +
      '<div class="lb-stage"><img alt=""><button class="lb-btn lb-prev" type="button"><svg class="icon" aria-hidden="true"><use href="#i-prev"/></svg><span class="sr-only">Prethodna fotografija</span></button>' +
      '<button class="lb-btn lb-next" type="button"><svg class="icon" aria-hidden="true"><use href="#i-next"/></svg><span class="sr-only">Sledeća fotografija</span></button></div>' +
      '<p class="lb-cap"></p>';
    document.body.append(box);
    img = $('img', box);
    cap = $('.lb-cap', box);
    count = $('.lb-count', box);
    $('.lb-close', box).addEventListener('click', close);
    $('.lb-prev', box).addEventListener('click', () => show(index - 1));
    $('.lb-next', box).addEventListener('click', () => show(index + 1));
    box.addEventListener('click', (e) => { if (e.target === box || e.target.classList.contains('lb-stage')) close(); });
    box.addEventListener('keydown', onKey);
    let x0 = null;
    box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }
  triggers.forEach((t, i) => t.addEventListener('click', () => {
    if (!box) build();
    opener = t;
    show(i);
    box.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    $('.lb-close', box).focus();
  }));

  /* ---------- forma: poruka za WhatsApp ili email ---------- */
  $$('[data-quote-form]').forEach((form) => {
    const status = $('.form-status', form);
    const rules = {
      ime: (v) => (v.trim().length >= 2 ? '' : 'Upišite ime, da znamo kako da vam se obratimo.'),
      telefon: (v) => (v.replace(/\D/g, '').length >= 8 ? '' : 'Upišite broj telefona, na primer 060 123 4567.'),
      usluga: (v) => (v ? '' : 'Izaberite uslugu.'),
      opis: (v) => (v.trim().length >= 5 ? '' : 'Napišite okvirne mere ili ukratko opišite kvar.'),
    };
    const check = (field) => {
      const rule = rules[field.name];
      if (!rule) return true;
      const msg = rule(field.value);
      const err = document.getElementById(`${field.id}-err`);
      field.setAttribute('aria-invalid', String(Boolean(msg)));
      if (err) err.textContent = msg;
      return !msg;
    };
    $$('input, select, textarea', form).forEach((f) => {
      f.addEventListener('blur', () => { if (f.value) check(f); });
      f.addEventListener('input', () => { if (f.getAttribute('aria-invalid') === 'true') check(f); });
    });

    const message = () => {
      const d = new FormData(form);
      const lines = [
        'Dobar dan, želeo bih ponudu.',
        '',
        `Ime: ${d.get('ime').trim()}`,
        `Telefon: ${d.get('telefon').trim()}`,
        `Usluga: ${d.get('usluga')}`,
        `Mere ili opis: ${d.get('opis').trim()}`,
      ];
      if (d.get('slika')) lines.push('', 'Mogu da pošaljem i sliku.');
      return lines.join('\n');
    };
    const valid = () => {
      const fields = $$('[name]', form).filter((f) => rules[f.name]);
      const bad = fields.filter((f) => !check(f));
      if (bad.length) {
        bad[0].focus();
        status.textContent = '';
        return false;
      }
      return true;
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!valid()) return;
      const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(message())}`;
      status.textContent = 'Otvaramo WhatsApp sa vašom porukom. Ostaje samo da je pošaljete.';
      window.open(url, '_blank', 'noopener');
    });
    const mail = $('[data-mail]', form);
    if (mail) mail.addEventListener('click', () => {
      if (!valid()) return;
      const subject = encodeURIComponent('Zahtev za ponudu sa sajta');
      status.textContent = 'Otvaramo vaš program za email sa popunjenom porukom.';
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${encodeURIComponent(message())}`;
    });
  });

  /* ---------- mapa: iframe tek na klik ---------- */
  $$('[data-map]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.map');
      const frame = document.createElement('iframe');
      frame.src = wrap.dataset.src;
      frame.title = 'Mapa: Dimitrija Tucovića 119, Beograd';
      frame.loading = 'lazy';
      frame.referrerPolicy = 'no-referrer-when-downgrade';
      frame.allowFullscreen = true;
      wrap.append(frame);
      $('.map-facade', wrap).remove();
      frame.focus();
    });
  });

  /* ---------- sticky traka na telefonu, ispod hero sekcije ---------- */
  const bar = $('[data-mobile-bar]');
  const hero = $('[data-hero]');
  if (bar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      bar.classList.toggle('show', !entry.isIntersecting && entry.boundingClientRect.top < 0);
    }).observe(hero);
  }
})();
