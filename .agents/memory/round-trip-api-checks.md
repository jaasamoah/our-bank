---
name: Round-trip API checks
description: A validation rule for optional fields added to CRUD endpoints.
---

When adding an optional field to a CRUD API, test the complete round trip: submit it on create, read the created record, update it, and read it again.

**Why:** A request schema can accept a field while the create or update handler silently omits assigning it, causing the database default to appear successful until a later UI read.

**How to apply:** Include at least one temporary-record smoke test for every new optional persistence field, and remove the temporary record after the assertions pass.

Also confirm there is only one active request-schema definition for each CRUD payload; a later duplicate class can silently override the expanded contract even when the route code is correct.

**Why:** A card update round trip exposed a stale duplicate schema that rejected newly supported fields at runtime despite clean TypeScript and Python compilation.

**How to apply:** Search for duplicate schema class names after extending validation models, then exercise the new fields through the live API.