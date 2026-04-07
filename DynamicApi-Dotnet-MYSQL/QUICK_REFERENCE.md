# Dynamic Transaction API - Quick Reference

## Endpoint
```
POST /api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute
```

## Minimal Request
```json
{
  "stringFour": "StoredProcedureName"
}
```

## Full Request
```json
{
  "stringOne": "p_Param1=Value1|p_Param2=Value2",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "StoredProcedureName",
  "intOne": 123,
  "intTwo": 456,
  "intThree": 789,
  "intFour": 101,
  "intFive": 102,
  "intSix": 103,
  "intSeven": 104,
  "dateOne": "2026-04-01",
  "dateTwo": "2026-04-30",
  "pkId": 1
}
```

## Response
```json
{
  "status": true,
  "message": "Transaction completed successfully",
  "data": [...],
  "transactionId": 42,
  "executionTimeMs": 125
}
```

## Common Patterns

### Insert with Auto-ID
```json
{
  "stringOne": "p_Name=Product|p_Price=99.99",
  "stringFour": "Product_Insert"
}
```
→ Returns `transactionId` with generated ID

### Get by ID
```json
{
  "stringOne": "p_Id=42",
  "stringFour": "Product_GetById"
}
```

### Update
```json
{
  "stringOne": "p_Id=42|p_Status=2",
  "stringFour": "Product_Update"
}
```

### Delete
```json
{
  "stringOne": "p_Id=42",
  "stringFour": "Product_Delete"
}
```

### Search with Dates
```json
{
  "stringOne": "p_Status=1",
  "stringFour": "Product_Search",
  "dateOne": "2026-01-01",
  "dateTwo": "2026-03-31"
}
```

### Using Integer Params
```json
{
  "stringFour": "Product_GetByCategory",
  "intOne": 5,
  "intTwo": 10
}
```

## Quick Test (curl)
```bash
# Health check
curl http://localhost:5000/api/v1.0/DynamicTransactionApi/health

# Execute
curl -X POST http://localhost:5000/api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute \
  -H "Content-Type: application/json" \
  -d '{"stringFour":"YourProcedureName"}'
```

## Status Codes
- `200` - Success (transaction committed)
- `400` - Bad request or business error
- `500` - Server error (transaction rolled back)

## Key Features
- ✅ Automatic transaction commit/rollback
- ✅ Output parameter support
- ✅ Execution logging
- ✅ Parameter validation
- ✅ SQL injection prevention

## When to Use
✅ Header + detail inserts  
✅ Multi-step operations  
✅ Operations needing rollback  
✅ Auto-generated IDs  

❌ Simple SELECT queries (use regular Dynamic API)

## Files
- Guide: `DYNAMIC_TRANSACTION_API_GUIDE.md`
- Examples: `DynamicTransactionApi.http`
- Summary: `IMPLEMENTATION_SUMMARY.md`
