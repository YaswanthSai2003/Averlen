import hashlib
import os
import re
import time
import uuid
from urllib.parse import urlparse

import requests

from app.core.config import settings
from app.core.logging import logger


class MediaStorageError(RuntimeError):
    pass


_IMAGE_CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def _cloudinary_credentials() -> tuple[str, str, str]:
    cloud_name = settings.cloudinary_cloud_name.strip()
    api_key = settings.cloudinary_api_key.strip()
    api_secret = settings.cloudinary_api_secret.strip()

    if not cloud_name or not api_key or not api_secret:
        raise MediaStorageError(
            "Cloudinary media storage is not fully configured"
        )

    return cloud_name, api_key, api_secret


def _sign_cloudinary_params(
    params: dict[str, str],
    api_secret: str,
) -> str:
    serialized = "&".join(
        f"{key}={value}"
        for key, value in sorted(params.items())
        if value != ""
    )
    payload = f"{serialized}{api_secret}"
    return hashlib.sha1(payload.encode("utf-8")).hexdigest()


def _cloudinary_asset_folder(subfolder: str) -> str:
    base_folder = settings.cloudinary_folder.strip().strip("/")
    segments = [
        segment
        for segment in (base_folder, subfolder.strip("/"))
        if segment
    ]
    return "/".join(segments)


def _cloudinary_public_id(subfolder: str) -> str:
    asset_folder = _cloudinary_asset_folder(subfolder)
    filename = uuid.uuid4().hex
    return f"{asset_folder}/{filename}" if asset_folder else filename


def _upload_cloudinary_image(
    file_content: bytes,
    *,
    extension: str,
    subfolder: str,
) -> str:
    cloud_name, api_key, api_secret = _cloudinary_credentials()
    timestamp = str(int(time.time()))
    public_id = _cloudinary_public_id(subfolder)

    signed_params = {
        "public_id": public_id,
        "timestamp": timestamp,
    }
    asset_folder = _cloudinary_asset_folder(subfolder)
    if asset_folder:
        signed_params["asset_folder"] = asset_folder
    signature = _sign_cloudinary_params(
        signed_params,
        api_secret,
    )

    upload_url = (
        f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"
    )

    try:
        response = requests.post(
            upload_url,
            data={
                **signed_params,
                "api_key": api_key,
                "signature": signature,
            },
            files={
                "file": (
                    f"upload{extension}",
                    file_content,
                    _IMAGE_CONTENT_TYPES.get(
                        extension,
                        "application/octet-stream",
                    ),
                )
            },
            timeout=settings.media_upload_timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        logger.warning("Cloudinary image upload failed: %s", exc)
        raise MediaStorageError(
            "Cloudinary image upload failed"
        ) from exc

    secure_url = payload.get("secure_url")

    if not isinstance(secure_url, str) or not secure_url.startswith("https://"):
        raise MediaStorageError(
            "Cloudinary returned an invalid image URL"
        )

    return secure_url


def _save_local_image(
    file_content: bytes,
    *,
    extension: str,
    local_directory: str,
    local_url_prefix: str,
) -> str:
    os.makedirs(local_directory, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{extension}"
    file_path = os.path.join(local_directory, filename)

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    return f"{local_url_prefix.rstrip('/')}/{filename}"


def store_public_image(
    file_content: bytes,
    *,
    extension: str,
    local_directory: str,
    local_url_prefix: str,
    cloudinary_subfolder: str,
) -> str:
    if settings.media_storage_backend == "cloudinary":
        return _upload_cloudinary_image(
            file_content,
            extension=extension,
            subfolder=cloudinary_subfolder,
        )

    return _save_local_image(
        file_content,
        extension=extension,
        local_directory=local_directory,
        local_url_prefix=local_url_prefix,
    )


def _cloudinary_public_id_from_url(media_url: str) -> str | None:
    parsed = urlparse(media_url)

    if parsed.scheme != "https" or parsed.hostname != "res.cloudinary.com":
        return None

    parts = [part for part in parsed.path.split("/") if part]

    if not parts:
        return None

    configured_cloud = settings.cloudinary_cloud_name.strip()

    if configured_cloud and parts[0] != configured_cloud:
        return None

    try:
        upload_index = parts.index("upload")
    except ValueError:
        return None

    public_parts = parts[upload_index + 1 :]

    if public_parts and re.fullmatch(r"v\d+", public_parts[0]):
        public_parts = public_parts[1:]

    if not public_parts:
        return None

    public_path = "/".join(public_parts)
    public_id, _ = os.path.splitext(public_path)
    return public_id or None


def _delete_cloudinary_image(media_url: str) -> bool:
    public_id = _cloudinary_public_id_from_url(media_url)

    if not public_id:
        return False

    try:
        cloud_name, api_key, api_secret = _cloudinary_credentials()
    except MediaStorageError as exc:
        logger.warning("Cloudinary image delete skipped: %s", exc)
        return False

    timestamp = str(int(time.time()))
    signed_params = {
        "invalidate": "true",
        "public_id": public_id,
        "timestamp": timestamp,
    }
    signature = _sign_cloudinary_params(
        signed_params,
        api_secret,
    )

    destroy_url = (
        f"https://api.cloudinary.com/v1_1/{cloud_name}/image/destroy"
    )

    try:
        response = requests.post(
            destroy_url,
            data={
                **signed_params,
                "api_key": api_key,
                "signature": signature,
            },
            timeout=settings.media_upload_timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
    except (requests.RequestException, ValueError) as exc:
        logger.warning("Cloudinary image delete failed: %s", exc)
        return False

    return payload.get("result") in {"ok", "not found"}


def _delete_local_image(
    media_url: str,
    *,
    local_directory: str,
    local_url_prefix: str,
) -> bool:
    expected_prefix = f"{local_url_prefix.rstrip('/')}/"

    if not media_url.startswith(expected_prefix):
        return False

    filename = os.path.basename(media_url)

    if not filename:
        return False

    file_path = os.path.join(local_directory, filename)

    try:
        os.remove(file_path)
    except FileNotFoundError:
        return True
    except OSError as exc:
        logger.warning("Local image delete failed: %s", exc)
        return False

    return True


def delete_public_image(
    media_url: str | None,
    *,
    local_directory: str,
    local_url_prefix: str,
) -> bool:
    if not media_url:
        return True

    if _cloudinary_public_id_from_url(media_url):
        return _delete_cloudinary_image(media_url)

    return _delete_local_image(
        media_url,
        local_directory=local_directory,
        local_url_prefix=local_url_prefix,
    )
