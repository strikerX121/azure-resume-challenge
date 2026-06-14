(function () {
  'use strict';

  /* ===================================================
     DARK / LIGHT MODE TOGGLE
     =================================================== */
  var root = document.documentElement;
  var saved = localStorage.getItem('arc-theme') || 'light';
  root.setAttribute('data-theme', saved);

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('arc-theme', theme);
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀ Light' : '☾ Dark';
  }

  window.toggleTheme = function () {
    var current = root.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  };

  document.addEventListener('DOMContentLoaded', function () {
    applyTheme(saved);

    /* ===================================================
       TYPEWRITER EFFECT
       =================================================== */
    var titles = [
      'Cloud Solutions Architect',
      'Azure Specialist',
      'Digital Transformation Lead',
      'Microsoft Solutions Expert',
      'ARC Cloud Consulting Founder'
    ];
    var typeEl = document.getElementById('typewriter-text');
    if (typeEl) {
      var ti = 0, ci = 0, deleting = false;

      function type() {
        var current = titles[ti];
        if (deleting) {
          ci--;
        } else {
          ci++;
        }
        typeEl.textContent = current.slice(0, ci);
        var delay = deleting ? 50 : 90;
        if (!deleting && ci === current.length) {
          delay = 1800;
          deleting = true;
        } else if (deleting && ci === 0) {
          deleting = false;
          ti = (ti + 1) % titles.length;
          delay = 300;
        }
        setTimeout(type, delay);
      }
      setTimeout(type, 600);
    }

    /* ===================================================
       SCROLL REVEAL — INTERSECTION OBSERVER
       =================================================== */
    var revealEls = document.querySelectorAll('.reveal, .reveal-left');
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            observer.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { observer.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('visible'); });
    }

    /* ===================================================
       STATS COUNTER ANIMATION
       =================================================== */
    var counters = document.querySelectorAll('[data-count]');
    var counted = false;

    function runCounters() {
      if (counted) return;
      counters.forEach(function (el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var duration = 1800;
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target;
        }
        requestAnimationFrame(step);
      });
      counted = true;
    }

    if (counters.length) {
      var statsSection = document.getElementById('stats');
      if (statsSection && 'IntersectionObserver' in window) {
        var statsObs = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) {
            runCounters();
            statsObs.disconnect();
          }
        }, { threshold: 0.3 });
        statsObs.observe(statsSection);
      } else {
        runCounters();
      }
    }

    /* ===================================================
       ANIMATED PAGE COUNTER (called from main.js)
       =================================================== */
    window.animateCounter = function (finalCount) {
      var el = document.getElementById('counter');
      if (!el) return;
      var start = Math.max(0, finalCount - 80);
      var duration = 1400;
      var startTs = null;
      function step(ts) {
        if (!startTs) startTs = ts;
        var progress = Math.min((ts - startTs) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + eased * (finalCount - start));
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = finalCount;
      }
      requestAnimationFrame(step);
    };

    /* ===================================================
       ACTIVE NAV ON SCROLL
       =================================================== */
    var sections = document.querySelectorAll('header[id], section[id], div[id="portfolio"], div[id="team"]');
    var navLinks = document.querySelectorAll('#nav li a');

    function setActive() {
      var scrollY = window.scrollY + 100;
      sections.forEach(function (sec) {
        if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
          navLinks.forEach(function (link) {
            link.parentElement.classList.remove('current');
            if (link.getAttribute('href') === '#' + sec.id) {
              link.parentElement.classList.add('current');
            }
          });
        }
      });
    }
    window.addEventListener('scroll', setActive, { passive: true });
  });
})();
