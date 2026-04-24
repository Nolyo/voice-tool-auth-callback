(function () {
  'use strict';

  var WHITELIST_TYPES = ['magiclink', 'oauth', 'signup', 'recovery', 'email_change'];
  var statusEl = document.getElementById('status');
  var actionsEl = document.getElementById('actions');
  var errorEl = document.getElementById('error-msg');
  var retryBtn = document.getElementById('retry-btn');

  function show(msg) { statusEl.textContent = msg; }
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }
  function revealActions() { actionsEl.hidden = false; }

  // Parse both query string AND hash fragment (Supabase OAuth returns tokens in hash).
  function parseParams() {
    var out = {};
    try {
      var query = new URLSearchParams(window.location.search);
      query.forEach(function (v, k) { out[k] = v; });
      if (window.location.hash && window.location.hash.length > 1) {
        var hash = new URLSearchParams(window.location.hash.substring(1));
        hash.forEach(function (v, k) { out[k] = v; });
      }
    } catch (e) {
      // ignore
    }
    return out;
  }

  var params = parseParams();

  // Strip tokens from URL immediately to avoid Referer / history leaks.
  try {
    history.replaceState({}, document.title, window.location.pathname);
  } catch (_) { /* old browsers, non-blocking */ }

  var type = params.type || '';
  if (WHITELIST_TYPES.indexOf(type) === -1) {
    // Supabase sometimes sends 'error' or 'error_description' — surface them gracefully.
    if (params.error) {
      showError('Authentication failed: ' + (params.error_description || params.error));
    } else {
      showError('Invalid authentication link.');
    }
    revealActions();
    return;
  }

  // Build deep link payload.
  var deepLinkParams = new URLSearchParams();
  deepLinkParams.set('type', type);
  // Forward every known auth field Supabase might send.
  ['access_token', 'refresh_token', 'token', 'token_hash', 'code', 'state', 'expires_in', 'expires_at'].forEach(function (k) {
    if (params[k]) deepLinkParams.set(k, params[k]);
  });

  var deepLink = 'voice-tool://auth/callback?' + deepLinkParams.toString();

  function triggerDeepLink() {
    // Use a hidden iframe to avoid navigating away on failure.
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);
    // Fallback: also try direct navigation (some browsers block iframe schemes).
    setTimeout(function () {
      window.location.href = deepLink;
    }, 100);
  }

  show('Opening Voice Tool…');
  triggerDeepLink();

  // After 2s, reveal fallback UI.
  setTimeout(function () {
    show('If Voice Tool did not open automatically:');
    revealActions();
  }, 2000);

  retryBtn.addEventListener('click', triggerDeepLink);
})();
