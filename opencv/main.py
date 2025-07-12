"""
FastAPI application for ArUco marker detection
"""

import io
import logging
from typing import Dict, Any
import cv2
import numpy as np

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from marker_detector import detect_markers, detect_markers_with_annotation

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ArUco Marker Detection API",
    description="API for detecting ArUco markers in uploaded images using OpenCV",
    version="1.0.0"
)

# Add CORS middleware for web browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supported image formats
SUPPORTED_FORMATS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "ArUco Marker Detection API",
        "version": "1.0.0",
        "endpoints": {
            "/detect-markers": "POST - Upload image and detect ArUco markers",
            "/detect-markers-annotated": "POST - Upload image and get annotated result image",
            "/health": "GET - Health check"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "ArUco Marker Detection API"}


@app.post("/detect-markers")
async def detect_markers_endpoint(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Detect ArUco markers in uploaded image
    
    Args:
        file: Uploaded image file
        
    Returns:
        JSON response with detected markers information
    """
    try:
        # Validate file
        await _validate_uploaded_file(file)
        
        # Read file content
        image_bytes = await file.read()
        
        # Detect markers
        logger.info(f"Processing image: {file.filename}, size: {len(image_bytes)} bytes")
        detection_result = detect_markers(image_bytes)
        
        # Add metadata
        response = {
            **detection_result,
            "filename": file.filename,
            "file_size": len(image_bytes),
            "content_type": file.content_type
        }
        
        logger.info(f"Detection completed: {detection_result['total_markers']} markers found")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing image {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/detect-markers-annotated")
async def detect_markers_annotated_endpoint(file: UploadFile = File(...)):
    """
    Detect ArUco markers and return annotated image
    
    Args:
        file: Uploaded image file
        
    Returns:
        Annotated image with detected markers highlighted
    """
    try:
        # Validate file
        await _validate_uploaded_file(file)
        
        # Read file content
        image_bytes = await file.read()
        
        # Detect markers and get annotated image
        logger.info(f"Processing image for annotation: {file.filename}")
        detection_result, annotated_image = detect_markers_with_annotation(image_bytes)
        
        if annotated_image is None:
            raise HTTPException(status_code=400, detail="Could not process image")
        
        # Encode annotated image as PNG
        _, buffer = cv2.imencode('.png', annotated_image)
        image_stream = io.BytesIO(buffer.tobytes())
        
        logger.info(f"Annotation completed: {detection_result.get('total_markers', 0)} markers found")
        
        return StreamingResponse(
            image_stream,
            media_type="image/png",
            headers={
                "X-Detected-Markers": str(detection_result.get('total_markers', 0)),
                "X-Original-Filename": file.filename or "unknown"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing image {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


async def _validate_uploaded_file(file: UploadFile) -> None:
    """
    Validate uploaded file
    
    Args:
        file: Uploaded file to validate
        
    Raises:
        HTTPException: If file is invalid
    """
    # Check if file is provided
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Check file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413, 
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Check file format
    if file.filename:
        file_extension = "." + file.filename.split(".")[-1].lower()
        if file_extension not in SUPPORTED_FORMATS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_extension}. "
                       f"Supported formats: {', '.join(SUPPORTED_FORMATS)}"
            )
    
    # Check content type
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid content type: {file.content_type}. Expected image file."
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")