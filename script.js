/* ==========================================================================
   Subam Shrestha: portfolio script

   What this file does (each part is small and independent):
   1. Staggers the hero code lines
   2. Makes the header compact once you scroll
   3. Opens and closes the mobile menu
   4. Highlights the nav link of the section you're reading
   5. Reveals blocks gently as they scroll into view

   No libraries, just plain JavaScript.
   ========================================================================== */

(function () {
  "use strict";

  // Has the visitor asked their device for less motion?
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const header = document.getElementById("site-header");
  const menuButton = document.querySelector(".nav__toggle");
  const menu = document.getElementById("nav-menu");
  const navLinks = document.querySelectorAll(".nav__link");


  /* ------------------------------------------------------------------------
     1. Hero code lines
     Give each line a number (--i). The CSS uses it to delay each line a bit
     more than the one before, so they appear one after another.
     ------------------------------------------------------------------------ */
  document.querySelectorAll(".code-line").forEach(function (line, index) {
    line.style.setProperty("--i", index);
  });


  /* ------------------------------------------------------------------------
     2. Compact header on scroll
     After scrolling 12px we add the class "is-scrolled". The CSS makes the
     header shorter and adds a thin border.
     ------------------------------------------------------------------------ */
  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });


  /* ------------------------------------------------------------------------
     3. Mobile menu
     The button toggles the "is-open" class and keeps aria-expanded in sync
     so screen readers know whether the menu is open.
     ------------------------------------------------------------------------ */
  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  }

  menuButton.addEventListener("click", function () {
    setMenu(menuButton.getAttribute("aria-expanded") !== "true");
  });

  // Close the menu after choosing a link
  menu.addEventListener("click", function (event) {
    if (event.target.closest("a")) {
      setMenu(false);
    }
  });

  // Close with the Escape key and give focus back to the button
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      setMenu(false);
      menuButton.focus();
    }
  });

  // If the window becomes wide (e.g. a tablet is rotated), reset the menu
  window.matchMedia("(min-width: 48rem)").addEventListener("change", function () {
    setMenu(false);
  });


  /* ------------------------------------------------------------------------
     4. Active navigation link
     IntersectionObserver tells us when a section crosses the middle of the
     screen. The nav link pointing to that section gets "is-active".
     Sections without a nav link (like "Currently learning") simply keep
     the previous highlight.
     ------------------------------------------------------------------------ */
  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          const matchingLink = document.querySelector('.nav__link[href="#' + entry.target.id + '"]');
          if (!matchingLink) return;

          navLinks.forEach(function (link) {
            link.classList.remove("is-active");
            link.removeAttribute("aria-current");
          });
          matchingLink.classList.add("is-active");
          matchingLink.setAttribute("aria-current", "true");
        });
      },
      // Only count a section when it crosses a thin band in the middle of the screen
      { rootMargin: "-45% 0px -50% 0px" }
    );

    document.querySelectorAll("main section[id]").forEach(function (section) {
      sectionObserver.observe(section);
    });
  }


  /* ------------------------------------------------------------------------
     5. Scroll reveal
     Blocks marked data-reveal in the HTML start slightly faded and lower,
     then settle into place once they enter the screen.
     We remove the helper classes afterwards so hover effects on those
     blocks (like project cards) work normally.
     ------------------------------------------------------------------------ */
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);

          // Clean up once the transition has finished (0.7s in the CSS)
          window.setTimeout(function () {
            entry.target.classList.remove("will-reveal", "is-visible");
          }, 900);
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll("[data-reveal]").forEach(function (element) {
      element.classList.add("will-reveal");
      revealObserver.observe(element);
    });
  }
})();