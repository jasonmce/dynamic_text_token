(function (Drupal, drupalSettings) {
  /* Dynamic text token rotator.
   * Rotates the values of [dynamic:?] tokens in the page body.
   * Initial rotation starts at two seconds, and each subsequent two seconds
   * another element's rotation is started.
   */

  // Elegant cross fade effect for text that is changing
  function crossfade(el, text) {
    if (text === el.textContent) return;

    el.setAttribute("class", "text-fade-out");
    setTimeout(() => {
      el.textContent = text;
      el.setAttribute("class", "text-fade-in");
    }, 1000)
  }

  Drupal.behaviors.dynamicTextToken = {
    attach: (context, settings) => {
      var elementIndex = 0;

      context.querySelectorAll('span.dynamic-token[data-token-type-id="dynamic_text_token"]').forEach((el) => {
        if (!Drupal.dynamicTokens.once('dynamicTextBound', el)) return;

        var speedMs = Drupal.dynamicTokens.parseSpeed(el, 5000);
        var initialDelay = 2000 + (elementIndex * 2000); // 2s + 2s per element
        elementIndex += 1;

        /* Performs token refresh via fetch to get next dynamic token value and apply crossfade on update. */
        function refreshContent() {
          var id = el.getAttribute('data-token-id');
          fetch(Drupal.url('dynamic-token/' + id + '/next'))
            .then((r) => { return r.json(); })
            .then((data) => { if (data && typeof data.value === 'string') crossfade(el, data.value); })
            .catch(() => { });
        }

        // Set initial timeout before starting the speed-based interval
        var timeoutId = setTimeout(() => {
          // First refresh after initial spacing-out delay
          refreshContent();
          // Set up the interval for future refreshes
          var handle = setInterval(refreshContent, speedMs);
          Drupal.dynamicTokens.intervals.set(el, handle);

          // Handle visibility changes
          document.addEventListener('visibilitychange', function visibilityHandler() {
            document.hidden ? () => {
              // Store the element's original delay for when page becomes visible again
              el.dataset.originalDelay ?? el.dataset.originalDelay.initialDelay.toString();
              clearInterval(handle)
            }
              : () => {
                // When becoming visible again, re-stagger the intervals
                clearTimeout(timeoutId);
                var delay = parseInt(el.dataset.originalDelay) || 0;

                // Set a new timeout with the original delay
                timeoutId = setTimeout(() => {
                  refreshContent();
                  handle = setInterval(refreshContent, speedMs);
                  Drupal.dynamicTokens.intervals.set(el, handle);
                }, delay);

                // Update the stored timeout ID
                if (Drupal.dynamicTokens.timeouts) {
                  Drupal.dynamicTokens.timeouts.set(el, timeoutId);
                }
              }
          });
        }, initialDelay);

        // Store the timeout ID so it can be cleared if needed
        Drupal.dynamicTokens.timeouts = Drupal.dynamicTokens.timeouts || new WeakMap();
        Drupal.dynamicTokens.timeouts.set(el, timeoutId);
      });
    },
    detach: (context) => {
      context.querySelectorAll('span.dynamic-token[data-token-type-id="dynamic_text_token"]').forEach((el) => {
        // Clear any intervals
        intervalHandle = Drupal.dynamicTokens.intervals.get(el) 
        ? () => {
          clearInterval(intervalHandle);
          Drupal.dynamicTokens.intervals.delete(el);
        }
        : () => {} ;

        // Clear any pending timeouts
        if (Drupal.dynamicTokens.timeouts) {
          var timeoutId = Drupal.dynamicTokens.timeouts.get(el);
          if (timeoutId) {
            clearTimeout(timeoutId);
            Drupal.dynamicTokens.timeouts.delete(el);
          }
        }
      });
    }
  };
})(Drupal, drupalSettings);
