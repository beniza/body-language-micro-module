/*
 * SCORM 1.2 bridge for the Tap Through micro-module.
 *
 * Defines window.ModuleTracker, which variant-9-taps.html calls if present:
 *   start()                -> { at, score } saved from a previous visit, or null
 *   progress(card, score)  -> remember where the learner is
 *   complete(score, total) -> report the score and mark the module completed
 *
 * When no LMS is found (e.g. the file is opened directly), every call is a no-op.
 */
(function () {
  function findAPI(win) {
    var tries = 0;
    while (win && tries < 10) {
      if (win.API) return win.API;
      if (win.parent && win.parent !== win) { win = win.parent; tries++; } else break;
    }
    return null;
  }

  var api = findAPI(window) || (window.opener ? findAPI(window.opener) : null);
  var active = false;
  var finished = false;

  function get(key) { return active ? String(api.LMSGetValue(key) || '') : ''; }
  function set(key, value) { if (active) api.LMSSetValue(key, String(value)); }
  function commit() { if (active) api.LMSCommit(''); }

  if (api) {
    active = String(api.LMSInitialize('')) === 'true';
  }

  function finish() {
    if (!active || finished) return;
    finished = true;
    set('cmi.core.exit', get('cmi.core.lesson_status') === 'completed' ? '' : 'suspend');
    commit();
    api.LMSFinish('');
  }
  window.addEventListener('pagehide', finish);
  window.addEventListener('beforeunload', finish);

  window.ModuleTracker = {
    start: function () {
      if (!active) return null;
      if (get('cmi.core.lesson_status') === 'not attempted') {
        set('cmi.core.lesson_status', 'incomplete');
        commit();
      }
      try {
        var data = JSON.parse(get('cmi.suspend_data') || 'null');
        return data && typeof data.at === 'number' ? data : null;
      } catch (e) {
        return null;
      }
    },
    progress: function (card, score) {
      if (!active) return;
      set('cmi.core.lesson_location', card);
      set('cmi.suspend_data', JSON.stringify({ at: card, score: score }));
      commit();
    },
    complete: function (score, total) {
      if (!active) return;
      set('cmi.core.score.min', 0);
      set('cmi.core.score.max', 100);
      set('cmi.core.score.raw', total ? Math.round(score / total * 100) : 100);
      set('cmi.core.lesson_status', 'completed');
      set('cmi.suspend_data', '');
      commit();
    }
  };
})();
