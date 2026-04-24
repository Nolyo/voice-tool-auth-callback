# voice-tool-auth-callback

Page statique servant le callback auth de Voice Tool v3 (magic link, OAuth, reset password). Déployée sur Cloudflare Pages.

## Rôle

1. Lit `?token=...&type=...` depuis l'URL
2. Retire immédiatement le token de l'URL (`history.replaceState`)
3. Vérifie le `state` pour les retours OAuth (anti-CSRF)
4. Déclenche le deep link `voice-tool://auth/callback?token=...&type=...`
5. Affiche un fallback "Ouvrir Voice Tool" + lien de téléchargement

## CSP

Ultra-stricte, zéro JS tiers (pas d'analytics, pas de chat, pas de Sentry). Voir `_headers`.

## Déploiement

Auto-déployé par Cloudflare Pages à chaque push sur `main`. Preview sur chaque PR.

## Références

- Spec complète : [`docs/v3/01-auth.md`](https://github.com/Nolyo/voice-tool/blob/main/docs/v3/01-auth.md) (repo principal)
- ADR 0005 : flow callback page web + deep link
- ADR 0007 : Cloudflare Pages + CSP stricte
