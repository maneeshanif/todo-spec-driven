"""
Authentication Dependencies for FastAPI

Provides reusable dependencies for route protection and user extraction.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict
from src.middleware.jwt_auth import verify_jwt_token

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict:
    """
    Extract and verify the current user from JWT token.
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        Dict containing user information from the token payload
        
    Raises:
        HTTPException: If no token provided or token is invalid
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = await verify_jwt_token(token)
    
    # Extract user info from token payload
    # Better Auth JWT payload typically contains user object
    user_id = payload.get('id') or payload.get('sub')
    user_email = payload.get('email')
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    return {
        'id': user_id,
        'email': user_email,
        'name': payload.get('name'),
        'role': payload.get('role'),
    }


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict]:
    """
    Extract user information if a valid token is provided, otherwise return None.
    Useful for routes that work for both authenticated and anonymous users.
    
    Args:
        credentials: Bearer token from Authorization header
        
    Returns:
        Dict with user info if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = await verify_jwt_token(token)
        
        user_id = payload.get('id') or payload.get('sub')
        if not user_id:
            return None
            
        return {
            'id': user_id,
            'email': payload.get('email'),
            'name': payload.get('name'),
            'role': payload.get('role'),
        }
    except:
        return None


async def require_admin(
    current_user: Dict = Depends(get_current_user)
) -> Dict:
    """
    Require the current user to have admin role.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Dict containing user information
        
    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.get('role') != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user
