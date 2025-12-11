"""Authentication service for login and signup operations."""
from typing import Optional, Dict, Any
from sqlmodel.ext.asyncio.session import AsyncSession
from src.models.user import User
from src.services.user_service import UserService
from src.core.security import verify_password, create_access_token
from src.core.errors import UnauthorizedError, ConflictError, ValidationError
from src.core.logging import get_logger

logger = get_logger(__name__)


class AuthService:
    """Service for authentication operations."""
    
    @staticmethod
    async def signup(
        session: AsyncSession,
        email: str,
        password: str,
        name: str
    ) -> Dict[str, Any]:
        """
        Register a new user.
        
        Args:
            session: Database session
            email: User email address
            password: Plain text password
            name: User display name
            
        Returns:
            Dictionary with access_token, token_type, and user data
            
        Raises:
            ValidationError: If input validation fails
            ConflictError: If email already exists
        """
        # Validate input
        if not email or "@" not in email:
            raise ValidationError("Invalid email format")
        
        if not password or len(password) < 8:
            raise ValidationError("Password must be at least 8 characters")
        
        if not name or len(name) < 1:
            raise ValidationError("Name is required")
        
        # Check if user already exists
        existing_user = await UserService.get_by_email(session, email)
        if existing_user:
            logger.warning(f"Signup attempt with existing email", extra={"email": email})
            raise ConflictError("User", "Email already registered")
        
        # Create new user
        user = await UserService.create_user(session, email, password, name)
        
        # Generate JWT token
        token_data = {"sub": user.id, "email": user.email}
        access_token = create_access_token(token_data)
        
        logger.info(f"User signup successful", extra={"user_id": user.id, "email": email})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat(),
            }
        }
    
    @staticmethod
    async def login(
        session: AsyncSession,
        email: str,
        password: str
    ) -> Dict[str, Any]:
        """
        Authenticate user and generate JWT token.
        
        Args:
            session: Database session
            email: User email address
            password: Plain text password
            
        Returns:
            Dictionary with access_token, token_type, and user data
            
        Raises:
            UnauthorizedError: If credentials are invalid
        """
        # Get user by email
        user = await UserService.get_by_email(session, email)
        if not user:
            logger.warning(f"Login attempt with non-existent email", extra={"email": email})
            raise UnauthorizedError("Invalid email or password")
        
        # Verify password
        if not verify_password(password, user.hashed_password):
            logger.warning(f"Login attempt with incorrect password", extra={"email": email, "user_id": user.id})
            raise UnauthorizedError("Invalid email or password")
        
        # Generate JWT token
        token_data = {"sub": user.id, "email": user.email}
        access_token = create_access_token(token_data)
        
        logger.info(f"User login successful", extra={"user_id": user.id, "email": email})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "created_at": user.created_at.isoformat(),
                "updated_at": user.updated_at.isoformat(),
            }
        }
