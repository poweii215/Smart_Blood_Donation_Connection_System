import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
import os

def init_cloudinary():
    """Initialize Cloudinary with environment variables."""
    cloudinary_url_env = os.getenv("CLOUDINARY_URL")
    
    if not cloudinary_url_env:
        raise ValueError("CLOUDINARY_URL environment variable is not set")
    
    cloudinary.config(secure=True)


async def upload_to_cloudinary(file, folder: str, resource_type: str = "image"):
    """
    Upload file to Cloudinary.
    
    Args:
        file: FastAPI UploadFile
        folder: Cloudinary folder (e.g., "avatars", "homepage")
        resource_type: Type of resource (default: "image")
    
    Returns:
        dict with secure_url and public_id
    """
    content = await file.read()
    
    try:
        result = cloudinary.uploader.upload(
            content,
            folder=f"sbdcs/{folder}",
            resource_type=resource_type,
            overwrite=False,
            unique_filename=True,
        )
        return {
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
        }
    except Exception as e:
        raise ValueError(f"Failed to upload to Cloudinary: {str(e)}")
