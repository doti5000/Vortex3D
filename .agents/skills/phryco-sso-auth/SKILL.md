---
name: phryco-sso-auth
description: Governs Phryco LLC OAuth2 / PKCE Single Sign-On (SSO) authentication, token verification, and security crawler checks across Phryco and Vortex3D.
---

# Phryco SSO Authentication Skill

Guiding protocol for implementing, testing, and verifying Phryco LLC OAuth2 PKCE Single Sign-On.

## Core Rules

1. **Zero-Trust Token Validation**:
   - Always validate access tokens and authorization codes against the backend server or authorized worker URL (`https://autumn-credit-7767.forbusiness68-8-65-43.workers.dev/`).
   - Never trust client-side claims or fallbacks.

2. **PKCE Security Parameters**:
   - Use `CLIENT_ID: phryco_rHTNGFVGpzdw1Fs0wX5h`.
   - Support `code_challenge_method`: `S256` or `plain`.
   - Scopes: `profile`, `email`, `avatar`.

3. **User Profile Synchronization**:
   - Store signed server tokens in `localStorage.setItem('vortex3d_token', token)` upon authorization success.
   - Sync user role, username, and Phrybucks currency balance (`#fbbf24`).
