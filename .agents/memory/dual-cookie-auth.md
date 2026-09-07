---
name: Dual cookie auth
description: Non-obvious constraints for the shared customer/admin frontend authentication model.
---

Customer and administrator sessions use separate HttpOnly cookie namespaces and refresh-token records. The frontend mounts both auth providers at once, so a single shared auth cookie would let one provider accidentally treat the other portal's session as its own.

**Why:** Both portals are rendered by the same React application and probe their own `/me` endpoint during startup. Separating cookies keeps portal boundaries explicit while retaining cookie-only authentication.

**How to apply:** Preserve separate customer/admin access and refresh cookie names when changing login, refresh, logout, or request-interceptor behavior. Keep CSRF protection on state-changing API requests.