"""
FastAPI application for ArUco marker detection
"""

import io
import os
import logging
import sys
import traceback
from typing import Dict, Any

# Configure logging early with detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("=" * 50)
logger.info("Starting ArUco Marker Detection API")
logger.info(f"Python version: {sys.version}")
logger.info(f"Current working directory: {os.getcwd()}")
logger.info(f"Python path: {sys.path}")
logger.info("=" * 50)

try:
    logger.info("Importing OpenCV...")
    import cv2
    logger.info(f"OpenCV version: {cv2.__version__}")
except ImportError as e:
    logger.error(f"Failed to import OpenCV: {e}")
    sys.exit(1)

try:
    logger.info("Importing NumPy...")
    import numpy as np
    logger.info(f"NumPy version: {np.__version__}")
except ImportError as e:
    logger.error(f"Failed to import NumPy: {e}")
    sys.exit(1)

try:
    logger.info("Importing FastAPI...")
    from fastapi import FastAPI, File, UploadFile, HTTPException
    from fastapi.responses import JSONResponse, StreamingResponse
    from fastapi.middleware.cors import CORSMiddleware
    logger.info("FastAPI imported successfully")
except ImportError as e:
    logger.error(f"Failed to import FastAPI: {e}")
    sys.exit(1)

try:
    logger.info("Importing marker_detector module...")
    from marker_detector import detect_markers, detect_markers_with_annotation
    logger.info("marker_detector module imported successfully")
except ImportError as e:
    logger.error(f"Failed to import marker_detector: {e}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    sys.exit(1)

logger.info("Creating FastAPI application...")
app = FastAPI(
    title="ArUco Marker Detection API",
    description="API for detecting ArUco markers in uploaded images using OpenCV",
    version="1.0.0"
)
logger.info("FastAPI application created successfully")

# Get environment variables
ENVIRONMENT = os.getenv("ENVIRONMENT", "dev")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

logger.info(f"Environment variables:")
logger.info(f"  ENVIRONMENT: {ENVIRONMENT}")
logger.info(f"  FRONTEND_URL: {FRONTEND_URL}")

# Configure CORS origins based on environment
if ENVIRONMENT == "prod":
    # Production origins
    allowed_origins = [
        FRONTEND_URL,
        "https://menkoverse.com",
    ]
    logger.info("Using production CORS origins")
else:
    # Development origins - allow all origins for development
    allowed_origins = ["*"]
    logger.info("Using development CORS origins (allow all)")

logger.info(f"Allowed CORS origins: {allowed_origins}")

# Add CORS middleware for web browser access
logger.info("Adding CORS middleware...")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
logger.info("CORS middleware added successfully")

# Supported image formats
SUPPORTED_FORMATS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

logger.info(f"Supported image formats: {SUPPORTED_FORMATS}")
logger.info(f"Maximum file size: {MAX_FILE_SIZE // (1024*1024)}MB")

# Test OpenCV functionality
try:
    logger.info("Testing OpenCV functionality...")
    test_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    logger.info("OpenCV ArUco dictionary test passed")
except Exception as e:
    logger.error(f"OpenCV ArUco test failed: {e}")
    logger.error(f"Traceback: {traceback.format_exc()}")

# Test marker detector functions
try:
    logger.info("Testing marker detector import...")
    from marker_detector import MarkerDetector
    detector = MarkerDetector()
    logger.info("MarkerDetector class instantiated successfully")
except Exception as e:
    logger.error(f"MarkerDetector test failed: {e}")
    logger.error(f"Traceback: {traceback.format_exc()}")


@app.get("/")
async def root():
    """Root endpoint with API information"""
    logger.info("Root endpoint accessed")
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
    logger.info("Health check endpoint accessed")
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
    try:
        logger.info("=" * 50)
        logger.info("Starting uvicorn server...")
        logger.info("Server configuration:")
        logger.info("  Host: 0.0.0.0")
        logger.info("  Port: 5000")
        logger.info("  Log level: info")
        logger.info("=" * 50)
        
        import uvicorn
        logger.info(f"Uvicorn version: {uvicorn.__version__}")
        
        uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
        
    except ImportError as e:
        logger.error(f"Failed to import uvicorn: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        sys.exit(1)