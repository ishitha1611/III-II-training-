// main.js
// Interactions for Ishitha's portfolio page:
// - Smooth scroll for anchor links
// - Shrink header on scroll
// - Copy-to-clipboard for email / phone links (show small tooltip)
// - Click a project card to open a short modal with details
// - Gentle handler for Resume link to remind replacing href

(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function createEl(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v);
    });
    children.forEach(c => el.appendChild(c));
    return el;
  }

  /* ---------- Smooth scroll for same-page anchors ---------- */
  function enableSmoothScroll() {
    // target links: header nav and any anchor links to IDs
    const anchors = qsa('a[href^="#"]');
    anchors.forEach(a => {
      a.addEventListener('click', function (e) {
        const href = a.getAttribute('href');
        if (!href || href === '#') return;
        const target = document.getElementById(href.slice(1));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // update hash without jumping
          history.replaceState(null, '', href);
        }
      });
    });
  }

  /* ---------- Header shrink on scroll ---------- */
  function enableHeaderShrink() {
    const header = qs('.site-header');
    if (!header) return;
    const SHRINK_CLASS = 'header--scrolled';
    const threshold = 48;
    function onScroll() {
      if (window.scrollY > threshold) header.classList.add(SHRINK_CLASS);
      else header.classList.remove(SHRINK_CLASS);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // small styles fallback if user hasn't added them:
    // (we don't modify CSS file here, but add inline minimal rule)
    const styleId = 'mainjs-header-style';
    if (!document.getElementById(styleId)) {
      const s = document.createElement('style');
      s.id = styleId;
      s.innerHTML = `
        .header--scrolled { transform: translateY(-2px); transition: transform .18s ease; }
        .site-header { transition: box-shadow .18s ease, background-color .18s ease; }
        .header--scrolled { box-shadow: 0 6px 18px rgba(2,6,23,0.45); }
      `;
      document.head.appendChild(s);
    }
  }

  /* ---------- Copy to clipboard with tooltip ---------- */
  function enableCopyToClipboard() {
    const copyTargets = qsa('.contact-quick a, .contact-section a[href^="mailto:"], .contact-section a[href^="tel:"]');
    if (!copyTargets.length) return;

    function showTooltip(el, text) {
      // remove existing
      const existing = el.parentElement.querySelector('.copy-tooltip');
      if (existing) existing.remove();
      const tip = createEl('span', { class: 'copy-tooltip', html: text });
      Object.assign(tip.style, {
        position: 'absolute',
        top: '-28px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '6px 8px',
        fontSize: '12px',
        borderRadius: '8px',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity: 0,
        transition: 'opacity .18s ease',
      });
      // ensure parent is positioned
      const wrapper = createEl('span', { style: 'position:relative;display:inline-block' });
      el.replaceWith(wrapper);
      wrapper.appendChild(el);
      wrapper.appendChild(tip);
      // fade in/out
      requestAnimationFrame(() => tip.style.opacity = 1);
      setTimeout(() => {
        tip.style.opacity = 0;
        setTimeout(() => tip.remove(), 300);
      }, 1300);
    }

    copyTargets.forEach(a => {
      // support click-to-copy for mailto/tel and visible email/phone
      a.addEventListener('click', function (e) {
        const href = a.getAttribute('href') || '';
        // if anchor is a mailto or tel, copy the raw address/number
        if (href.startsWith('mailto:') || href.startsWith('tel:')) {
          e.preventDefault();
          const value = href.split(':')[1];
          navigator.clipboard?.writeText(value).then(() => {
            showTooltip(a, 'Copied to clipboard');
          }).catch(() => {
            // fallback: select text
            showTooltip(a, 'Copy failed — select to copy');
          });
        } else {
          // some contact links may be plain mail text; copy the visible text instead
          const text = (a.textContent || '').trim();
          if (text) {
            e.preventDefault();
            navigator.clipboard?.writeText(text).then(() => {
              showTooltip(a, 'Copied to clipboard');
            }).catch(() => {
              showTooltip(a, 'Copy failed');
            });
          }
        }
      });
    });
  }

  /* ---------- Project modal (accessible) ---------- */
  function enableProjectModal() {
    const projects = qsa('.project');
    if (!projects.length) return;

    // build modal (hidden)
    const modal = createEl('div', { class: 'pm-modal', 'aria-hidden': 'true', role: 'dialog' });
    Object.assign(modal.style, {
      position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1200, padding: '20px', background: 'rgba(4,8,18,0.6)', visibility: 'hidden', opacity: 0, transition: 'opacity .18s ease'
    });

    const dialog = createEl('div', { class: 'pm-dialog' });
    Object.assign(dialog.style, {
      width: 'min(760px, 96%)', background: 'linear-gradient(180deg, rgba(12,18,30,0.98), rgba(6,10,20,0.98))',
      padding: '18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.04)', color: '#eaf2ff'
    });

    const closeBtn = createEl('button', { class: 'pm-close', type: 'button', html: 'Close' });
    Object.assign(closeBtn.style, { float: 'right', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' });

    const title = createEl('h3', { class: 'pm-title' });
    const body = createEl('div', { class: 'pm-body' });
    const meta = createEl('p', { class: 'pm-meta' });
    const gitLink = createEl('a', { class: 'pm-git', href: '#', target: '_blank', rel: 'noopener' });

    dialog.appendChild(closeBtn);
    dialog.appendChild(title);
    dialog.appendChild(meta);
    dialog.appendChild(body);
    dialog.appendChild(gitLink);
    modal.appendChild(dialog);
    document.body.appendChild(modal);

    function openModal(data) {
      title.textContent = data.title || '';
      body.innerHTML = data.description || '';
      meta.textContent = data.meta || '';
      if (data.github) {
        gitLink.href = data.github;
        gitLink.textContent = 'View on GitHub';
        gitLink.style.display = 'inline-block';
        Object.assign(gitLink.style, { marginTop: '10px', display: 'inline-block', fontWeight: '700', textDecoration: 'none' });
      } else {
        gitLink.style.display = 'none';
      }
      modal.style.visibility = 'visible';
      modal.style.opacity = 1;
      modal.setAttribute('aria-hidden', 'false');
      // focus management
      closeBtn.focus();
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      modal.style.opacity = 0;
      modal.style.visibility = 'hidden';
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.getAttribute('aria-hidden') === 'false') closeModal(); });

    // attach click handler to each project article
    projects.forEach(p => {
      p.style.cursor = 'pointer';
      p.setAttribute('tabindex', '0'); // focusable
      p.addEventListener('click', () => {
        const titleText = (p.querySelector('h4')?.textContent || '').trim();
        const descHTML = (p.querySelector('p')?.outerHTML || p.innerHTML || '').trim();
        const metaText = (p.querySelector('.meta')?.textContent || '').trim();
        // Try to find a github link stored as data-github on the article (optional)
        const github = p.getAttribute('data-github') || '';
        openModal({ title: titleText, description: descHTML, meta: metaText, github });
      });
      p.addEventListener('keydown', (e) => { if (e.key === 'Enter') p.click(); });
    });
  }

  /* ---------- Resume link helper ---------- */
  function enableResumeHelper() {
    const resumeLink = qs('a.link[href="#"]');
    if (!resumeLink) return;
    resumeLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Gentle non-blocking UI hint
      if (confirm('You currently have a placeholder link for "Resume (PDF)". Would you like a short set of instructions on how to replace it with a hosted PDF URL?')) {
        alert('Host your resume PDF (e.g., GitHub repo, Google Drive public link, or your site). Then replace the href in the Resume anchor with the file URL and optionally add `download` attribute.\n\nExample: <a href="https://example.com/Ishitha-Resume.pdf" download>Resume (PDF)</a>');
      }
    });
  }

  /* ---------- Init ---------- */
  function init() {
    enableSmoothScroll();
    enableHeaderShrink();
    enableCopyToClipboard();
    enableProjectModal();
    enableResumeHelper();
  }

  // run when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
