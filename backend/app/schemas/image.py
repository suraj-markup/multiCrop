# backend/app/schemas/image.py
from pydantic import BaseModel
from typing import List

class CropParameters(BaseModel):
    left: int
    top: int
    right: int
    bottom: int

class MultiCropRequest(BaseModel):
    crops: List[CropParameters]
