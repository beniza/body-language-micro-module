/*
 * Lightweight client-side password gate for the SIL Body Language micro-module preview site.
 *
 * IMPORTANT: this is a soft deterrent, not real security. Only a SHA-256 hash of the password
 * ships in this file (not the password itself), so casually viewing the source doesn't reveal
 * it — but the check still runs entirely in the visitor's browser, so anyone who opens devtools
 * can bypass it (e.g. by deleting the overlay element or calling the unlock code directly), and
 * a determined attacker could brute-force short passwords offline against the hash. Do not rely
 * on this to protect anything sensitive; it only keeps casual/accidental visitors and search
 * engines (see the noindex tags + robots.txt) from landing on the preview.
 */
(function () {
  // SHA-256 hex digest of the site password — never store the plaintext password here.
  var PASSWORD_HASH = '0a30acc34c22a81ca053c29db85439e5a0b4149e3d2c61ddc9d52b96ed85b439';
  var SESSION_KEY = 'sil_blm_gate_ok';

  function sha256Hex(text) {
    if (!(window.crypto && window.crypto.subtle)) {
      return Promise.reject(new Error('Web Crypto unavailable'));
    }
    var data = new TextEncoder().encode(text);
    return window.crypto.subtle.digest('SHA-256', data).then(function (buf) {
      var bytes = Array.from(new Uint8Array(buf));
      return bytes.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  var unlocked = false;
  try {
    unlocked = window.sessionStorage.getItem(SESSION_KEY) === '1';
  } catch (e) {
    /* sessionStorage unavailable (e.g. locked-down browser) — fall through and re-prompt */
  }
  if (unlocked) return;

  // Web Crypto (needed to check the hash) only exists in secure contexts (https:, or localhost).
  // A local file:// preview is not a secure context, so skip the gate there rather than trap
  // reviewers who are just opening the .html files directly off disk — the gate still applies
  // once the site is served over https on GitHub Pages.
  if (!window.isSecureContext) return;

  // Hide the page immediately so nothing flashes before the overlay is ready.
  document.documentElement.style.visibility = 'hidden';

  function showGate() {
    var overlay = document.createElement('div');
    overlay.id = 'sil-gate-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Password required');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:2147483647',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:24px', 'background:#0D3C61', 'color:#fff',
      'font-family:Inter,system-ui,-apple-system,sans-serif'
    ].join(';');

    overlay.innerHTML =
      '<form id="sil-gate-form" style="width:100%;max-width:360px;text-align:center;">' +
        '<p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.65);margin:0 0 12px;">SIL Micro-Learning &middot; Preview</p>' +
        '<h1 style="font-size:22px;line-height:1.3;font-weight:700;margin:0 0 20px;">This page is password-protected</h1>' +
        '<input id="sil-gate-input" type="password" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Enter password" ' +
          'style="width:100%;box-sizing:border-box;padding:13px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.35);background:rgba(255,255,255,.08);color:#fff;font-size:16px;margin-bottom:12px;outline:none;" />' +
        '<button type="submit" style="width:100%;padding:13px 14px;border-radius:10px;border:0;background:#fff;color:#0D3C61;font-weight:700;font-size:15px;cursor:pointer;">Enter</button>' +
        '<p id="sil-gate-error" role="alert" style="min-height:18px;color:#FFC4C4;font-size:13px;margin:12px 0 0;"></p>' +
      '</form>';

    document.body.appendChild(overlay);
    document.documentElement.style.visibility = 'visible';

    var input = document.getElementById('sil-gate-input');
    var form = document.getElementById('sil-gate-form');
    var error = document.getElementById('sil-gate-error');
    var submitBtn = form.querySelector('button[type="submit"]');
    input.focus();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      sha256Hex(input.value)
        .then(function (hash) {
          submitBtn.disabled = false;
          if (hash === PASSWORD_HASH) {
            try { window.sessionStorage.setItem(SESSION_KEY, '1'); } catch (e2) { /* ignore */ }
            overlay.remove();
          } else {
            error.textContent = 'Incorrect password — please try again.';
            input.value = '';
            input.focus();
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          error.textContent = 'Could not verify password in this browser.';
        });
    });
  }

  if (document.body) {
    showGate();
  } else {
    document.addEventListener('DOMContentLoaded', showGate);
  }
})();
