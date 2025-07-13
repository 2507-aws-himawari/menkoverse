"""
Test script to verify the ArUco marker detection API
"""

import requests
import json
import os
from pathlib import Path

# API endpoint
API_BASE_URL = "http://localhost:8000"  # Change this if running on different host/port


def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        response.raise_for_status()
        print("✅ Health check passed")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False


def test_root_endpoint():
    """Test the root endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}/")
        response.raise_for_status()
        print("✅ Root endpoint test passed")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Root endpoint test failed: {e}")
        return False


def test_marker_detection(image_path: str):
    """Test marker detection endpoint"""
    if not os.path.exists(image_path):
        print(f"❌ Test image not found: {image_path}")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': ('test_image.png', f, 'image/png')}
            response = requests.post(f"{API_BASE_URL}/detect-markers", files=files)
        
        response.raise_for_status()
        result = response.json()
        
        print("✅ Marker detection test passed")
        print(f"Total markers found: {result.get('total_markers', 0)}")
        
        if result.get('detected_markers'):
            print("Detected markers:")
            for i, marker in enumerate(result['detected_markers']):
                print(f"  Marker {i+1}: ID={marker['id']}, Confidence={marker['confidence']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Marker detection test failed: {e}")
        return False


def test_annotated_detection(image_path: str, output_path: str = "annotated_result.png"):
    """Test annotated marker detection endpoint"""
    if not os.path.exists(image_path):
        print(f"❌ Test image not found: {image_path}")
        return False
    
    try:
        with open(image_path, 'rb') as f:
            files = {'file': ('test_image.png', f, 'image/png')}
            response = requests.post(f"{API_BASE_URL}/detect-markers-annotated", files=files)
        
        response.raise_for_status()
        
        # Save annotated image
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        print("✅ Annotated detection test passed")
        print(f"Annotated image saved to: {output_path}")
        
        # Check headers for marker count
        markers_count = response.headers.get('X-Detected-Markers', 'unknown')
        print(f"Detected markers: {markers_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Annotated detection test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("🧪 Testing ArUco Marker Detection API\n")
    
    # Test basic endpoints
    test_root_endpoint()
    print()
    test_health_check()
    print()
    
    # Look for test images
    test_images = []
    
    # Check for generated marker image
    if os.path.exists("markers_0_to_5.png"):
        test_images.append("markers_0_to_5.png")
    
    # Check for other common image files
    for ext in [".png", ".jpg", ".jpeg"]:
        for file in Path(".").glob(f"*{ext}"):
            if file.name not in test_images:
                test_images.append(str(file))
    
    if not test_images:
        print("❌ No test images found. Please place an image file in the current directory.")
        print("💡 You can generate test markers by running: python generate-marker.py")
        return
    
    # Test with available images
    for image_path in test_images[:3]:  # Test with first 3 images max
        print(f"🖼️  Testing with image: {image_path}")
        test_marker_detection(image_path)
        print()
        test_annotated_detection(image_path, f"annotated_{os.path.basename(image_path)}")
        print()


if __name__ == "__main__":
    main()
