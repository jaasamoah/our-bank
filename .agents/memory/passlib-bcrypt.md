---
name: Passlib bcrypt version pin
description: passlib CryptContext(schemes=["bcrypt"]) hashing/verification crashes with newer bcrypt.
---

`passlib==1.7.4` calls `bcrypt.__about__.__version__`, which was removed in `bcrypt` 4.1+/5.x. This causes
`AttributeError: module 'bcrypt' has no attribute '__about__'` followed by a `ValueError: password cannot
be longer than 72 bytes` during passlib's internal backend detection, making every password hash/verify call fail.

**Why:** passlib has not been updated to support bcrypt's newer versions; this breaks any FastAPI/Flask app
using `passlib[bcrypt]` for auth as soon as a fresh install pulls the latest bcrypt.

**How to apply:** When a Python project uses `passlib[bcrypt]` for password hashing, pin `bcrypt==4.0.1`
(or any 4.x release) alongside it. Symptom to watch for: registration/login endpoints returning 500 with
the traceback above.
