from sqlmodel import Session, select

from app.db.models import Organization


PUBLIC_EMAIL_DOMAINS = {
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "icloud.com",
    "protonmail.com",
    "aol.com",
    "rediffmail.com",
    "example.com",
    "example.org",
    "example.net",
    "test.com",
}


def get_email_domain(email: str) -> str:
    return email.split("@")[-1].lower().strip()


def get_joinable_email_domain(email: str) -> str | None:
    domain = get_email_domain(email)

    if not domain or domain in PUBLIC_EMAIL_DOMAINS:
        return None

    return domain


def find_organization_by_email_domain(
    session: Session,
    email_domain: str | None,
) -> Organization | None:
    if not email_domain:
        return None

    return session.exec(
        select(Organization).where(Organization.email_domain == email_domain)
    ).first()


def build_fallback_organization_name(
    email: str,
    full_name: str | None,
) -> str:
    domain = get_email_domain(email)

    if domain not in PUBLIC_EMAIL_DOMAINS:
        company_name = domain.split(".")[0]
        return company_name.title()

    display_name = full_name or email.split("@")[0]
    return f"{display_name}'s Workspace"
