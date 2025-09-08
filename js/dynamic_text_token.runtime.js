(function (Drupal, drupalSettings) {
  // Cross fade effect for text that is changing
  function crossfade(el, text) {
    if (text === el.textContent) return;
    el.setAttribute("class", "text-fade-out");
        setTimeout(() => {
          el.textContent = text;
          el.setAttribute("class", "text-fade-in");
        }, 1000)      
  }

  Drupal.behaviors.dynamicTextToken = {
    attach: function (context, settings) {
      context.querySelectorAll('span.dynamic-token[data-token-type-id="dynamic_text_token"]').forEach(function (el) {
        if (!Drupal.dynamicTokens.once('dynamicTextBound', el)) return;
        var speedMs = Drupal.dynamicTokens.parseSpeed(el, 5000);
    
        /* Performs token refresh via fetch to get next dynamic token value and apply crossfade on update. */
        function tick() {
          console.log("tick");
          var id = el.getAttribute('data-token-id');
          fetch(Drupal.url('dynamic-token/' + id + '/next'))
            .then(function(r){ return r.json(); })
            .then(function(data){ if (data && typeof data.value === 'string') crossfade(el, data.value); })
            .catch(function(){});
        }
        
        var handle = setInterval(tick, speedMs);
        Drupal.dynamicTokens.intervals.set(el, handle);
        document.addEventListener('visibilitychange', function(){
          if (document.hidden) { clearInterval(handle); }
          else { handle = setInterval(tick, speedMs); }
        });
      });
    },
    detach: function (context) {
      context.querySelectorAll('span.dynamic-token[data-token-type-id="dynamic_text_token"]').forEach(function (el) {
        var h = Drupal.dynamicTokens.intervals.get(el);
        if (h) { clearInterval(h); Drupal.dynamicTokens.intervals.delete(el); }
      });
    }
  };
})(Drupal, drupalSettings);
