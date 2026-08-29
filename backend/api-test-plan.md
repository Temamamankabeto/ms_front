# AIG Cafe API Testing Plan

## Overview
Comprehensive testing plan covering all APIs from inventory creation to complete order flow with payment confirmation and stock alerts.

## Test Credentials (from seeder)
- **Admin**: admin@restaurant.local / password
- **Cashier**: cashier@restaurant.local / password  
- **Waiter**: waiter@restaurant.local / password

## Test Flow Sequence

### Phase 1: Setup & Authentication
### Phase 2: Inventory Management
### Phase 3: Menu & Recipe Creation
### Phase 4: Order Processing
### Phase 5: Payment & Billing
### Phase 6: Stock Alerts & Notifications
### Phase 7: Reports & Analytics

---

## Phase 1: Setup & Authentication

### 1.1 Start Laravel Server
```bash
php artisan serve
```

### 1.2 Test Authentication

#### Admin Login
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.local","password":"password"}'
```

#### Cashier Login
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cashier@restaurant.local","password":"password"}'
```

#### Waiter Login
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"waiter@restaurant.local","password":"password"}'
```

### 1.3 Store Tokens
Store the returned tokens for subsequent API calls.

---

## Phase 2: Inventory Management

### 2.1 Get Current Inventory
```bash
curl -X GET http://127.0.0.1:8000/api/admin/inventory/items \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 2.2 Create New Inventory Items
```bash
# Create Beef
curl -X POST http://127.0.0.1:8000/api/admin/inventory/items \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Beef",
    "unit": "kg",
    "current_stock": 50.000,
    "minimum_quantity": 10.000,
    "average_purchase_price": 600.00
  }'

# Create Vegetables
curl -X POST http://127.0.0.1:8000/api/admin/inventory/items \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fresh Vegetables",
    "unit": "kg",
    "current_stock": 30.000,
    "minimum_quantity": 5.000,
    "average_purchase_price": 25.50
  }'

# Create Cheese
curl -X POST http:// localhost:8000/api/admin/inventory/items \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Cheese",
    "unit": "kg",
    "current_stock": 15.000,
    "minimum_quantity": 3.000,
    "average_purchase_price": 450.00
  }'

# Create Buns
curl -X POST http://localhost:8000/api/admin/inventory/items \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Burger Buns",
    "unit": "pcs",
    "current_stock": 100,
    "minimum_quantity": 20,
    "average_purchase_price": 15.00
  }'

# Create Soft Drinks
curl -X POST http://localhost:8000/api/admin/inventory/items \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Soft Drinks",
    "unit": "ltr",
    "current_stock": 20.000,
    "minimum_quantity": 5.000,
    "average_purchase_price": 80.00
  }'
```

### 2.3 Test Low Stock Alert
```bash
curl -X GET http://localhost:8000/api/admin/inventory/low-stock \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 2.4 Update Inventory (Simulate Stock Usage)
```bash
curl -X PUT http://localhost:8000/api/admin/inventory/items/1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_stock": 8.000
  }'
```

### 2.5 Test Batch Stock Adjustment
```bash
curl -X POST http://localhost:8000/api/admin/inventory/batch-adjust \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "adjustments": [
      {
        "inventory_item_id": 1,
        "quantity": 10.000,
        "type": "increase",
        "note": "Stock received from supplier"
      },
      {
        "inventory_item_id": 2,
        "quantity": 5.000,
        "type": "decrease",
        "note": "Stock used in kitchen"
      }
    ]
  }'
```

---

## Phase 3: Menu & Recipe Creation

### 3.1 Get Menu Categories
```bash
curl -X GET http://localhost:8000/api/admin/menu/categories \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 3.2 Create Menu Categories (if needed)
```bash
curl -X POST http://localhost:8000/api/admin/menu/categories \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Burgers",
    "is_active": true
  }'

curl -X POST http://localhost:8000/api/admin/menu/categories \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Beverages",
    "is_active": true
  }'
```

### 3.3 Create Menu Items with Recipes

#### Create Classic Burger
```bash
curl -X POST http://localhost:8000/api/admin/menu/items/with-recipe \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "name": "Classic Burger",
    "description": "Juicy beef patty with fresh vegetables and cheese",
    "type": "food",
    "price": 180.50,
    "prep_minutes": 15,
    "is_available": true,
    "is_active": true,
    "ingredients": [
      {
        "inventory_item_id": 1,
        "quantity": 0.200
      },
      {
        "inventory_item_id": 2,
        "quantity": 0.100
      },
      {
        "inventory_item_id": 3,
        "quantity": 0.050
      },
      {
        "inventory_item_id": 4,
        "quantity": 2
      }
    ]
  }'
```

#### Create Deluxe Burger
```bash
curl -X POST http://localhost:8000/api/admin/menu/items/with-recipe \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "name": "Deluxe Burger",
    "description": "Double patty burger with premium cheese",
    "type": "food",
    "price": 250.00,
    "prep_minutes": 20,
    "is_available": true,
    "is_active": true,
    "ingredients": [
      {
        "inventory_item_id": 1,
        "quantity": 0.300
      },
      {
        "inventory_item_id": 3,
        "quantity": 0.100
      },
      {
        "inventory_item_id": 4,
        "quantity": 2
      }
    ]
  }'
```

#### Create Soft Drink
```bash
curl -X POST http://localhost:8000/api/admin/menu/items/with-recipe \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 2,
    "name": "Cola",
    "description": "Refreshing soft drink",
    "type": "drink",
    "price": 80.00,
    "prep_minutes": 2,
    "is_available": true,
    "is_active": true,
    "ingredients": [
      {
        "inventory_item_id": 5,
        "quantity": 0.250
      }
    ]
  }'
```

### 3.4 Test Menu Item Cost Analysis
```bash
curl -X GET http://localhost:8000/api/admin/menu/items/1/cost-analysis \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 3.5 Get All Menu Items
```bash
curl -X GET http://localhost:8000/api/admin/menu/items \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 3.6 Test Public Menu API
```bash
curl -X GET http://localhost:8000/api/public/menu
```

---

## Phase 4: Order Processing

### 4.1 Get Available Tables
```bash
curl -X GET http://localhost:8000/api/cashier/orders/tables \
  -H "Authorization: Bearer CASHIER_TOKEN"
```

### 4.2 Get Menu for POS
```bash
curl -X GET http://localhost:8000/api/cashier/orders/menu \
  -H "Authorization: Bearer CASHIER_TOKEN"
```

### 4.3 Create Order (Cashier)
```bash
curl -X POST http://localhost:8000/api/cashier/orders \
  -H "Authorization: Bearer CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 1,
    "customer_name": "John Doe",
    "customer_phone": "+1234567890",
    "order_type": "dine_in",
    "notes": "Extra ketchup",
    "items": [
      {
        "menu_item_id": 1,
        "quantity": 2,
        "notes": "No onions"
      },
      {
        "menu_item_id": 3,
        "quantity": 1
      }
    ]
  }'
```

### 4.4 Confirm Order
```bash
curl -X POST http://localhost:8000/api/cashier/orders/1/confirm \
  -H "Authorization: Bearer CASHIER_TOKEN"
```

### 4.5 Get Order Details
```bash
curl -X GET http://localhost:8000/api/cashier/orders/1 \
  -H "Authorization: Bearer CASHIER_TOKEN"
```

### 4.6 Process Order (Admin - Inventory Deduction)
```bash
curl -X POST http://localhost:8000/api/admin/orders/1/process \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 4.7 Check Inventory After Order Processing
```bash
curl -X GET http://localhost:8000/api/admin/inventory/items \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 4.8 Create Multiple Orders to Test Stock Depletion
```bash
# Order 2
curl -X POST http://localhost:8000/api/cashier/orders \
  -H "Authorization: Bearer CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 2,
    "customer_name": "Jane Smith",
    "order_type": "dine_in",
    "items": [
      {
        "menu_item_id": 2,
        "quantity": 3
      }
    ]
  }'

# Order 3
curl -X POST http://localhost:8000/api/cashier/orders \
  -H "Authorization: Bearer CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 3,
    "customer_name": "Bob Johnson",
    "order_type": "takeaway",
    "items": [
      {
        "menu_item_id": 1,
        "quantity": 1
      },
      {
        "menu_item_id": 3,
        "quantity": 2
      }
    ]
  }'
```

---

## Phase 5: Payment & Billing

### 5.1 Issue Bill for Order
```bash
curl -X POST http://localhost:8000/api/cashier/bills/1/issue \
  -H "Authorization: Bearer CASHIER_TOKEN"
```

### 5.2 Get Bill Details
```bash
curl -X GET http://localhost:8000/api/cashier/bills/1 \
  -H "Authorization: Bearer CASHIER_TOKEN"
```

### 5.3 Process Payment (Cash)
```bash
curl -X POST http://localhost:8000/api/cashier/bills/1/payments \
  -H "Authorization: Bearer CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 441.00,
    "method": "cash",
    "reference": "Cash payment"
  }'
```

### 5.4 Process Payment (Card)
```bash
curl -X POST http://localhost:8000/api/cashier/bills/2/payments \
  -H "Authorization: Bearer CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 750.00,
    "method": "card",
    "reference": "Card payment - ****1234"
  }'
```

### 5.5 Get Payment Details
```bash
curl -X GET http://localhost:8000/api/admin/payments \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 5.6 Test Payment Refund
```bash
curl -X POST http://localhost:8000/api/admin/payments/1/refund \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00,
    "reason": "Customer dissatisfied"
  }'
```

### 5.7 Test Bill Void
```bash
curl -X POST http://localhost:8000/api/cashier/bills/3/void \
  -H "Authorization: Bearer CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer request"
  }'
```

---

## Phase 6: Stock Alerts & Notifications

### 6.1 Check Low Stock Alerts
```bash
curl -X GET http://localhost:8000/api/admin/inventory/low-stock \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.2 Simulate Stock Depletion to Trigger Alerts
```bash
# Update inventory to trigger low stock
curl -X PUT http://localhost:8000/api/admin/inventory/items/4 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "current_stock": 15
  }'
```

### 6.3 Test Order with Insufficient Stock
```bash
curl -X POST http://localhost:8000/api/cashier/orders \
  -H "Authorization: Bearer CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 4,
    "customer_name": "Test Customer",
    "order_type": "dine_in",
    "items": [
      {
        "menu_item_id": 1,
        "quantity": 10
      }
    ]
  }'
```

### 6.4 Test Order Cancellation with Stock Restoration
```bash
# Create an order first
curl -X POST http://localhost:8000/api/cashier/orders \
  -H "Authorization: Bearer CASHIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "table_id": 1,
    "customer_name": "Cancel Test",
    "order_type": "dine_in",
    "items": [
      {
        "menu_item_id": 1,
        "quantity": 2
      }
    ]
  }'

# Process the order
curl -X POST http://localhost:8000/api/admin/orders/4/process \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Cancel the order (should restore stock)
curl -X POST http://localhost:8000/api/admin/orders/4/cancel \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer request"
  }'
```

### 6.5 Check Notifications
```bash
curl -X GET http://localhost:8000/api/admin/notifications \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 6.6 Check Unread Notifications Count
```bash
curl -X GET http://localhost:8000/api/admin/notifications/unread-count \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Phase 7: Reports & Analytics

### 7.1 Get Dashboard Analytics
```bash
curl -X GET http://localhost:8000/api/admin/general/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 7.2 Get Sales Analytics
```bash
curl -X GET http://localhost:8000/api/admin/reports/sales-analytics \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 7.3 Get Item Popularity Report
```bash
curl -X GET http://localhost:8000/api/admin/reports/item-popularity \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 7.4 Get Payment Method Summary
```bash
curl -X GET http://localhost:8000/api/admin/reports/payment-method-summary \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 7.5 Get Cashier Performance Report
```bash
curl -X GET http://localhost:8000/api/admin/reports/cashier-performance \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 7.6 Get Refund Summary
```bash
curl -X GET http://localhost:8000/api/admin/reports/refund-summary \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Additional Tests

### User Management
```bash
# Get all users
curl -X GET http://localhost:8000/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Create new user
curl -X POST http://localhost:8000/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "password": "password123",
    "roles": ["Cashier"]
  }'
```

### Recipe Management
```bash
# Get all recipes
curl -X GET http://localhost:8000/api/admin/recipes \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get recipe by menu item
curl -X GET http://localhost:8000/api/admin/menu/items/1/recipe \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Update recipe
curl -X PUT http://localhost:8000/api/admin/recipes/1 \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Updated recipe with better proportions",
    "ingredients": [
      {
        "inventory_item_id": 1,
        "quantity": 0.250
      },
      {
        "inventory_item_id": 2,
        "quantity": 0.150
      }
    ]
  }'
```

### Audit Logs
```bash
# Get audit logs
curl -X GET http://localhost:8000/api/admin/audit-logs \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Get specific audit log
curl -X GET http://localhost:8000/api/admin/audit-logs/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Expected Test Results

### Success Indicators:
- [ ] All authentication endpoints return tokens
- [ ] Inventory items created successfully
- [ ] Menu items with recipes created
- [ ] Orders created and processed
- [ ] Inventory deducted on order processing
- [ ] Bills issued and paid
- [ ] Stock alerts triggered when needed
- [ ] Reports generated successfully
- [ ] All CRUD operations working

### Error Scenarios to Test:
- [ ] Invalid authentication credentials
- [ ] Insufficient stock for order
- [ ] Duplicate order processing
- [ ] Invalid payment amounts
- [ ] Unauthorized access attempts

---

## Test Automation Script

You can run these tests sequentially using a shell script:

```bash
#!/bin/bash
# api-test-runner.sh

BASE_URL="http://localhost:8000"
ADMIN_TOKEN=""
CASHIER_TOKEN=""
WAITER_TOKEN=""

# Function to login and get token
login() {
    local email=$1
    local token_var=$2
    
    response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"password\"}")
    
    token=$(echo $response | jq -r '.token')
    declare -g $token_var="$token"
    echo "Logged in: $email"
}

# Login users
login "admin@restaurant.local" "ADMIN_TOKEN"
login "cashier@restaurant.local" "CASHIER_TOKEN"
login "waiter@restaurant.local" "WAITER_TOKEN"

# Run all test phases
echo "Starting API tests..."

# Add all curl commands from the plan above...

echo "API tests completed!"
```

---

## Notes:
1. Replace `ADMIN_TOKEN`, `CASHIER_TOKEN`, `WAITER_TOKEN` with actual tokens from login responses
2. Adjust inventory_item_id and menu_item_id values based on actual database IDs
3. Test both success and failure scenarios
4. Monitor logs for any errors during testing
5. Check database state after each phase to verify data integrity
