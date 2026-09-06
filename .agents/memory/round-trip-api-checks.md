---
name: Round-trip API checks
description: A validation rule for optional fields added to CRUD endpoints.
---

When adding an optional field to a CRUD API, test the complete round trip: submit it on create, read the created record, update it, and read it again.

**Why:** A request schema can accept a field while the create or update handler silently omits assigning it, causing the database default to appear successful until a later UI read.

**How to apply:** Include at least one temporary-record smoke test for every new optional persistence field, and remove the temporary record after the assertions pass.