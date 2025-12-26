"""
JWT Token Verification for Better Auth Integration

This module provides JWT token verification for the FastAPI backend.
It verifies tokens using JWKS (JSON Web Key Set) from Better Auth's
/api/auth/jwks endpoint.

Supports EdDSA (Ed25519), RS256, ES256 algorithms.
"""

import httpx
import jwt
from jwt import PyJWKClient, ExpiredSignatureError, InvalidTokenError
from jwt.api_jwk import PyJWK
from fastapi import HTTPException, status
from typing import Dict, Optional, Any
import logging
import time
import asyncio
import os

logger = logging.getLogger(__name__)

# Better Auth URL - configurable via environment variable
# In Kubernetes, this should be the frontend service URL (e.g., http://todo-app-frontend:80)
# Locally, this is typically http://localhost:3000
BETTER_AUTH_URL = os.environ.get("BETTER_AUTH_URL", "http://localhost:3000")

# Cached JWKS data
_jwks_cache: Optional[Dict[str, Any]] = None
_jwks_cache_time: float = 0
_jwks_cache_ttl: float = 300  # 5 minutes


async def fetch_jwks() -> Dict[str, Any]:
    """Fetch JWKS from Better Auth endpoint with caching."""
    global _jwks_cache, _jwks_cache_time

    current_time = time.time()

    # Return cached JWKS if still valid
    if _jwks_cache and (current_time - _jwks_cache_time) < _jwks_cache_ttl:
        return _jwks_cache

    # Fetch new JWKS
    jwks_url = f"{BETTER_AUTH_URL}/api/auth/jwks"
    logger.info(f"[JWT] Fetching JWKS from: {jwks_url}")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url, timeout=10.0)
            response.raise_for_status()
            jwks = response.json()

            logger.info(f"[JWT] JWKS fetched successfully, keys: {len(jwks.get('keys', []))}")

            # Cache the result
            _jwks_cache = jwks
            _jwks_cache_time = current_time

            return jwks
    except Exception as e:
        logger.error(f"[JWT] Failed to fetch JWKS: {e}")
        # Return cached version if available, even if expired
        if _jwks_cache:
            logger.warning("[JWT] Using stale cached JWKS")
            return _jwks_cache
        raise


def get_signing_key_from_jwks(jwks: Dict[str, Any], token: str) -> Any:
    """Get the appropriate signing key from JWKS based on token's kid."""
    # Decode header without verification to get kid
    try:
        unverified_header = jwt.get_unverified_header(token)
        token_kid = unverified_header.get('kid')
        token_alg = unverified_header.get('alg')
        logger.info(f"[JWT] Token header - kid: {token_kid}, alg: {token_alg}")
    except jwt.exceptions.DecodeError as e:
        logger.error(f"[JWT] Failed to decode token header: {e}")
        raise InvalidTokenError(f"Cannot decode token header: {e}")

    # Find the matching key in JWKS
    for key_data in jwks.get('keys', []):
        if key_data.get('kid') == token_kid:
            logger.info(f"[JWT] Found matching key with kid: {token_kid}")
            # Create PyJWK from the key data
            jwk = PyJWK.from_dict(key_data)
            return jwk.key

    # If no kid match, try the first key (some implementations don't use kid)
    keys = jwks.get('keys', [])
    if keys:
        logger.warning(f"[JWT] No kid match found, using first key from JWKS")
        jwk = PyJWK.from_dict(keys[0])
        return jwk.key

    raise InvalidTokenError("No matching key found in JWKS")


async def verify_jwt_token(token: str) -> Dict:
    """
    Verify Better Auth JWT token using JWKS.

    Better Auth's jwt() plugin generates EdDSA (Ed25519) tokens by default.
    We verify them using the public keys from the JWKS endpoint.

    Args:
        token: JWT token string from Authorization header

    Returns:
        Dict containing the decoded token payload with user information

    Raises:
        HTTPException: If token is invalid, expired, or verification fails
    """
    try:
        logger.info(f"[JWT] Verifying token (length: {len(token)}, starts: {token[:50]}...)")

        # Fetch JWKS asynchronously
        jwks = await fetch_jwks()

        # Get the signing key from JWKS
        signing_key = get_signing_key_from_jwks(jwks, token)
        logger.info(f"[JWT] Got signing key, type: {type(signing_key).__name__}")

        # Decode and verify the token
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=['EdDSA', 'RS256', 'ES256', 'HS256'],
            options={
                "verify_aud": False,  # Better Auth may set audience to baseURL
                "verify_iss": False,  # Don't strictly verify issuer
            }
        )

        # Better Auth JWT payload structure:
        # { sub: userId, email: string, name: string, iat: number, exp: number }
        logger.info(f"[JWT] Token payload: {payload}")
        user_id = payload.get('sub')

        if not user_id:
            logger.warning("No user ID (sub) in token payload")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: no user ID found"
            )

        logger.info(f"[JWT] ✓ Token verified successfully for user: {user_id}")
        # Return user info in the expected format
        return {
            'id': user_id,
            'sub': user_id,
            'email': payload.get('email'),
            'name': payload.get('name'),
            'role': payload.get('role'),
        }

    except ExpiredSignatureError:
        logger.warning("Token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except InvalidTokenError as e:
        logger.warning(f"[JWT] JWT verification failed: {e}")
        logger.warning(f"[JWT] Token header may have wrong 'kid' or algorithm mismatch")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or malformed token: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[JWT] Unexpected error in verify_jwt_token: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal authentication error"
        )


def clear_jwks_cache():
    """Clear the JWKS cache to force a refresh."""
    global _jwks_cache, _jwks_cache_time
    _jwks_cache = None
    _jwks_cache_time = 0
    logger.info("[JWT] JWKS cache cleared")

