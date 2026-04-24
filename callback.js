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

  // PKCE flow detection: Supabase sends ?code=... WITHOUT `type` in PKCE mode.
  // Distinguish OAuth (has `state` nonce) from magic link (no state). Signup
  // can't be distinguished from magic link at this layer — the app figures it
  // out via the session metadata after exchangeCodeForSession.
  if (params.code && !params.type) {
    params.type = params.state ? 'oauth' : 'magiclink';
  }

  var type = params.type || '';
  var deepLink = null;

  if (params.error) {
    showError('Authentication failed: ' + (params.error_description || params.error));
  } else if (WHITELIST_TYPES.indexOf(type) === -1) {
    showError('Invalid authentication link (type=' + (type || 'missing') + ').');
  } else {
    var deepLinkParams = new URLSearchParams();
    deepLinkParams.set('type', type);
    // Forward every known auth field Supabase might send.
    ['access_token', 'refresh_token', 'token', 'token_hash', 'code', 'state', 'expires_in', 'expires_at'].forEach(function (k) {
      if (params[k]) deepLinkParams.set(k, params[k]);
    });
    deepLink = 'voice-tool://auth/callback?' + deepLinkParams.toString();
  }

  function triggerDeepLink() {
    if (!deepLink) {
      // Fallback: open the GitHub release page so the user can install the app.
      window.open('https://github.com/Nolyo/voice-tool/releases/latest', '_blank');
      return;
    }
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = deepLink;
    document.body.appendChild(iframe);
    setTimeout(function () {
      window.location.href = deepLink;
    }, 100);
  }

  // ALWAYS register the click handler first — button must work even in error state.
  retryBtn.addEventListener('click', triggerDeepLink);

  if (deepLink) {
    show('Opening Voice Tool…');
    triggerDeepLink();
    setTimeout(function () {
      show('If Voice Tool did not open automatically:');
      revealActions();
    }, 2000);
  } else {
    // Error case — reveal actions so the user gets a download link.
    revealActions();
  }
})();
