"""
ArUco marker detection module for FastAPI application.
Uses the same detection logic as generate-marker.py
"""

import cv2
import numpy as np
from cv2 import aruco
from typing import List, Dict, Any, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MarkerDetector:
    """ArUco marker detector using DICT_4X4_50 dictionary"""
    
    def __init__(self):
        """Initialize the marker detector with DICT_4X4_50 dictionary"""
        self.dictionary = aruco.getPredefinedDictionary(aruco.DICT_4X4_50)
        self.parameters = aruco.DetectorParameters()
        self.detector = aruco.ArucoDetector(self.dictionary, self.parameters)
        logger.info("MarkerDetector initialized with DICT_4X4_50")
    
    def detect_markers_from_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Detect ArUco markers from image bytes
        
        Args:
            image_bytes: Image data as bytes
            
        Returns:
            Dictionary containing detection results
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            
            # Decode image
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                raise ValueError("Could not decode image")
            
            return self.detect_markers_from_image(image)
            
        except Exception as e:
            logger.error(f"Error processing image bytes: {e}")
            raise
    
    def detect_markers_from_image(self, image: np.ndarray) -> Dict[str, Any]:
        """
        Detect ArUco markers from OpenCV image
        
        Args:
            image: OpenCV image (numpy array)
            
        Returns:
            Dictionary containing detection results
        """
        try:
            # Get image dimensions
            height, width = image.shape[:2]
            
            # Convert to grayscale for better detection
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect markers
            corners, ids, rejected_candidates = self.detector.detectMarkers(gray)
            
            # Process detection results
            detected_markers = []
            
            if ids is not None:
                for i, marker_id in enumerate(ids.flatten()):
                    # Extract corner coordinates
                    corner_points = corners[i][0].tolist()
                    
                    # Calculate confidence (simplified - could be enhanced)
                    # For now, we'll use a basic metric based on marker area
                    confidence = self._calculate_confidence(corners[i][0])
                    
                    marker_info = {
                        "id": int(marker_id),
                        "corners": corner_points,
                        "confidence": confidence
                    }
                    detected_markers.append(marker_info)
                    
                logger.info(f"Detected {len(detected_markers)} markers: {[m['id'] for m in detected_markers]}")
            else:
                logger.info("No markers detected")
            
            result = {
                "detected_markers": detected_markers,
                "total_markers": len(detected_markers),
                "image_size": {
                    "width": width,
                    "height": height
                },
                "rejected_candidates": len(rejected_candidates) if rejected_candidates is not None else 0
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error detecting markers: {e}")
            raise
    
    def _calculate_confidence(self, corners: np.ndarray) -> float:
        """
        Calculate confidence score for a detected marker
        
        Args:
            corners: Corner coordinates of the marker
            
        Returns:
            Confidence score between 0 and 1
        """
        try:
            # Calculate marker area
            area = cv2.contourArea(corners)
            
            # Calculate perimeter
            perimeter = cv2.arcLength(corners, True)
            
            # Basic confidence calculation based on area and regularity
            # A more regular quadrilateral will have a better area/perimeter ratio
            if perimeter > 0:
                regularity = (4 * np.pi * area) / (perimeter * perimeter)
                confidence = min(1.0, max(0.0, regularity))
            else:
                confidence = 0.0
                
            return round(confidence, 3)
            
        except Exception as e:
            logger.warning(f"Error calculating confidence: {e}")
            return 0.5  # Default confidence
    
    def create_annotated_image(self, image: np.ndarray, detection_result: Dict[str, Any]) -> np.ndarray:
        """
        Create an annotated image with detected markers highlighted
        
        Args:
            image: Original image
            detection_result: Detection result from detect_markers_from_image
            
        Returns:
            Annotated image with markers drawn
        """
        try:
            annotated_image = image.copy()
            
            if detection_result["detected_markers"]:
                # Convert detection results back to OpenCV format
                corners_list = []
                ids_list = []
                
                for marker in detection_result["detected_markers"]:
                    corners_list.append([np.array(marker["corners"], dtype=np.float32)])
                    ids_list.append(marker["id"])
                
                ids_array = np.array(ids_list).reshape(-1, 1)
                
                # Draw detected markers
                annotated_image = aruco.drawDetectedMarkers(
                    annotated_image, 
                    corners_list, 
                    ids_array
                )
            
            return annotated_image
            
        except Exception as e:
            logger.error(f"Error creating annotated image: {e}")
            return image


# Create global detector instance
detector = MarkerDetector()


def detect_markers(image_bytes: bytes) -> Dict[str, Any]:
    """
    Convenience function to detect markers from image bytes
    
    Args:
        image_bytes: Image data as bytes
        
    Returns:
        Dictionary containing detection results
    """
    return detector.detect_markers_from_bytes(image_bytes)


def detect_markers_with_annotation(image_bytes: bytes) -> Tuple[Dict[str, Any], Optional[np.ndarray]]:
    """
    Detect markers and return both results and annotated image
    
    Args:
        image_bytes: Image data as bytes
        
    Returns:
        Tuple of (detection_results, annotated_image)
    """
    try:
        # Convert bytes to image
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return {"error": "Could not decode image"}, None
        
        # Detect markers
        results = detector.detect_markers_from_image(image)
        
        # Create annotated image
        annotated_image = detector.create_annotated_image(image, results)
        
        return results, annotated_image
        
    except Exception as e:
        logger.error(f"Error in detect_markers_with_annotation: {e}")
        return {"error": str(e)}, None
