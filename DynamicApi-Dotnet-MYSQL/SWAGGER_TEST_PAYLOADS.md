# Swagger Test Payloads - Batch and Lot Insert

## Prerequisites

1. Run the SQL scripts to create the stored procedures:
   - `SQL/Order_Test_BatchAndLot_Insert.sql`
   - `SQL/Order_Test_BatchWithMultipleLots_Insert.sql`

2. Navigate to Swagger UI: `http://localhost:5000/swagger`

3. Find: `DynamicTransactionApi` → `POST /api/v1.0/DynamicTransactionApi/DynamicTransactionApiExecute`

4. Click "Try it out"

---

## Option 1: Insert Batch + Single Lot (Recommended)

### Stored Procedure: `Order_Test_BatchAndLot_Insert`

**Copy this payload into Swagger:**

```json
{
  "stringOne": "p_BatchName=Batch-2026-001|p_TotalItems=100|p_BatchStatus=1|p_ItemCount=50|p_LotDate=2026-04-01|p_LotStatus=1",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "Order_Test_BatchAndLot_Insert",
  "intOne": 0,
  "intTwo": 0,
  "intThree": 0,
  "intFour": 0,
  "intFive": 0,
  "intSix": 0,
  "intSeven": 0,
  "dateOne": "2026-04-01T10:39:16.916Z",
  "dateTwo": "2026-04-01T10:39:16.916Z",
  "pkId": 0
}
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Transaction completed successfully",
  "data": [
    {
      "BatchId": 1,
      "LotId": 1
    }
  ],
  "transactionId": 1,
  "executionTimeMs": 95
}
```

---

## Option 2: Insert Batch + Multiple Lots (JSON Array)

### Stored Procedure: `Order_Test_BatchWithMultipleLots_Insert`

**Copy this payload into Swagger:**

```json
{
  "stringOne": "p_BatchName=Batch-2026-002|p_TotalItems=300|p_BatchStatus=1|p_LotsJson=[{\"ItemCount\":100,\"LotDate\":\"2026-04-01\",\"Status\":1},{\"ItemCount\":120,\"LotDate\":\"2026-04-02\",\"Status\":1},{\"ItemCount\":80,\"LotDate\":\"2026-04-03\",\"Status\":1}]",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "Order_Test_BatchWithMultipleLots_Insert",
  "intOne": 0,
  "intTwo": 0,
  "intThree": 0,
  "intFour": 0,
  "intFive": 0,
  "intSix": 0,
  "intSeven": 0,
  "dateOne": "2026-04-01T10:39:16.916Z",
  "dateTwo": "2026-04-01T10:39:16.916Z",
  "pkId": 0
}
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Transaction completed successfully",
  "data": [
    {
      "BatchId": 2,
      "LotsInserted": 3
    }
  ],
  "transactionId": 2,
  "executionTimeMs": 145
}
```

---

## More Examples

### Example 1: Batch + Lot with Integer Parameters

```json
{
  "stringOne": "p_BatchName=IntParam-Batch|p_BatchStatus=1|p_LotStatus=1",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "Order_Test_BatchAndLot_Insert",
  "intOne": 200,
  "intTwo": 75,
  "intThree": 0,
  "intFour": 0,
  "intFive": 0,
  "intSix": 0,
  "intSeven": 0,
  "dateOne": "2026-04-05T10:39:16.916Z",
  "dateTwo": "2026-04-01T10:39:16.916Z",
  "pkId": 0
}
```

**Note:** 
- `intOne` = p_TotalItems (200)
- `intTwo` = p_ItemCount (75)
- `dateOne` = p_LotDate

---

### Example 2: Batch + Multiple Lots (5 lots)

```json
{
  "stringOne": "p_BatchName=Multi-Lot-Batch|p_TotalItems=500|p_BatchStatus=1|p_LotsJson=[{\"ItemCount\":100,\"LotDate\":\"2026-04-01\",\"Status\":1},{\"ItemCount\":100,\"LotDate\":\"2026-04-02\",\"Status\":1},{\"ItemCount\":100,\"LotDate\":\"2026-04-03\",\"Status\":1},{\"ItemCount\":100,\"LotDate\":\"2026-04-04\",\"Status\":1},{\"ItemCount\":100,\"LotDate\":\"2026-04-05\",\"Status\":1}]",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "Order_Test_BatchWithMultipleLots_Insert",
  "intOne": 0,
  "intTwo": 0,
  "intThree": 0,
  "intFour": 0,
  "intFive": 0,
  "intSix": 0,
  "intSeven": 0,
  "dateOne": "2026-04-01T10:39:16.916Z",
  "dateTwo": "2026-04-01T10:39:16.916Z",
  "pkId": 0
}
```

---

### Example 3: Batch + Lot with Date Range

```json
{
  "stringOne": "p_BatchName=DateRange-Batch|p_TotalItems=150|p_BatchStatus=1|p_ItemCount=150|p_LotStatus=1",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "Order_Test_BatchAndLot_Insert",
  "intOne": 0,
  "intTwo": 0,
  "intThree": 0,
  "intFour": 0,
  "intFive": 0,
  "intSix": 0,
  "intSeven": 0,
  "dateOne": "2026-04-01T00:00:00.000Z",
  "dateTwo": "2026-04-30T23:59:59.999Z",
  "pkId": 0
}
```

**Note:** 
- `dateOne` = p_LotDate (start date)
- `dateTwo` = can be used for end date if needed

---

### Example 4: Batch + Lot - All Parameters

```json
{
  "stringOne": "p_BatchName=Complete-Batch|p_TotalItems=250|p_BatchStatus=1|p_ItemCount=125|p_LotDate=2026-04-10|p_LotStatus=1",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "Order_Test_BatchAndLot_Insert",
  "intOne": 250,
  "intTwo": 125,
  "intThree": 1,
  "intFour": 1,
  "intFive": 0,
  "intSix": 0,
  "intSeven": 0,
  "dateOne": "2026-04-10T10:39:16.916Z",
  "dateTwo": "2026-04-10T10:39:16.916Z",
  "pkId": 0
}
```

---

## Testing Steps

### Step 1: Create the Stored Procedure

Run this SQL in your MySQL database:

```sql
DELIMITER $$

CREATE PROCEDURE `Order_Test_BatchAndLot_Insert`(
    IN p_BatchName VARCHAR(100),
    IN p_TotalItems INT,
    IN p_BatchStatus TINYINT,
    IN p_ItemCount INT,
    IN p_LotDate DATE,
    IN p_LotStatus TINYINT,
    OUT p_BatchId INT,
    OUT p_LotId INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;
    
    INSERT INTO Order_Test_Batch (BatchName, TotalItems, Status)
    VALUES (p_BatchName, p_TotalItems, p_BatchStatus);
    
    SET p_BatchId = LAST_INSERT_ID();
    
    INSERT INTO Order_Test_Lot (BatchId, ItemCount, LotDate, Status)
    VALUES (p_BatchId, p_ItemCount, p_LotDate, p_LotStatus);
    
    SET p_LotId = LAST_INSERT_ID();
    
    COMMIT;
    
    SELECT p_BatchId AS BatchId, p_LotId AS LotId;
END$$

DELIMITER ;
```

### Step 2: Test in Swagger

1. Go to: `http://localhost:5000/swagger`
2. Find: `DynamicTransactionApi` → `DynamicTransactionApiExecute`
3. Click: "Try it out"
4. Paste this payload:

```json
{
  "stringOne": "p_BatchName=Test-Batch-001|p_TotalItems=100|p_BatchStatus=1|p_ItemCount=50|p_LotDate=2026-04-01|p_LotStatus=1",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "Order_Test_BatchAndLot_Insert",
  "intOne": 0,
  "intTwo": 0,
  "intThree": 0,
  "intFour": 0,
  "intFive": 0,
  "intSix": 0,
  "intSeven": 0,
  "dateOne": "2026-04-01T10:39:16.916Z",
  "dateTwo": "2026-04-01T10:39:16.916Z",
  "pkId": 0
}
```

5. Click: "Execute"

### Step 3: Verify Response

You should get:

```json
{
  "status": true,
  "message": "Transaction completed successfully",
  "data": [
    {
      "BatchId": 1,
      "LotId": 1
    }
  ],
  "transactionId": 1,
  "executionTimeMs": 95
}
```

---

## Alternative: Using Integer and Date Parameters

If you want to use the integer and date fields instead of stringOne:

```json
{
  "stringOne": "p_BatchName=IntDate-Batch|p_BatchStatus=1|p_LotStatus=1",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "Order_Test_BatchAndLot_Insert",
  "intOne": 200,
  "intTwo": 100,
  "intThree": 0,
  "intFour": 0,
  "intFive": 0,
  "intSix": 0,
  "intSeven": 0,
  "dateOne": "2026-04-05T10:39:16.916Z",
  "dateTwo": "2026-04-01T10:39:16.916Z",
  "pkId": 0
}
```

**Mapping:**
- `intOne` → p_TotalItems (200)
- `intTwo` → p_ItemCount (100)
- `dateOne` → p_LotDate

---

## Error Testing

### Test Rollback - Invalid Date Format

```json
{
  "stringOne": "p_BatchName=Error-Test|p_TotalItems=100|p_BatchStatus=1|p_ItemCount=50|p_LotDate=invalid-date|p_LotStatus=1",
  "stringTwo": "|",
  "stringThree": "=",
  "stringFour": "Order_Test_BatchAndLot_Insert",
  "intOne": 0,
  "intTwo": 0,
  "intThree": 0,
  "intFour": 0,
  "intFive": 0,
  "intSix": 0,
  "intSeven": 0,
  "dateOne": "2026-04-01T10:39:16.916Z",
  "dateTwo": "2026-04-01T10:39:16.916Z",
  "pkId": 0
}
```

**Expected:** Transaction rolls back, no batch or lot inserted

---

## Summary

**To insert batch and lot together:**

1. Create the `Order_Test_BatchAndLot_Insert` stored procedure (see SQL file)
2. Use the payload above in Swagger
3. Both batch and lot are inserted in ONE atomic transaction
4. If either fails, both are rolled back
5. Response includes both BatchId and LotId

**Key Benefits:**
- ✅ Atomic operation (all or nothing)
- ✅ Single API call
- ✅ Automatic rollback on error
- ✅ Returns both generated IDs
- ✅ No code changes needed in .NET
