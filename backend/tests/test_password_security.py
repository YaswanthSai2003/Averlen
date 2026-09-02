import bcrypt

from app.core.security import (
    LEGACY_PASSWORD_HASH_PREFIX,
    PASSWORD_HASH_PREFIX,
    _legacy_prehash_password,
    hash_password,
    verify_password,
)


def test_new_password_hash_uses_safe_hex_prehash_format():
    password = "Test@12345"

    hashed_password = hash_password(password)

    assert hashed_password.startswith(PASSWORD_HASH_PREFIX)
    assert verify_password(password, hashed_password)
    assert not verify_password("WrongPassword@123", hashed_password)


def test_legacy_raw_sha256_bcrypt_hash_still_verifies():
    password = "Legacy@Test123"

    legacy_hash = bcrypt.hashpw(
        _legacy_prehash_password(password),
        bcrypt.gensalt(rounds=4),
    ).decode("utf-8")

    stored_password = LEGACY_PASSWORD_HASH_PREFIX + legacy_hash

    assert verify_password(password, stored_password)
    assert not verify_password("WrongPassword@123", stored_password)