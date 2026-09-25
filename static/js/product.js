/*
 * Repsy Cloud / Repsy Open Source product handling. Loaded only on sites that build more than one product
 * (never in production while Repsy Open Source is disabled). It has no dependencies and every browser API
 * that can fail (localStorage) is wrapped, so the docs work without it.
 *
 * - Stores the product of the page being read in localStorage ("cloud" or "os") on every page view
 *   and when the switcher is used.
 * - On the site root (data-os-home on the script tag) sends readers who last read Repsy Open Source to its home page.
 * - On other pages shows a dismissible banner when the stored product differs from the page's product.
 *   Deep links are never redirected.
 * - Closes the product switcher menu on Escape and on outside click, and opens it from the header badge.
 */
(function () {
  var KEY = 'repsy-docs-product';

  function read() {
    try {
      return window.localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function write(product) {
    try {
      window.localStorage.setItem(KEY, product);
    } catch (e) {
      /* storage unavailable (private mode, blocked): the docs work without it */
    }
  }

  var script = document.currentScript;
  if (script && script.getAttribute('data-os-home')) {
    if (read() === 'os') {
      window.location.replace(script.getAttribute('data-os-home'));
    }
    return;
  }

  function init() {
    var switcher = document.querySelector('.product-switcher');
    if (!switcher) {
      return;
    }
    var current = switcher.getAttribute('data-current-product');
    var stored = read();
    write(current);

    var summary = switcher.querySelector('summary');
    var links = switcher.querySelectorAll('a[data-product]');
    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener('click', function () {
        write(link.getAttribute('data-product'));
      });
    });

    function close(focus) {
      if (switcher.open) {
        switcher.open = false;
        if (focus) {
          summary.focus();
        }
      }
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        close(switcher.contains(document.activeElement));
      }
    });
    document.addEventListener('click', function (event) {
      if (!switcher.contains(event.target) && !event.target.closest('.product-badge')) {
        close(false);
      }
    });

    // The "· Open Source" badge in the header: open the drawer on small screens and the product menu.
    window.openProductSwitcher = function () {
      var sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.add('open');
      }
      switcher.open = true;
      summary.focus();
    };

    showBanner(switcher, current, stored);
  }

  function showBanner(switcher, current, stored) {
    var banner = document.getElementById('product-banner');
    if (!banner || !stored || stored === current) {
      return;
    }
    var target = switcher.querySelector('a[data-product="' + stored + '"]');
    var here = switcher.querySelector('a[data-product="' + current + '"] .product-switcher-name');
    var there = target && target.querySelector('.product-switcher-name');
    if (!target || !here || !there) {
      return;
    }
    var exact = target.getAttribute('data-match') === 'page';
    banner.querySelector('.product-banner-text').textContent = "You're reading " + here.textContent + ' docs. ';
    var link = banner.querySelector('.product-banner-link');
    link.setAttribute('href', target.getAttribute('href'));
    link.textContent = (exact ? 'Open this page for ' : 'Open the docs of ') + there.textContent;
    link.addEventListener('click', function () {
      write(stored);
    });
    banner.querySelector('.product-banner-close').addEventListener('click', function () {
      banner.hidden = true;
    });
    banner.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
