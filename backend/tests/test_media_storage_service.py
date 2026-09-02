from unittest.mock import Mock

from app.core.config import settings
from app.services.media_storage_service import (
    delete_public_image,
    store_public_image,
)


def test_cloudinary_upload_returns_secure_url(monkeypatch):
    monkeypatch.setattr(settings, "media_storage_backend", "cloudinary")
    monkeypatch.setattr(settings, "cloudinary_cloud_name", "demo-cloud")
    monkeypatch.setattr(settings, "cloudinary_api_key", "demo-key")
    monkeypatch.setattr(settings, "cloudinary_api_secret", "demo-secret")
    monkeypatch.setattr(settings, "cloudinary_folder", "averlen")

    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = {
        "secure_url": (
            "https://res.cloudinary.com/demo-cloud/image/upload/"
            "v123/averlen/user_avatars/example.png"
        )
    }
    post = Mock(return_value=response)
    monkeypatch.setattr(
        "app.services.media_storage_service.requests.post",
        post,
    )

    result = store_public_image(
        b"image-bytes",
        extension=".png",
        local_directory="unused",
        local_url_prefix="/uploads/user_avatars",
        cloudinary_subfolder="user_avatars",
    )

    assert result.startswith(
        "https://res.cloudinary.com/demo-cloud/image/upload/"
    )
    request_kwargs = post.call_args.kwargs
    assert request_kwargs["data"]["api_key"] == "demo-key"
    assert request_kwargs["data"]["signature"]
    assert request_kwargs["data"]["public_id"].startswith(
        "averlen/user_avatars/"
    )
    assert request_kwargs["data"]["asset_folder"] == "averlen/user_avatars"


def test_cloudinary_delete_uses_public_id(monkeypatch):
    monkeypatch.setattr(settings, "cloudinary_cloud_name", "demo-cloud")
    monkeypatch.setattr(settings, "cloudinary_api_key", "demo-key")
    monkeypatch.setattr(settings, "cloudinary_api_secret", "demo-secret")

    response = Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = {"result": "ok"}
    post = Mock(return_value=response)
    monkeypatch.setattr(
        "app.services.media_storage_service.requests.post",
        post,
    )

    deleted = delete_public_image(
        (
            "https://res.cloudinary.com/demo-cloud/image/upload/"
            "v123/averlen/property_photos/example.webp"
        ),
        local_directory="unused",
        local_url_prefix="/uploads/property_photos",
    )

    assert deleted is True
    request_kwargs = post.call_args.kwargs
    assert (
        request_kwargs["data"]["public_id"]
        == "averlen/property_photos/example"
    )
    assert request_kwargs["data"]["invalidate"] == "true"


def test_local_media_storage_still_works(monkeypatch, tmp_path):
    monkeypatch.setattr(settings, "media_storage_backend", "local")

    result = store_public_image(
        b"image-bytes",
        extension=".jpg",
        local_directory=str(tmp_path),
        local_url_prefix="/uploads/property_photos",
        cloudinary_subfolder="property_photos",
    )

    assert result.startswith("/uploads/property_photos/")

    deleted = delete_public_image(
        result,
        local_directory=str(tmp_path),
        local_url_prefix="/uploads/property_photos",
    )

    assert deleted is True
