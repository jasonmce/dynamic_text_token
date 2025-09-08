/**
 * @file
 * Dynamic text token rotator behavior.
 */

((Drupal, once) => {
  // Initialize namespacing.
  Drupal.dynamicTokens = Drupal.dynamicTokens || {};
  Drupal.dynamicTokens.intervals = Drupal.dynamicTokens.intervals || new WeakMap();
  Drupal.dynamicTokens.timeouts = Drupal.dynamicTokens.timeouts || new WeakMap();

  /**
   * Applies a crossfade effect when updating text content.
   *
   * @param {HTMLElement} element - The element to update.
   * @param {string} text - The new text content.
   */
  function crossfade(element, text) {
    if (text === element.textContent) {
      return;
    }

    element.classList.add('text-fade-out');
    setTimeout(() => {
      element.textContent = text;
      element.classList.replace('text-fade-out', 'text-fade-in');
    }, 1000);
  }

  /**
   * Fetches and updates the content for a token element.
   *
   * @param {HTMLElement} element - The token element to update.
   * @param {number} speed - The refresh speed in milliseconds.
   */
  function refreshTokenContent(element, speed) {
    const tokenId = element.getAttribute('data-token-id');
    if (!tokenId) {
      return;
    }

    fetch(Drupal.url(`dynamic-token/${tokenId}/next`))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data?.value && typeof data.value === 'string') {
          crossfade(element, data.value);
        }
      })
      .catch((error) => {
        if (Drupal.jsEnabled) {
          Drupal.throwError(`Error refreshing token ${tokenId}: ${error.message}`);
        }
      });
  }

  /**
   * Sets up visibility change handling for a token element.
   *
   * @param {HTMLElement} element - The token element.
   * @param {number} speed - The refresh speed in milliseconds.
   * @param {number} initialDelay - The initial delay in milliseconds.
   */
  function setupVisibilityHandler(element, speed, initialDelay) {
    let intervalId = null;
    let timeoutId = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Store current state when hiding.
        element.dataset.originalDelay = initialDelay.toString();
        clearInterval(intervalId);
        clearTimeout(timeoutId);
      } else {
        // Restore with original timing when showing again.
        const delay = parseInt(element.dataset.originalDelay, 10) || initialDelay;
        
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          refreshTokenContent(element, speed);
          intervalId = setInterval(() => refreshTokenContent(element, speed), speed);
          Drupal.dynamicTokens.intervals.set(element, intervalId);
        }, delay);

        Drupal.dynamicTokens.timeouts.set(element, timeoutId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Return cleanup function.
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }

  /**
   * Attaches the dynamic text token behavior.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for the dynamic text tokens.
   * @prop {Drupal~behaviorDetach} detach
   *   Detaches the behavior for the dynamic text tokens.
   */
  Drupal.behaviors.dynamicTextToken = {
    attach(context, settings) {
      once('dynamic-text-token', 'span.dynamic-token[data-token-type-id="dynamic_text_token"]', context).forEach((element, index) => {
        const speed = Drupal.dynamicTokens.parseSpeed(element, 5000);
        const initialDelay = 2000 + (index * 2000); // 2s + 2s per element

        // Set up visibility handling.
        const cleanupVisibility = setupVisibilityHandler(element, speed, initialDelay);

        // Initial setup with staggered delay.
        const timeoutId = setTimeout(() => {
          refreshTokenContent(element, speed);
          const intervalId = setInterval(() => refreshTokenContent(element, speed), speed);
          Drupal.dynamicTokens.intervals.set(element, intervalId);
        }, initialDelay);

        // Store timeout for cleanup.
        Drupal.dynamicTokens.timeouts.set(element, timeoutId);

        // Cleanup on detach.
        element.addEventListener('drupalViewLiveElementRemoved', () => {
          cleanupVisibility();
          clearInterval(Drupal.dynamicTokens.intervals.get(element));
          clearTimeout(Drupal.dynamicTokens.timeouts.get(element));
          Drupal.dynamicTokens.intervals.delete(element);
          Drupal.dynamicTokens.timeouts.delete(element);
        });
      });
    },

    detach(context, settings, trigger) {
      if (trigger !== 'unload') {
        return;
      }

      context.querySelectorAll('span.dynamic-token[data-token-type-id="dynamic_text_token"]').forEach((element) => {
        // Clear intervals.
        const intervalId = Drupal.dynamicTokens.intervals.get(element);
        if (intervalId) {
          clearInterval(intervalId);
          Drupal.dynamicTokens.intervals.delete(element);
        }

        // Clear timeouts.
        const timeoutId = Drupal.dynamicTokens.timeouts.get(element);
        if (timeoutId) {
          clearTimeout(timeoutId);
          Drupal.dynamicTokens.timeouts.delete(element);
        }
      });
    },
  };
})(Drupal, once);
