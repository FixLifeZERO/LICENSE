/* ==========================================================================
   E.G.O. SMP License Website — JavaScript
   Table of Contents, Smooth Scroll, Copy Link, Back to Top, Search
   ========================================================================== */

(function() {
  'use strict';

  // ==========================================================================
  // Utility Functions
  // ==========================================================================
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), delay);
    };
  };

  const throttle = (fn, limit) => {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // ==========================================================================
  // Table of Contents Generation
  // ==========================================================================
  function generateTOC() {
    const tocList = $('#toc-list');
    if (!tocList) return;

    // Find all license sections with headings
    const sections = $$('#license-text .license-section[aria-labelledby]');

    if (sections.length === 0) return;

    const fragments = sections.map((section, index) => {
      const headingId = section.getAttribute('aria-labelledby');
      const heading = document.getElementById(headingId);
      if (!heading) return null;

      // Extract section number from heading text
      const headingText = heading.textContent.trim();
      const numberMatch = headingText.match(/^(\d+)\.\s/);
      const sectionNumber = numberMatch ? numberMatch[1] : String(index + 1);
      const titleText = headingText.replace(/^\d+\.\s*/, '');

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${section.id}`;
      a.className = 'toc-link';
      a.innerHTML = `<span class="toc-section-number">${sectionNumber}.</span> ${escapeHtml(titleText)}`;
      li.appendChild(a);
      return li;
    }).filter(Boolean);

    // Also add preamble as first item
    const preambleHeading = $('#license-text .license-preamble .license-title');
    if (preambleHeading) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#license-text';
      a.className = 'toc-link';
      a.innerHTML = `<span class="toc-section-number">—</span> Preamble & Definitions`;
      li.appendChild(a);
      tocList.appendChild(li);
    }

    fragments.forEach(fragment => tocList.appendChild(fragment));

    // Add smooth scroll to TOC links
    $$('.toc-link').forEach(link => {
      link.addEventListener('click', handleSmoothScroll);
    });
  }

  // ==========================================================================
  // Smooth Scroll Handling
  // ==========================================================================
  function handleSmoothScroll(e) {
    const href = this.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    const target = $(href);
    if (!target) return;

    e.preventDefault();

    // Update URL without scroll
    history.pushState(null, '', href);

    // Smooth scroll to target
    const headerHeight = $('.site-header')?.offsetHeight || 0;
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });

    // Focus target for accessibility
    setTimeout(() => {
      target.focus({ preventScroll: true });
      updateActiveNavLink(href);
    }, 300);

    // Close mobile nav if open
    closeMobileNav();
  }

  // Apply smooth scroll to all internal links
  function initSmoothScroll() {
    $$('a[href^="#"]').forEach(link => {
      if (!link.classList.contains('toc-link')) {
        link.addEventListener('click', handleSmoothScroll);
      }
    });
  }

  // ==========================================================================
  // Active Navigation Link
  // ==========================================================================
  function updateActiveNavLink(hash) {
    $$('.nav-link').forEach(link => {
      link.classList.toggle('current', link.getAttribute('href') === hash);
    });
  }

  function initScrollSpy() {
    const sections = $$('#overview, #table-of-contents, #license-text');
    const navLinks = $$('.nav-link');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = `#${entry.target.id}`;
          navLinks.forEach(link => {
            link.classList.toggle('current', link.getAttribute('href') === id);
          });
        }
      });
    }, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0.1
    });

    sections.forEach(section => observer.observe(section));
  }

  // ==========================================================================
  // Copy Section Link
  // ==========================================================================
  function initCopyLinkButtons() {
    $$('.copy-link-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const sectionId = btn.getAttribute('data-section');
        const section = document.getElementById(sectionId);
        if (!section) return;

        const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;

        try {
          await navigator.clipboard.writeText(url);
          btn.classList.add('copied');
          btn.setAttribute('aria-label', `Link to ${sectionId} copied`);

          setTimeout(() => {
            btn.classList.remove('copied');
            btn.setAttribute('aria-label', `Copy link to ${sectionId}`);
          }, 2000);
        } catch (err) {
          // Fallback for older browsers
          fallbackCopyTextToClipboard(url);
          btn.classList.add('copied');
          setTimeout(() => btn.classList.remove('copied'), 2000);
        }
      });
    });
  }

  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (err) {
      console.warn('Copy failed:', err);
    }
    document.body.removeChild(textArea);
  }

  // ==========================================================================
  // Back to Top Button
  // ==========================================================================
  function initBackToTop() {
    const btn = $('#back-to-top');
    if (!btn) return;

    const toggleVisibility = throttle(() => {
      if (window.pageYOffset > 300) {
        btn.hidden = false;
      } else {
        btn.hidden = true;
      }
    }, 100);

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Focus header for accessibility
      setTimeout(() => {
        const header = $('.site-header');
        if (header) header.focus({ preventScroll: true });
      }, 300);
    });
  }

  // ==========================================================================
  // Mobile Navigation
  // ==========================================================================
  function initMobileNav() {
    const toggle = $('.nav-toggle');
    const menu = $('#nav-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !expanded);
      menu.hidden = expanded;
      document.body.style.overflow = expanded ? '' : 'hidden';
    });

    // Close on link click
    $$('.nav-link').forEach(link => {
      link.addEventListener('click', closeMobileNav);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) {
        closeMobileNav();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!menu.hidden && !toggle.contains(e.target) && !menu.contains(e.target)) {
        closeMobileNav();
      }
    });
  }

  function closeMobileNav() {
    const toggle = $('.nav-toggle');
    const menu = $('#nav-menu');
    if (toggle && menu && !menu.hidden) {
      toggle.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
      document.body.style.overflow = '';
    }
  }

  // ==========================================================================
  // Search/Filter Functionality
  // ==========================================================================
  function initSearch() {
    const overlay = $('#search-overlay');
    const input = $('#search-input');
    const results = $('#search-results');
    const closeBtn = $('.search-close');
    if (!overlay || !input || !results || !closeBtn) return;

    // Build search index
    const searchIndex = buildSearchIndex();

    let selectedIndex = -1;

    function openSearch() {
      overlay.hidden = false;
      input.value = '';
      results.innerHTML = '';
      selectedIndex = -1;
      setTimeout(() => input.focus(), 50);
    }

    function closeSearch() {
      overlay.hidden = true;
      input.value = '';
      results.innerHTML = '';
      selectedIndex = -1;
    }

    function buildSearchIndex() {
      const items = [];
      const sections = $$('#license-text .license-section');

      sections.forEach(section => {
        const headingId = section.getAttribute('aria-labelledby');
        const heading = document.getElementById(headingId);
        if (!heading) return;

        const sectionTitle = heading.textContent.trim();
        const sectionNumber = sectionTitle.match(/^(\d+)\./)?.[1] || '';

        // Index headings
        items.push({
          type: 'section',
          sectionId: section.id,
          sectionNumber,
          title: sectionTitle,
          content: sectionTitle,
          element: section
        });

        // Index paragraphs
        $$('p, .definition', section).forEach(p => {
          const text = p.textContent.trim();
          if (text.length > 20) {
            items.push({
              type: 'paragraph',
              sectionId: section.id,
              sectionNumber,
              title: sectionTitle,
              content: text,
              element: p
            });
          }
        });
      });

      return items;
    }

    function performSearch(query) {
      if (!query.trim()) {
        results.innerHTML = '';
        selectedIndex = -1;
        return;
      }

      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      const scored = searchIndex.map(item => {
        const content = item.content.toLowerCase();
        let score = 0;
        let matchPositions = [];

        terms.forEach(term => {
          let pos = content.indexOf(term);
          while (pos !== -1) {
            score += item.type === 'section' ? 10 : 1;
            matchPositions.push({ start: pos, length: term.length });
            pos = content.indexOf(term, pos + 1);
          }
        });

        return { ...item, score, matchPositions };
      }).filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 20);

      renderResults(scored, query);
      selectedIndex = -1;
    }

    function renderResults(items, query) {
      if (items.length === 0) {
        results.innerHTML = '<div class="search-result-item" role="option">No matches found</div>';
        return;
      }

      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

      function highlight(text) {
        let result = escapeHtml(text);
        terms.forEach(term => {
          const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
          result = result.replace(regex, '<mark>$1</mark>');
        });
        return result;
      }

      results.innerHTML = items.map((item, index) => `
        <button type="button" class="search-result-item" role="option" data-index="${index}" data-section="${item.sectionId}" tabindex="-1">
          <span class="result-section">${item.sectionNumber ? `Section ${item.sectionNumber}` : 'Preamble'}: ${highlight(item.title)}</span>
          <span class="result-snippet">${highlight(truncate(item.content, 180))}</span>
        </button>
      `).join('');

      // Add click handlers
      $$('.search-result-item', results).forEach(btn => {
        btn.addEventListener('click', () => selectResult(btn));
      });
    }

    function selectResult(btn) {
      const sectionId = btn.getAttribute('data-section');
      if (sectionId) {
        const target = document.getElementById(sectionId);
        if (target) {
          closeSearch();
          const headerHeight = $('.site-header')?.offsetHeight || 0;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
          setTimeout(() => target.focus({ preventScroll: true }), 300);
          history.pushState(null, '', `#${sectionId}`);
        }
      }
    }

    function navigateResults(direction) {
      const items = $$('.search-result-item', results);
      if (items.length === 0) return;

      selectedIndex = (selectedIndex + direction + items.length) % items.length;
      items.forEach((item, i) => {
        item.classList.toggle('selected', i === selectedIndex);
        if (i === selectedIndex) {
          item.scrollIntoView({ block: 'nearest' });
        }
      });
    }

    // Event listeners
    input.addEventListener('input', debounce(e => performSearch(e.target.value), 150));

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeSearch();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateResults(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateResults(-1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const items = $$('.search-result-item', results);
        if (items[selectedIndex]) {
          selectResult(items[selectedIndex]);
        }
      }
    });

    closeBtn.addEventListener('click', closeSearch);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeSearch();
    });

    // Keyboard shortcuts to open search
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + K or / (when not in input)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      } else if (e.key === '/' && document.activeElement !== input && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openSearch();
      }
    });
  }

  function truncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '…';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ==========================================================================
  // URL Hash Handling on Load
  // ==========================================================================
  function handleInitialHash() {
    if (window.location.hash) {
      const target = $(window.location.hash);
      if (target) {
        // Wait for layout to settle
        setTimeout(() => {
          const headerHeight = $('.site-header')?.offsetHeight || 0;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;
          window.scrollTo({ top: targetPosition, behavior: 'auto' });
          target.focus({ preventScroll: true });
          updateActiveNavLink(window.location.hash);
        }, 0);
      }
    }
  }

  // ==========================================================================
  // Initialize All
  // ==========================================================================
  function init() {
    // Wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }

    generateTOC();
    initSmoothScroll();
    initScrollSpy();
    initCopyLinkButtons();
    initBackToTop();
    initMobileNav();
    initSearch();
    handleInitialHash();

    // Handle hash changes
    window.addEventListener('hashchange', () => {
      handleInitialHash();
    });

    console.log('E.G.O. SMP License Website initialized');
  }

  init();

})();