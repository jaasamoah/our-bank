---
name: Clean restart after context edits
description: Full workflow restarts are the reliable validation step after changing React context provider modules.
---

React Fast Refresh can temporarily preserve stale provider boundaries after changing a context module, producing misleading “useX must be used within a Provider” and invalid hook-call errors. A clean frontend workflow restart followed by a fresh preview distinguishes this HMR state from an application defect.

**Why:** Context modules were edited during the auth/admin integration and the hot-reloaded preview showed provider errors even though a clean start rendered correctly.

**How to apply:** After changing AuthContext or another provider module, restart the frontend workflow before judging browser-console errors or taking the final preview.