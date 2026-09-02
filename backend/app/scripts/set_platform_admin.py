import argparse

from sqlmodel import Session, select

from app.db.database import engine
from app.db.models import User


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Grant or revoke Averlen platform-admin access.",
    )
    parser.add_argument("email", help="Existing Averlen account email")
    parser.add_argument(
        "--disable",
        action="store_true",
        help="Revoke platform-admin access instead of granting it",
    )
    args = parser.parse_args()

    normalized_email = args.email.strip().lower()

    with Session(engine) as session:
        user = session.exec(
            select(User).where(User.email == normalized_email)
        ).first()

        if not user:
            raise SystemExit(
                f"No Averlen user exists with email: {normalized_email}"
            )

        user.is_platform_admin = not args.disable
        session.add(user)
        session.commit()
        session.refresh(user)

        state = "ENABLED" if user.is_platform_admin else "DISABLED"
        print(f"Platform admin {state} for {user.email}")


if __name__ == "__main__":
    main()
