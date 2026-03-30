/* ============================================================
   WareIQ — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── Diagnostic option selection ─────────────────────── */
  document.querySelectorAll('.diag-opt').forEach(function (opt) {
    opt.addEventListener('click', function () {
      const siblings = this.closest('.diag-options').querySelectorAll('.diag-opt');
      siblings.forEach(function (s) { s.classList.remove('sel'); });
      this.classList.add('sel');
    });
  });

  /* ── Diagnostic progress stepper ─────────────────────── */
  let step = 3;
  const totalSteps = 15;

  const stepLabel = document.querySelector('.diag-step-label');
  const progressBar = document.querySelector('.diag-progress-fill');
  const nextBtn = document.querySelector('.diag-next');

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (step < totalSteps) {
        step++;
        const minsLeft = Math.max(1, totalSteps - step);
        if (stepLabel) {
          stepLabel.textContent =
            'Question ' + step + ' of ' + totalSteps + ' · ~' + minsLeft + ' min remaining';
        }
        if (progressBar) {
          progressBar.style.width = ((step / totalSteps) * 100) + '%';
        }
        if (step === totalSteps && nextBtn) {
          nextBtn.textContent = 'See results';
        }
      }
    });
  }

  /* ── Mobile navigation hamburger ─────────────────────── */
  const hamburger = document.querySelector('.nav-hamburger');
  const drawer = document.querySelector('.nav-drawer');

  if (hamburger && drawer) {
    hamburger.addEventListener('click', function () {
      const isOpen = drawer.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);

      // Animate hamburger → X
      const bars = hamburger.querySelectorAll('span');
      if (isOpen) {
        bars[0].style.transform = 'translateY(7px) rotate(45deg)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        bars[0].style.transform = '';
        bars[1].style.opacity = '';
        bars[2].style.transform = '';
      }
    });

    // Close drawer when a link is clicked
    drawer.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('click', function () {
        drawer.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        const bars = hamburger.querySelectorAll('span');
        bars[0].style.transform = '';
        bars[1].style.opacity = '';
        bars[2].style.transform = '';
      });
    });
  }

  /* ── Smooth scroll for anchor links ──────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

})();
