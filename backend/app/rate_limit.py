"""Small, dependency-light rate limiter with Redis support when configured."""

from collections import defaultdict, deque
from threading import Lock
from time import monotonic
import os

from fastapi import HTTPException, Request, status
from redis import Redis


WINDOW_SECONDS = 60
_events: dict[str, deque[float]] = defaultdict(deque)
_lock = Lock()
_redis: Redis | None = None


def _redis_client() -> Redis | None:
    global _redis
    if _redis is not None:
        return _redis
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        return None
    try:
        client = Redis.from_url(redis_url, socket_connect_timeout=0.15, socket_timeout=0.15)
        client.ping()
        _redis = client
    except Exception:
        return None
    return _redis


def _client_key(request: Request) -> str:
    # Do not trust spoofable forwarding headers; the proxy's direct peer is stable.
    return request.client.host if request.client else "unknown"


def rate_limit(name: str, limit: int):
    async def dependency(request: Request):
        key = f"rate:{name}:{_client_key(request)}"
        now = int(monotonic())
        client = _redis_client()
        if client:
            try:
                count = int(client.incr(key))
                if count == 1:
                    client.expire(key, WINDOW_SECONDS)
                if count > limit:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many requests. Try again later.",
                        headers={"Retry-After": str(WINDOW_SECONDS)},
                    )
                return
            except HTTPException:
                raise
            except Exception:
                # A temporary Redis outage should not disable throttling.
                pass

        with _lock:
            bucket = _events[key]
            cutoff = now - WINDOW_SECONDS
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if len(bucket) >= limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Try again later.",
                    headers={"Retry-After": str(WINDOW_SECONDS)},
                )
            bucket.append(now)

    return dependency