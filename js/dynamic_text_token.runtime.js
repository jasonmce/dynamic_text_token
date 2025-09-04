(function (Drupal, drupalSettings) {
  Drupal.behaviors.dynamicTextToken = {
    attach: function (context, settings) {
      context.querySelectorAll('span.dynamic-token[data-token-type-id="dynamic_text_token"]').forEach(function (el) {
        if (!Drupal.dynamicTokens.once('dynamicTextBound', el)) return;
        var speedMs = Drupal.dynamicTokens.parseSpeed(el, 5000);
        function tick() {
          var id = el.getAttribute('data-token-id');
          fetch(Drupal.url('dynamic-token/' + id + '/next'))
            .then(function(r){ return r.json(); })
            .then(function(data){ if (data && typeof data.value === 'string') el.textContent = data.value; })
            .catch(function(){});
        }
        tick();
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
