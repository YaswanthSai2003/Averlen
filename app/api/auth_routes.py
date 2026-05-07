from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.security import (create_access_token, hash_password,
                               verify_password)
from app.db.database import get_session
from app.db.models import Organization, User
from app.schemas.auth import Token, UserCreate, UserRead
from app.services.demo_service import ensure_demo_workspace

router = APIRouter(prefix="/auth", tags=["Auth"])

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.rate_limit_enabled,
)

PUBLIC_EMAIL_DOMAINS = {
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "protonmail.com",
    "aol.com",
    "rediffmail.com",
}


def get_email_domain(email: str) -> str:
    return email.split("@")[-1].lower().strip()


def build_organization_name(email: str, full_name: str | None) -> str:
    domain = get_email_domain(email)

    if domain not in PUBLIC_EMAIL_DOMAINS:
        company_name = domain.split(".")[0]
        return company_name.title()

    display_name = full_name or email.split("@")[0]
    return f"{display_name}'s Workspace"


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_user(
    payload: UserCreate,
    session: Session = Depends(get_session),
):
    existing_user = session.exec(
        select(User).where(User.email == payload.email)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    organization_name = build_organization_name(
        email=payload.email,
        full_name=payload.full_name,
    )

    organization = session.exec(
        select(Organization).where(Organization.name == organization_name)
    ).first()

    if not organization:
        organization = Organization(name=organization_name)
        session.add(organization)
        session.commit()
        session.refresh(organization)

    user = User(
        organization_id=organization.id,
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )

    session.add(user)
    session.commit()
    session.refresh(user)

    return user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login_user(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = session.exec(select(User).where(User.email == form_data.username)).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.email)

    return Token(access_token=access_token, token_type="bearer")


@router.post("/demo-login", response_model=Token)
def demo_login(
    session: Session = Depends(get_session),
):
    demo_user = ensure_demo_workspace(session)
    access_token = create_access_token(subject=demo_user.email)

    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserRead)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
