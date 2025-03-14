# backend/app/api/endpoints/images.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.utils.supabase_client import upload_file_supabase
from PIL import Image
import io
from fastapi import Form
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.schemas.image import MultiCropRequest
from app.utils.supabase_client import upload_file_supabase
from PIL import Image
import io
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import cv2
import numpy as np
import io
from PIL import Image
from app.utils.supabase_client import upload_file_supabase



router = APIRouter()

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file") from e

    buffer = io.BytesIO()
    image.save(buffer, format=image.format)
    buffer.seek(0)

    try:
        public_url = upload_file_supabase(file_obj=buffer, destination_path=file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"filename": file.filename, "url": public_url}

# backend/app/api/endpoints/images.py (add below your /upload endpoint)

@router.post("/crop")
async def crop_image(
    file: UploadFile = File(...),
    left: int = Form(...),
    top: int = Form(...),
    right: int = Form(...),
    bottom: int = Form(...)
):
    # Read and open the image
    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file") from e

    # Perform cropping using Pillow
    try:
        cropped_image = image.crop((left, top, right, bottom))
    except Exception as e:
        raise HTTPException(status_code=400, detail="Error cropping image") from e

    # Save the cropped image to an in-memory buffer
    buffer = io.BytesIO()
    cropped_image.save(buffer, format=image.format)
    buffer.seek(0)

    # Upload the cropped image to Supabase Storage (prefix filename with 'cropped_')
    try:
        public_url = upload_file_supabase(file_obj=buffer, destination_path="cropped_" + file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    return {"filename": file.filename, "url": public_url}

# backend/app/api/endpoints/images.py



@router.post("/multicrop")
async def multicrop_image(
    file: UploadFile = File(...),
    crops: str = Form(...)
):
    """
    Accepts an image file ('file') and a JSON string ('crops') representing 
    multiple crop regions, for example:
    
    crops = [
      { "left": 10, "top": 20, "right": 100, "bottom": 120, "name": "Logo" },
      { "left": 130, "top": 200, "right": 230, "bottom": 300 }
    ]
    
    Each crop object must have left, top, right, bottom (integers).
    'name' is optional and defaults to 'crop_<index>'.
    """
    # 1. Parse the 'crops' JSON string
    try:
        crop_data = json.loads(crops)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid crop data format. Must be valid JSON.")

    # 2. Read and open the original image
    try:
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file or unable to open.")

    # 3. Crop each region and upload
    results = []
    for idx, crop in enumerate(crop_data):
        # Name field (optional); default to "crop_{idx}"
        crop_name = crop.get("name", f"{crop['name']}.png")

        # Extract coordinates (required)
        try:
            left = int(crop["left"])
            top = int(crop["top"])
            right = int(crop["right"])
            bottom = int(crop["bottom"])
        except KeyError:
            raise HTTPException(status_code=400, detail="Missing one of [left, top, right, bottom].")

        # Perform the crop
        try:
            cropped_image = image.crop((left, top, right, bottom))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error cropping image: {str(e)}")

        # Convert to bytes for uploading
        buffer = io.BytesIO()
        cropped_image.save(buffer, format=image.format)
        buffer.seek(0)

        # Generate a filename that includes the index or name
        # You could also incorporate 'crop_name' here if desired:
        #  e.g., crop_filename = f"{crop_name}_{file.filename}"
        # crop_filename = f"crop_{idx}_{file.filename}"
        crop_filename = f"{crop['name']}.png"   

        # Upload to Supabase (or your storage service)
        try:
            public_url = upload_file_supabase(file_obj=buffer, destination_path=crop_filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")

        results.append({
            "index": idx,
            "name": crop_name,
            "filename": crop_filename,
            "url": public_url
        })

    return {
        "original_filename": file.filename,
        "num_crops": len(results),
        "crops": results
    }

@router.post("/auto_crop")
async def auto_crop_scans(file: UploadFile = File(...)) -> dict:
    """
    Automatically detects and crops multiple 'document regions' from a scanned image.
    Returns a list of URLs for each cropped image.
    """
    # 1. Read the uploaded file
    try:
        contents = await file.read()
        # Convert to a NumPy array for OpenCV
        np_img = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Invalid image data.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read image file: {e}")

    # 2. Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 3. (Optional) Apply blur or morphological operations to reduce noise
    #    Helps with better contour detection
    gray = cv2.GaussianBlur(gray, (5, 5), 0)

    # 4. Edge detection or thresholding
    #    (A) Canny edge detection
    edges = cv2.Canny(gray, threshold1=50, threshold2=150)
    #    (B) Alternatively, you could do a simple threshold:
    # _, thresh = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)

    # 5. Find contours
    #    For Canny, we find contours on 'edges'; for threshold, we find on 'thresh'.
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # 6. Filter and sort contours (e.g., by area) to find the largest or most relevant
    #    We'll keep all that exceed a certain area threshold.
    min_area = 5000  # Adjust this based on your use case
    valid_contours = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > min_area:
            valid_contours.append(cnt)

    # Sort by descending area, in case you want the biggest "documents" first
    valid_contours.sort(key=cv2.contourArea, reverse=True)

    # 7. For each valid contour, crop and upload
    cropped_urls = []
    for idx, cnt in enumerate(valid_contours):
        # Get bounding box (x, y, w, h)
        x, y, w, h = cv2.boundingRect(cnt)

        # Crop from the original image
        cropped = image[y:y+h, x:x+w]

        # Convert the cropped image back to a file-like object
        # so we can upload it to Supabase.
        _, cropped_encoded = cv2.imencode('.jpg', cropped)
        cropped_bytes = io.BytesIO(cropped_encoded.tobytes())
        cropped_filename = f"auto_crop_{idx}_{file.filename}"

        # Upload to Supabase
        try:
            public_url = upload_file_supabase(file_obj=cropped_bytes, destination_path=cropped_filename)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Upload error: {e}")

        cropped_urls.append({"filename": cropped_filename, "url": public_url})

    return {
        "original_filename": file.filename,
        "num_crops": len(cropped_urls),
        "cropped_images": cropped_urls
    }
