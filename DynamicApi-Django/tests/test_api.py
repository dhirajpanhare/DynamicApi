"""
Tests for Dynamic API application.
"""
from django.test import TestCase
from django.test.client import Client
from rest_framework import status
from json import dumps


class HealthCheckTestCase(TestCase):
    """Test cases for health check endpoint"""
    
    def setUp(self):
        self.client = Client()
    
    def test_health_check_get(self):
        """Test health check with GET request"""
        response = self.client.get('/api/v1.0/DynamicApi/Health')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()['status'])
        self.assertEqual(response.json()['message'], 'Dynamic API is operational')
    
    def test_health_check_post(self):
        """Test health check with POST request"""
        response = self.client.post('/api/v1.0/DynamicApi/Health')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.json()['status'])


class ExecuteStoredProcedureTestCase(TestCase):
    """Test cases for stored procedure execution"""
    
    def setUp(self):
        self.client = Client()
    
    def test_valid_request_format(self):
        """Test valid request format"""
        payload = {
            'stringOne': 'p_Id=1|p_Name=Test',
            'stringTwo': '|',
            'stringThree': '=',
            'stringFour': 'TestProcedure'
        }
        response = self.client.post(
            '/api/v1.0/DynamicApi/DynamicApiExecute',
            data=dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_missing_required_fields(self):
        """Test missing required fields"""
        payload = {
            'stringOne': 'p_Id=1',
            'stringTwo': '|'
        }
        response = self.client.post(
            '/api/v1.0/DynamicApi/DynamicApiExecute',
            data=dumps(payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.json()['status'])
