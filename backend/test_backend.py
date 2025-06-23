#!/usr/bin/env python3
"""
Test script for the backend file converter
"""
import requests
import time
import os

# Backend URL
BACKEND_URL = "http://localhost:8000"

def test_backend():
    print("🧪 Testing Backend File Converter")
    print("=" * 50)
    
    # Test 1: Check if backend is running
    try:
        response = requests.get(f"{BACKEND_URL}/docs")
        print("✅ Backend is running")
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running. Please start it first:")
        print("   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        return False
    
    # Test 2: Create a test file
    test_content = "This is a test document for conversion."
    test_file_path = "test_document.txt"
    
    with open(test_file_path, "w") as f:
        f.write(test_content)
    
    print(f"✅ Created test file: {test_file_path}")
    
    # Test 3: Upload file
    try:
        with open(test_file_path, "rb") as f:
            files = {"file": ("test_document.txt", f, "text/plain")}
            data = {"output_format": "pdf"}
            
            response = requests.post(f"{BACKEND_URL}/upload", files=files, data=data)
            
        if response.status_code == 200:
            result = response.json()
            task_id = result.get("task_id")
            print(f"✅ File uploaded successfully. Task ID: {task_id}")
            
            # Test 4: Check status
            print("⏳ Checking conversion status...")
            max_attempts = 30
            attempts = 0
            
            while attempts < max_attempts:
                time.sleep(2)  # Wait 2 seconds between checks
                attempts += 1
                
                status_response = requests.get(f"{BACKEND_URL}/status/{task_id}")
                
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    
                    if status_data.get("status") == "completed":
                        download_url = status_data.get("download_url")
                        print(f"✅ Conversion completed! Download URL: {download_url}")
                        
                        # Test 5: Test download URL
                        if download_url:
                            try:
                                download_response = requests.head(download_url)
                                if download_response.status_code == 200:
                                    print("✅ Download URL is accessible")
                                else:
                                    print(f"⚠️  Download URL returned status: {download_response.status_code}")
                            except Exception as e:
                                print(f"❌ Download URL test failed: {e}")
                        break
                        
                    elif status_data.get("status") == "error":
                        error_msg = status_data.get("error", "Unknown error")
                        print(f"❌ Conversion failed: {error_msg}")
                        break
                        
                    elif status_data.get("status") == "processing":
                        print(f"⏳ Still processing... (attempt {attempts}/{max_attempts})")
                    else:
                        print(f"⚠️  Unknown status: {status_data}")
                        
                else:
                    print(f"❌ Status check failed: {status_response.status_code}")
                    break
            
            if attempts >= max_attempts:
                print("❌ Conversion timeout")
                
        else:
            print(f"❌ Upload failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
    
    # Cleanup
    if os.path.exists(test_file_path):
        os.remove(test_file_path)
        print(f"✅ Cleaned up test file: {test_file_path}")
    
    print("=" * 50)
    print("🏁 Test completed")

if __name__ == "__main__":
    test_backend() 