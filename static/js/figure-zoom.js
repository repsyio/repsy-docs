/*
 * Click-to-zoom for the figure shortcode (layouts/shortcodes/figure.html). No dependencies: one shared
 * <dialog> shows the full-size image. Without JavaScript, or in a browser without <dialog>, the link around
 * the image opens the image file itself.
 */
(function () {
  'use strict';
  if (typeof HTMLDialogElement !== 'function') {
    return;
  }

  var dialog = null;
  var image = null;
  var caption = null;

  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'figure-zoom';
    dialog.setAttribute('aria-label', 'Enlarged image');

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'figure-zoom__close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.addEventListener('click', function () {
      dialog.close();
    });

    image = document.createElement('img');
    image.className = 'figure-zoom__image';
    caption = document.createElement('p');
    caption.className = 'figure-zoom__caption';

    dialog.appendChild(close);
    dialog.appendChild(image);
    dialog.appendChild(caption);
    // A click on the backdrop or on the image closes the dialog; Esc is handled by <dialog> itself.
    dialog.addEventListener('click', function (event) {
      if (event.target !== caption) {
        dialog.close();
      }
    });
    document.body.appendChild(dialog);
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[data-figure-zoom]') : null;
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    var thumbnail = link.querySelector('img');
    event.preventDefault();
    if (!dialog) {
      build();
    }
    image.src = link.href;
    image.alt = thumbnail ? thumbnail.alt : '';
    var text = link.parentElement && link.parentElement.querySelector('figcaption');
    caption.textContent = text ? text.textContent : '';
    caption.hidden = !text;
    dialog.showModal();
  });
})();
