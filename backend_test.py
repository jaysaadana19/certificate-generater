#!/usr/bin/env python3

import requests
import sys
import os
from datetime import datetime
import json

class CertificateGeneratorAPITester:
    def __init__(self, base_url="https://credential-forge.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_event_id = None
        
    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                data = response.json()
                details += f", Message: {data.get('message', 'No message')}"
            self.log_test("API Root", success, details)
            return success
        except Exception as e:
            self.log_test("API Root", False, str(e))
            return False
    
    def test_get_events_empty(self):
        """Test getting events when none exist"""
        try:
            response = requests.get(f"{self.api_url}/events")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                events = response.json()
                details += f", Events count: {len(events)}"
            self.log_test("Get Events (Empty)", success, details)
            return success
        except Exception as e:
            self.log_test("Get Events (Empty)", False, str(e))
            return False
    
    def test_create_event(self):
        """Test creating an event with template upload"""
        try:
            # Prepare form data
            template_path = "/app/backend/static/templates/sample_certificate.png"
            
            if not os.path.exists(template_path):
                self.log_test("Create Event", False, "Sample template not found")
                return False
            
            with open(template_path, 'rb') as template_file:
                files = {
                    'template': ('sample_certificate.png', template_file, 'image/png')
                }
                data = {
                    'name': 'Test Conference 2025',
                    'text_position_x': 400,
                    'text_position_y': 300,
                    'font_size': 60,
                    'font_color': '#000000'
                }
                
                response = requests.post(f"{self.api_url}/events", files=files, data=data)
                success = response.status_code == 200
                details = f"Status: {response.status_code}"
                
                if success:
                    event_data = response.json()
                    self.created_event_id = event_data.get('id')
                    details += f", Event ID: {self.created_event_id}"
                else:
                    try:
                        error_data = response.json()
                        details += f", Error: {error_data}"
                    except:
                        details += f", Response: {response.text[:200]}"
                
                self.log_test("Create Event", success, details)
                return success
                
        except Exception as e:
            self.log_test("Create Event", False, str(e))
            return False
    
    def test_get_specific_event(self):
        """Test getting a specific event"""
        if not self.created_event_id:
            self.log_test("Get Specific Event", False, "No event ID available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/events/{self.created_event_id}")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                event = response.json()
                details += f", Event name: {event.get('name', 'Unknown')}"
            
            self.log_test("Get Specific Event", success, details)
            return success
        except Exception as e:
            self.log_test("Get Specific Event", False, str(e))
            return False
    
    def test_generate_certificates(self):
        """Test generating certificates from CSV"""
        if not self.created_event_id:
            self.log_test("Generate Certificates", False, "No event ID available")
            return False
            
        try:
            csv_path = "/tmp/sample_recipients.csv"
            
            if not os.path.exists(csv_path):
                self.log_test("Generate Certificates", False, "Sample CSV not found")
                return False
            
            with open(csv_path, 'rb') as csv_file:
                files = {
                    'csv_file': ('sample_recipients.csv', csv_file, 'text/csv')
                }
                
                response = requests.post(
                    f"{self.api_url}/events/{self.created_event_id}/generate",
                    files=files
                )
                success = response.status_code == 200
                details = f"Status: {response.status_code}"
                
                if success:
                    result = response.json()
                    details += f", Generated: {result.get('generated', 0)}, Errors: {len(result.get('errors', []))}"
                else:
                    try:
                        error_data = response.json()
                        details += f", Error: {error_data}"
                    except:
                        details += f", Response: {response.text[:200]}"
                
                self.log_test("Generate Certificates", success, details)
                return success
                
        except Exception as e:
            self.log_test("Generate Certificates", False, str(e))
            return False
    
    def test_get_event_certificates(self):
        """Test getting certificates for an event"""
        if not self.created_event_id:
            self.log_test("Get Event Certificates", False, "No event ID available")
            return False
            
        try:
            response = requests.get(f"{self.api_url}/events/{self.created_event_id}/certificates")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                certificates = response.json()
                details += f", Certificates count: {len(certificates)}"
            
            self.log_test("Get Event Certificates", success, details)
            return success
        except Exception as e:
            self.log_test("Get Event Certificates", False, str(e))
            return False
    
    def test_download_certificate(self):
        """Test downloading a certificate"""
        try:
            # Try to download John Doe's certificate
            data = {
                "name": "John Doe",
                "email": "john.doe@example.com"
            }
            
            response = requests.post(
                f"{self.api_url}/certificates/download",
                json=data
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            if success:
                # Check if it's actually a file
                content_type = response.headers.get('content-type', '')
                details += f", Content-Type: {content_type}"
                if 'image' in content_type:
                    details += f", File size: {len(response.content)} bytes"
            else:
                try:
                    error_data = response.json()
                    details += f", Error: {error_data}"
                except:
                    details += f", Response: {response.text[:200]}"
            
            self.log_test("Download Certificate", success, details)
            return success
        except Exception as e:
            self.log_test("Download Certificate", False, str(e))
            return False
    
    def test_invalid_event_id(self):
        """Test accessing non-existent event"""
        try:
            response = requests.get(f"{self.api_url}/events/invalid-id")
            success = response.status_code == 404
            details = f"Status: {response.status_code} (Expected 404)"
            self.log_test("Invalid Event ID", success, details)
            return success
        except Exception as e:
            self.log_test("Invalid Event ID", False, str(e))
            return False
    
    def test_invalid_certificate_download(self):
        """Test downloading non-existent certificate"""
        try:
            data = {
                "name": "Non Existent",
                "email": "nonexistent@example.com"
            }
            
            response = requests.post(
                f"{self.api_url}/certificates/download",
                json=data
            )
            success = response.status_code == 404
            details = f"Status: {response.status_code} (Expected 404)"
            self.log_test("Invalid Certificate Download", success, details)
            return success
        except Exception as e:
            self.log_test("Invalid Certificate Download", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Certificate Generator API Tests")
        print(f"📍 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Basic connectivity tests
        if not self.test_api_root():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Core functionality tests
        self.test_get_events_empty()
        
        if self.test_create_event():
            self.test_get_specific_event()
            if self.test_generate_certificates():
                self.test_get_event_certificates()
                self.test_download_certificate()
        
        # Error handling tests
        self.test_invalid_event_id()
        self.test_invalid_certificate_download()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    """Main test execution"""
    tester = CertificateGeneratorAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())