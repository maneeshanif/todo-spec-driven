"""HTTP caching utilities for API responses."""
import hashlib
import json
from typing import Any, Optional
from datetime import datetime
from fastapi import Request, Response


def generate_etag(data: Any) -> str:
    """
    Generate ETag from data hash.

    ETags enable conditional requests - if client sends If-None-Match
    with the same ETag, we can return 304 Not Modified.

    Args:
        data: Any JSON-serializable data

    Returns:
        MD5 hash of the data as ETag

    Example:
        etag = generate_etag(tasks)
        response.headers["ETag"] = f'"{etag}"'
    """
    try:
        # Serialize data to JSON
        content = json.dumps(data, sort_keys=True, default=str)

        # Generate MD5 hash
        return hashlib.md5(content.encode()).hexdigest()
    except Exception:
        # Fallback to timestamp-based ETag if serialization fails
        return hashlib.md5(str(datetime.utcnow()).encode()).hexdigest()


def check_etag_match(request: Request, etag: str) -> bool:
    """
    Check if request ETag matches current data ETag.

    Args:
        request: FastAPI request object
        etag: Current ETag for the data

    Returns:
        True if ETags match (client has current version)

    Example:
        if check_etag_match(request, etag):
            return Response(status_code=304)
    """
    if_none_match = request.headers.get("If-None-Match", "").strip('"')
    return if_none_match == etag


def set_cache_headers(
    response: Response,
    *,
    max_age: int = 60,
    private: bool = True,
    must_revalidate: bool = False,
    etag: Optional[str] = None
):
    """
    Set HTTP cache headers on response.

    Args:
        response: FastAPI response object
        max_age: Cache duration in seconds (default: 60)
        private: If True, only browser caches (not CDN)
        must_revalidate: Force revalidation after max_age
        etag: Optional ETag value

    Example:
        set_cache_headers(
            response,
            max_age=60,
            private=True,
            etag=generate_etag(data)
        )
    """
    cache_directives = []

    # Public vs Private caching
    if private:
        cache_directives.append("private")
    else:
        cache_directives.append("public")

    # Max age
    cache_directives.append(f"max-age={max_age}")

    # Must revalidate
    if must_revalidate:
        cache_directives.append("must-revalidate")

    # Set Cache-Control header
    response.headers["Cache-Control"] = ", ".join(cache_directives)

    # Set ETag if provided
    if etag:
        response.headers["ETag"] = f'"{etag}"'

    # Set Last-Modified
    response.headers["Last-Modified"] = datetime.utcnow().strftime(
        "%a, %d %b %Y %H:%M:%S GMT"
    )


def no_cache(response: Response):
    """
    Disable caching for sensitive or frequently changing data.

    Args:
        response: FastAPI response object

    Example:
        no_cache(response)
        return {"token": jwt_token}
    """
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"


# Cache duration presets (in seconds)
CACHE_DURATIONS = {
    "none": 0,           # No caching
    "short": 60,         # 1 minute
    "medium": 300,       # 5 minutes
    "long": 3600,        # 1 hour
    "day": 86400,        # 24 hours
    "week": 604800,      # 7 days
}


# Example usage in routes:
"""
from src.utils.caching import generate_etag, check_etag_match, set_cache_headers

@router.get("/api/{user_id}/tasks")
async def list_tasks(
    user_id: str,
    request: Request,
    response: Response,
):
    # Get tasks from database
    tasks = get_tasks(user_id)

    # Generate ETag
    etag = generate_etag(tasks)

    # Check if client has current version
    if check_etag_match(request, etag):
        return Response(status_code=304)

    # Set cache headers (60 second cache)
    set_cache_headers(
        response,
        max_age=60,
        private=True,
        etag=etag
    )

    return tasks


@router.post("/api/{user_id}/tasks")
async def create_task(
    user_id: str,
    data: TaskCreate,
    response: Response,
):
    # Create task
    task = create_task_in_db(user_id, data)

    # Disable caching for POST/PUT/DELETE
    no_cache(response)

    return task
"""
