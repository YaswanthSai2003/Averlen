from html import escape
from urllib.parse import quote

import requests

from app.core.config import settings
from app.core.logging import logger


RESEND_EMAILS_URL = "https://api.resend.com/emails"


class EmailDeliveryError(RuntimeError):
    pass


def _send_email(
    *,
    to_email: str,
    subject: str,
    html: str,
) -> None:
    if settings.testing:
        return

    if not settings.resend_api_key:
        if settings.environment.lower() == "production":
            raise EmailDeliveryError(
                "RESEND_API_KEY is not configured"
            )

        logger.info(
            "Email delivery skipped in development because RESEND_API_KEY is not configured. "
            "Recipient=%s Subject=%s",
            to_email,
            subject,
        )
        return

    payload: dict[str, object] = {
        "from": settings.email_from,
        "to": [to_email],
        "subject": subject,
        "html": html,
    }

    if settings.email_reply_to.strip():
        payload["reply_to"] = settings.email_reply_to.strip()

    try:
        response = requests.post(
            RESEND_EMAILS_URL,
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=settings.email_send_timeout_seconds,
        )
    except requests.RequestException as exc:
        logger.exception(
            "Resend request failed. Recipient=%s Subject=%s",
            to_email,
            subject,
        )
        raise EmailDeliveryError(
            "Email provider request failed"
        ) from exc

    if response.status_code < 200 or response.status_code >= 300:
        logger.error(
            "Resend delivery failed. Recipient=%s Status=%s Response=%s",
            to_email,
            response.status_code,
            response.text,
        )
        raise EmailDeliveryError(
            f"Email provider returned HTTP {response.status_code}"
        )

    try:
        response_data = response.json()
    except ValueError as exc:
        logger.error(
            "Resend returned a non-JSON success response. Recipient=%s Response=%s",
            to_email,
            response.text,
        )
        raise EmailDeliveryError(
            "Email provider returned an invalid response"
        ) from exc

    email_id = (
        response_data.get("id")
        if isinstance(response_data, dict)
        else None
    )

    if not email_id:
        logger.error(
            "Resend success response did not contain an email ID. Recipient=%s Response=%s",
            to_email,
            response_data,
        )
        raise EmailDeliveryError(
            "Email provider returned no email ID"
        )

    logger.info(
        "Email accepted by Resend. Recipient=%s EmailID=%s Subject=%s",
        to_email,
        email_id,
        subject,
    )


def _build_email_shell(
    *,
    heading: str,
    body: str,
    action_label: str,
    action_url: str,
    footer: str,
) -> str:
    safe_heading = escape(heading)
    safe_body = escape(body)
    safe_action_label = escape(action_label)
    safe_action_url = escape(action_url, quote=True)
    safe_footer = escape(footer)
    safe_logo_url = escape(
        settings.email_logo_url.strip(),
        quote=True,
    )

    if safe_logo_url:
        brand_html = f"""
      <img
        src="{safe_logo_url}"
        alt="Averlen"
        width="130"
        style="display:block;width:130px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;"
      />
"""
    else:
        brand_html = """
      <div style="font-size:22px;font-weight:700;letter-spacing:0.18em;color:#0f2742;">
        AVERLEN
      </div>
"""

    return f"""
<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
{brand_html}
      <div style="margin-top:24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;">
        <h1 style="margin:0;font-size:24px;line-height:1.3;">{safe_heading}</h1>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#475569;">{safe_body}</p>
        <a
          href="{safe_action_url}"
          style="display:inline-block;margin-top:24px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 18px;border-radius:10px;"
        >
          {safe_action_label}
        </a>
        <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#94a3b8;">{safe_footer}</p>
      </div>
    </div>
  </body>
</html>
""".strip()


def build_verification_url(token: str) -> str:
    base_url = settings.frontend_app_url.rstrip("/")
    return f"{base_url}/verify?token={quote(token)}"


def build_password_reset_url(token: str) -> str:
    base_url = settings.frontend_app_url.rstrip("/")
    return f"{base_url}/reset-password?token={quote(token)}"


def send_verification_email(
    *,
    email: str,
    token: str,
) -> None:
    verification_url = build_verification_url(token)

    if (
        not settings.resend_api_key
        and not settings.testing
        and settings.environment.lower() != "production"
    ):
        logger.info(
            "Averlen verification link for %s: %s",
            email,
            verification_url,
        )

    _send_email(
        to_email=email,
        subject="Verify your Averlen email",
        html=_build_email_shell(
            heading="Verify your email",
            body=(
                "Confirm this email address to activate sign-in for your Averlen workspace."
            ),
            action_label="Verify email",
            action_url=verification_url,
            footer=(
                f"This verification link expires in {settings.email_verification_expire_hours} hours. "
                "If you did not create an Averlen account, you can ignore this email."
            ),
        ),
    )


def send_password_reset_email(
    *,
    email: str,
    token: str,
) -> None:
    reset_url = build_password_reset_url(token)

    if (
        not settings.resend_api_key
        and not settings.testing
        and settings.environment.lower() != "production"
    ):
        logger.info(
            "Averlen password reset link for %s: %s",
            email,
            reset_url,
        )

    _send_email(
        to_email=email,
        subject="Reset your Averlen password",
        html=_build_email_shell(
            heading="Reset your password",
            body=(
                "Use the secure link below to choose a new password for your Averlen account."
            ),
            action_label="Reset password",
            action_url=reset_url,
            footer=(
                f"This reset link expires in {settings.password_reset_expire_minutes} minutes. "
                "If you did not request a password reset, you can ignore this email."
            ),
        ),
    )
