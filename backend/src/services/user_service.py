"""User service for user-related operations."""
from typing import Optional
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from src.models.user import User
from src.core.security import hash_password
from src.core.logging import get_logger

logger = get_logger(__name__)


class UserService:
    """Service for user operations."""
    
    @staticmethod
    async def get_by_email(session: AsyncSession, email: str) -> Optional[User]:
        """
        Get user by email address.
        
        Args:
            session: Database session
            email: User email address
            
        Returns:
            User object if found, None otherwise
        """
        statement = select(User).where(User.email == email)
        result = await session.exec(statement)
        user = result.first()
        
        if user:
            logger.info(f"User found by email", extra={"email": email, "user_id": user.id})
        else:
            logger.info(f"No user found with email", extra={"email": email})
        
        return user
    
    @staticmethod
    async def get_by_id(session: AsyncSession, user_id: str) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            session: Database session
            user_id: User ID
            
        Returns:
            User object if found, None otherwise
        """
        user = await session.get(User, user_id)
        
        if user:
            logger.info(f"User found by ID", extra={"user_id": user_id})
        else:
            logger.info(f"No user found with ID", extra={"user_id": user_id})
        
        return user
    
    @staticmethod
    async def create_user(
        session: AsyncSession,
        email: str,
        password: str,
        name: str
    ) -> User:
        """
        Create a new user.
        
        Args:
            session: Database session
            email: User email address
            password: Plain text password (will be hashed)
            name: User display name
            
        Returns:
            Created User object
        """
        # Hash the password
        hashed_password = hash_password(password)
        
        # Create user object
        user = User(
            email=email,
            hashed_password=hashed_password,
            name=name
        )
        
        # Add to database
        session.add(user)
        await session.commit()
        await session.refresh(user)
        
        logger.info(
            f"User created successfully",
            extra={"user_id": user.id, "email": email, "name": name}
        )
        
        return user
