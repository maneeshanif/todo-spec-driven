"""Authentication routes."""
from fastapi import APIRouter, Depends, status
from sqlmodel.ext.asyncio.session import AsyncSession
from src.core.database import get_session
from src.core.deps import get_current_user
from src.schemas.auth import SignupRequest, LoginRequest, AuthResponse
from src.schemas.user import UserPublic
from src.services.auth_service import AuthService
from src.models.user import User
from src.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a new user account with email, password, and name. Returns JWT token for immediate login."
)
async def signup(
    request: SignupRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Register a new user.
    
    - **email**: Valid email address (must be unique)
    - **password**: Minimum 8 characters
    - **name**: User display name
    
    Returns JWT access token and user information.
    """
    result = await AuthService.signup(
        session=session,
        email=request.email,
        password=request.password,
        name=request.name
    )
    
    return AuthResponse(**result)


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="User login",
    description="Authenticate user with email and password. Returns JWT token."
)
async def login(
    request: LoginRequest,
    session: AsyncSession = Depends(get_session)
):
    """
    Authenticate user and generate JWT token.
    
    - **email**: User email address
    - **password**: User password
    
    Returns JWT access token and user information.
    """
    result = await AuthService.login(
        session=session,
        email=request.email,
        password=request.password
    )
    
    return AuthResponse(**result)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="User logout",
    description="Logout current user (client-side token removal)."
)
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    Logout current user.
    
    Note: JWT tokens are stateless, so logout is handled client-side
    by removing the token. This endpoint validates the token is still valid.
    """
    logger.info(f"User logout", extra={"user_id": current_user.id})
    return None


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get current user",
    description="Get authenticated user information from JWT token."
)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    
    Requires valid JWT token in Authorization header.
    """
    return current_user
