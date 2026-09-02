import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# Current format: bcrypt(hex(sha256(password))).
PASSWORD_HASH_PREFIX = "bcrypt_sha256_hex$"
# Legacy format retained for existing accounts.
LEGACY_PASSWORD_HASH_PREFIX = "bcrypt_sha256$"


def _prehash_password(password: str) -> bytes:
    """Prehash to ASCII before bcrypt."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("utf-8")


def _legacy_prehash_password(password: str) -> bytes:
    """Legacy prehash format for existing accounts."""
    return hashlib.sha256(password.encode("utf-8")).digest()


def get_bcrypt_rounds() -> int:
    # Keep tests fast without weakening production hashes.
    if settings.testing:
        return 4

    return settings.bcrypt_rounds


def hash_password(password: str) -> str:
    password_digest = _prehash_password(password)
    hashed = bcrypt.hashpw(
        password_digest,
        bcrypt.gensalt(rounds=get_bcrypt_rounds()),
    )
    return PASSWORD_HASH_PREFIX + hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    try:
        if hashed_password.startswith(PASSWORD_HASH_PREFIX):
            stored_hash = hashed_password.replace(PASSWORD_HASH_PREFIX, "", 1)

            return bcrypt.checkpw(
                _prehash_password(password),
                stored_hash.encode("utf-8"),
            )

        if hashed_password.startswith(LEGACY_PASSWORD_HASH_PREFIX):
            stored_hash = hashed_password.replace(
                LEGACY_PASSWORD_HASH_PREFIX,
                "",
                1,
            )

            return bcrypt.checkpw(
                _legacy_prehash_password(password),
                stored_hash.encode("utf-8"),
            )

        # Support hashes created before prefixes were introduced.
        return bcrypt.checkpw(
            password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )

    except (ValueError, TypeError):
        return False


def create_access_token(subject: str, extra_claims: dict[str, Any] | None = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)

    payload: dict[str, Any] = {
        "sub": subject,
        "type": "access",
        "exp": expire,
        "iat": now,
    }

    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token_claims(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )

        if payload.get("type") != "access":
            return None

        subject = payload.get("sub")

        if not isinstance(subject, str):
            return None

        return payload

    except JWTError:
        return None


def decode_access_token(token: str) -> str | None:
    claims = decode_access_token_claims(token)

    if not claims:
        return None

    subject = claims.get("sub")

    return subject if isinstance(subject, str) else None
