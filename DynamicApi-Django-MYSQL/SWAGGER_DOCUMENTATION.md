# Dynamic API - Swagger Documentation & Testing Guide

## Overview

The Dynamic API includes **interactive Swagger/OpenAPI documentation** for easy API testing and integration. This guide shows you how to access and use the documentation.

## Access Documentation

After starting the Django development server (`python manage.py runserver`), access the documentation at:

### Swagger UI (Recommended)
- **URL**: `http://localhost:8000/api/docs/swagger/`
- **Features**: Interactive testing, request/response examples, parameter validation
- **Best for**: Developers and API testing

### ReDoc (Alternative)
- **URL**: `http://localhost:8000/api/docs/redoc/`
- **Features**: Clean, responsive documentation, searchable
- **Best for**: Reading documentation and learning the API

### OpenAPI Schema (Raw)
- **URL**: `http://localhost:8000/api/schema/`
- **Format**: JSON OpenAPI 3.0 specification
- **Best for**: Code generation and integrations

## Swagger UI - Interactive Testing

### Step 1: Navigate to Swagger UI

Open your browser and go to: `http://localhost:8000/api/docs/swagger/`

You should see:
- API title: **Dynamic API**
- Version: **1.0.0**
- Two endpoint categories:
  - **Health & Status** - Health check endpoint
  - **Procedure Execution** - Stored procedure execution

### Step 2: Test Health Check Endpoint

1. Click on **GET /api/v1.0/DynamicApi/Health**
2. Click the **Try it out** button
3. Click **Execute**
4. View the response:
   ```json
   {
     "status": true,
     "message": "Dynamic API is operational",
     "data": {
       "timestamp": "2026-03-26T10:30:45.123Z"
     }
   }
   ```

### Step 3: Test Stored Procedure Execution

1. Click on **POST /api/v1.0/DynamicApi/DynamicApiExecute**
2. Click **Try it out**
3. Update the request body with your stored procedure details:

   ```json
   {
     "stringOne": "p_ContactId=5|p_Status=Active",
     "stringTwo": "|",
     "stringThree": "=",
     "stringFour": "SP_GetContactData"
   }
   ```

4. Click **Execute**
5. View the response with your data

### Parameter Explanation

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `stringOne` | Yes | Delimited parameters | `p_Id=5\|p_Name=Test` |
| `stringTwo` | Yes | Parameter separator | `\|` |
| `stringThree` | Yes | Key-value separator | `=` |
| `stringFour` | Yes | Stored procedure name | `SP_GetContactData` |

## Example Requests

### Example 1: Simple Query

**Request:**
```json
{
  "stringOne": "p_ContactId=5",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "SP_GetContact"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Success",
  "data": [
    {
      "ContactId": 5,
      "ContactName": "John Doe",
      "Email": "john@example.com"
    }
  ]
}
```

### Example 2: Multiple Parameters

**Request:**
```json
{
  "stringOne": "p_StartDate=2026-01-01|p_EndDate=2026-03-26|p_Status=Active|p_Limit=100",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "SP_GetActiveContactsByDateRange"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Success",
  "data": [
    {
      "ContactId": 1,
      "ContactName": "Alice Smith",
      "Status": "Active",
      "CreatedDate": "2026-01-15"
    },
    {
      "ContactId": 5,
      "ContactName": "John Doe",
      "Status": "Active",
      "CreatedDate": "2026-02-20"
    }
  ]
}
```

### Example 3: Custom Delimiters

**Request:**
```json
{
  "stringOne": "p_Id:10;p_Type:Premium",
  "stringTwo": ";",
  "stringThree": ":",
  "stringFour": "SP_GetPremiumContacts"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Success",
  "data": [
    {
      "ContactId": 10,
      "Plan": "Premium",
      "ExpiryDate": "2026-12-31"
    }
  ]
}
```

### Example 4: Error Response

**Request:**
```json
{
  "stringOne": "p_Id=999",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "SP_NonExistentProcedure"
}
```

**Response:**
```json
{
  "status": false,
  "message": "Procedure not found or invalid: SP_NonExistentProcedure",
  "data": null
}
```

## Copy as cURL from Swagger

You can easily copy API calls as cURL commands from Swagger:

1. Click on an endpoint
2. Click **Try it out**
3. Scroll down and click **Copy**
4. Paste in terminal:

```bash
curl -X POST "http://localhost:8000/api/v1.0/DynamicApi/DynamicApiExecute" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{
    "stringOne":"p_ContactId=5|p_Status=Active",
    "stringTwo":"|",
    "stringThree":"=",
    "stringFour":"SP_GetContactData"
  }'
```

## API Schema Download

Export the OpenAPI schema for code generation:

1. Visit: `http://localhost:8000/api/schema/`
2. Save the JSON response as `openapi.json`
3. Use with code generators:
   ```bash
   # Generate Python client
   npx @openapitools/openapi-generator-cli generate -i openapi.json -g python -o ./python-client
   
   # Generate JavaScript client
   npx @openapitools/openapi-generator-cli generate -i openapi.json -g javascript -o ./js-client
   
   # Generate C# client
   npx @openapitools/openapi-generator-cli generate -i openapi.json -g csharp -o ./csharp-client
   ```

## Postman Integration

### Import OpenAPI Schema to Postman

1. Open Postman
2. Click **Import**
3. Select **Link** tab
4. Paste: `http://localhost:8000/api/schema/`
5. Click **Continue** then **Import**

Postman will create a collection with pre-configured endpoints and parameters.

### Manual Setup in Postman

If auto-import doesn't work:

1. **Create Collection**: "Dynamic API"
2. **Create Request**: "Execute Procedure"
   - Method: POST
   - URL: `http://localhost:8000/api/v1.0/DynamicApi/DynamicApiExecute`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "stringOne": "p_ContactId=5|p_Status=Active",
       "stringTwo": "|",
       "stringThree": "=",
       "stringFour": "SP_GetContactData"
     }
     ```

3. **Create Request**: "Health Check"
   - Method: GET
   - URL: `http://localhost:8000/api/v1.0/DynamicApi/Health`

## Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Data returned successfully |
| 400 | Bad Request | Invalid parameters or missing procedure |
| 500 | Server Error | Database connection failed |

## Customization

### Update Documentation Metadata

Edit **`dynamic_api_project/settings.py`** in the `SPECTACULAR_SETTINGS`:

```python
SPECTACULAR_SETTINGS = {
    'TITLE': 'Your API Title',
    'DESCRIPTION': 'Your API description',
    'VERSION': '1.0.0',
    'CONTACT': {
        'name': 'Your Name',
        'email': 'your.email@example.com',
    },
    'SERVERS': [
        {
            'url': 'http://localhost:8000',
            'description': 'Development server',
        },
        {
            'url': 'https://api.yourdomain.com',
            'description': 'Production server',
        },
    ],
}
```

### Custom Endpoint Documentation

Endpoints are documented using decorators. Example from views.py:

```python
@extend_schema(
    operation_id='execute_stored_procedure',
    summary='Execute Stored Procedure',
    description='Execute any stored procedure with string-delimited parameters',
    request=DynamicApiRequestSerializer,
    responses={200: {...}, 400: {...}},
    tags=['Procedure Execution'],
    methods=['POST'],
)
@api_view(['POST'])
def execute_stored_procedure(request):
    ...
```

## Testing Different Scenarios

### Test 1: Valid Procedure with Parameters

```json
{
  "stringOne": "p_Status=Active|p_Limit=10",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "SP_GetActiveItems"
}
```

### Test 2: Procedure with No Parameters

```json
{
  "stringOne": "",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "SP_GetAllItems"
}
```

### Test 3: Invalid Procedure Name

```json
{
  "stringOne": "p_Id=1",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "SP_InvalidName"
}
```

Expected error:
```json
{
  "status": false,
  "message": "Procedure not found or invalid: SP_InvalidName",
  "data": null
}
```

### Test 4: Malformed Parameters

```json
{
  "stringOne": "p_Id|p_Name=Test",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "SP_GetData"
}
```

Expected error:
```json
{
  "status": false,
  "message": "Invalid parameters: Invalid parameter format: p_Id",
  "data": null
}
```

## Common Issues

### Swagger UI not loading

1. **Ensure dependencies installed:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Restart server:**
   ```bash
   python manage.py runserver
   ```

3. **Clear browser cache:**
   - Ctrl+Shift+Delete (Chrome)
   - Cmd+Shift+Delete (Mac)

### Endpoint not showing in Swagger

1. Verify endpoint is in `urls.py`
2. Check `@api_view` decorator is present
3. Ensure `@extend_schema` decorator is used (optional but recommended)
4. Check for syntax errors in views.py

### Schema endpoint returns 404

Ensure `drf_spectacular` is installed:
```bash
pip install drf-spectacular
```

## Best Practices

### 1. Parameter Naming
```
✓ USE: p_ContactId, p_Status, p_StartDate
✗ AVOID: contact_id, status, startDate
```

### 2. Delimiter Choice
```
✓ USE: | for separator, = for key-value
✗ AVOID: Special characters and spaces
```

### 3. Error Handling
- Check response `status` field first
- Use `message` field for user-facing errors
- Log `data` field for debugging

### 4. Testing Workflow
1. Start with Health check
2. Test with simple parameters
3. Add more complex parameters
4. Test error scenarios
5. Verify data format

## Integration Examples

### Python Requests
```python
import requests

response = requests.post(
    'http://localhost:8000/api/v1.0/DynamicApi/DynamicApiExecute',
    json={
        'stringOne': 'p_Id=5|p_Status=Active',
        'stringTwo': '|',
        'stringThree': '=',
        'stringFour': 'SP_GetData'
    }
)

if response.json()['status']:
    print(response.json()['data'])
```

### JavaScript Fetch
```javascript
const response = await fetch(
    'http://localhost:8000/api/v1.0/DynamicApi/DynamicApiExecute',
    {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            stringOne: 'p_Id=5|p_Status=Active',
            stringTwo: '|',
            stringThree: '=',
            stringFour: 'SP_GetData'
        })
    }
);

const data = await response.json();
```

### cURL
```bash
curl -X POST http://localhost:8000/api/v1.0/DynamicApi/DynamicApiExecute \
  -H "Content-Type: application/json" \
  -d '{"stringOne":"p_Id=5","stringTwo":"|","stringThree":"=","stringFour":"SP_GetData"}'
```

## Documentation URLs Reference

| Purpose | URL |
|---------|-----|
| Swagger UI | http://localhost:8000/api/docs/swagger/ |
| ReDoc | http://localhost:8000/api/docs/redoc/ |
| OpenAPI Schema | http://localhost:8000/api/schema/ |
| Health Check | http://localhost:8000/api/v1.0/DynamicApi/Health |
| Execute Procedure | http://localhost:8000/api/v1.0/DynamicApi/DynamicApiExecute |

## Next Steps

1. **Try the endpoints** in Swagger UI
2. **Copy cURL commands** for scripting
3. **Import to Postman** for advanced testing
4. **Generate client code** from OpenAPI schema
5. **Integrate with your application** using provided examples

---

**Documentation automatically maintained** - Endpoint documentation stays in sync with code!
