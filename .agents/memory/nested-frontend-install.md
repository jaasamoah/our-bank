---
name: Nested frontend package installs
description: Environment-specific guidance for installing dependencies in this split frontend/backend repository.
---

When a repository has no root `package.json` and its Node app is under a nested
directory, install Node dependencies from that app directory rather than
running a generic project-root install.

**Why:** A root-targeted install can create an unintended package manifest and
lockfile outside the app, even when the nested frontend already owns its
dependency manifest.

**How to apply:** Use the nested frontend's existing `package.json` as the
source of truth and keep temporary root-level Node artifacts out of the
repository.