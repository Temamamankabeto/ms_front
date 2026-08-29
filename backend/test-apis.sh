#!/bin/bash

# AIG Cafe API Test Script
# Comprehensive testing for all APIs

set -e

BASE_URL="http://localhost:8000"
ADMIN_TOKEN=""
CASHIER_TOKEN=""
WAITER_TOKEN=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Make request function
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local description=$5
    
    log "Testing: $description"
    
    local curl_cmd="curl -s -w '%{http_code}' -X $method"
    curl_cmd="$curl_cmd '$BASE_URL$endpoint'"
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [ ! -z "$token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    local response=$(eval $curl_cmd)
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        success "PASS - $status_code"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 0
    else
        error "FAIL - $status_code"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        return 1
    fi
}

# Check if server is running
check_server() {
    log "Checking if Laravel server is running..."
    if curl -s "$BASE_URL/api/ping" > /dev/null 2>&1; then
        success "Server is running"
        return 0
    else
        error "Server is not running!"
        echo "Please start Laravel server first:"
        echo "php artisan serve"
        exit 1
    fi
}

# Login function
login() {
    local email=$1
    local role=$2
    local token_var=$3
    
    log "Logging in as $email..."
    
    local response=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"password\"}")
    
    local token=$(echo "$response" | jq -r '.token // empty')
    
    if [ ! -z "$token" ] && [ "$token" != "null" ]; then
        declare -g $token_var="$token"
        success "$role logged in successfully"
        return 0
    else
        error "Failed to login as $role"
        echo "Response: $response"
        return 1
    fi
}

# Phase 1: Authentication
phase1_authentication() {
    log "\n" && log "=================================================="
    log "PHASE 1: Authentication"
    log "=================================================="
    
    login "admin@restaurant.local" "admin" "ADMIN_TOKEN" || return 1
    login "cashier@restaurant.local" "cashier" "CASHIER_TOKEN" || return 1
    login "waiter@restaurant.local" "waiter" "WAITER_TOKEN" || return 1
    
    success "Phase 1 completed"
    return 0
}

# Phase 2: Inventory Management
phase2_inventory() {
    log "\n" && log "=================================================="
    log "PHASE 2: Inventory Management"
    log "=================================================="
    
    # Get current inventory
    make_request "GET" "/api/admin/inventory/items" "" "$ADMIN_TOKEN" "Get inventory items"
    
    # Create inventory items
    make_request "POST" "/api/admin/inventory/items" \
        '{"name":"Premium Beef","unit":"kg","current_stock":50.000,"minimum_quantity":10.000,"average_purchase_price":600.00}' \
        "$ADMIN_TOKEN" "Create Premium Beef"
    
    make_request "POST" "/api/admin/inventory/items" \
        '{"name":"Fresh Vegetables","unit":"kg","current_stock":30.000,"minimum_quantity":5.000,"average_purchase_price":25.50}' \
        "$ADMIN_TOKEN" "Create Fresh Vegetables"
    
    make_request "POST" "/api/admin/inventory/items" \
        '{"name":"Premium Cheese","unit":"kg","current_stock":15.000,"minimum_quantity":3.000,"average_purchase_price":450.00}' \
        "$ADMIN_TOKEN" "Create Premium Cheese"
    
    make_request "POST" "/api/admin/inventory/items" \
        '{"name":"Burger Buns","unit":"pcs","current_stock":100,"minimum_quantity":20,"average_purchase_price":15.00}' \
        "$ADMIN_TOKEN" "Create Burger Buns"
    
    make_request "POST" "/api/admin/inventory/items" \
        '{"name":"Soft Drinks","unit":"ltr","current_stock":20.000,"minimum_quantity":5.000,"average_purchase_price":80.00}' \
        "$ADMIN_TOKEN" "Create Soft Drinks"
    
    # Test low stock
    make_request "GET" "/api/admin/inventory/low-stock" "" "$ADMIN_TOKEN" "Check low stock items"
    
    success "Phase 2 completed"
    return 0
}

# Phase 3: Menu & Recipe Creation
phase3_menu() {
    log "\n" && log "=================================================="
    log "PHASE 3: Menu & Recipe Creation"
    log "=================================================="
    
    # Get categories
    make_request "GET" "/api/admin/menu/categories" "" "$ADMIN_TOKEN" "Get menu categories"
    
    # Create menu items with recipes
    make_request "POST" "/api/admin/menu/items/with-recipe" \
        '{"category_id":1,"name":"Classic Burger","description":"Juicy beef patty with fresh vegetables","type":"food","price":180.50,"prep_minutes":15,"is_available":true,"is_active":true,"ingredients":[{"inventory_item_id":1,"quantity":0.200},{"inventory_item_id":2,"quantity":0.100},{"inventory_item_id":3,"quantity":0.050},{"inventory_item_id":4,"quantity":2}]}' \
        "$ADMIN_TOKEN" "Create Classic Burger"
    
    make_request "POST" "/api/admin/menu/items/with-recipe" \
        '{"category_id":1,"name":"Deluxe Burger","description":"Double patty burger with premium cheese","type":"food","price":250.00,"prep_minutes":20,"is_available":true,"is_active":true,"ingredients":[{"inventory_item_id":1,"quantity":0.300},{"inventory_item_id":3,"quantity":0.100},{"inventory_item_id":4,"quantity":2}]}' \
        "$ADMIN_TOKEN" "Create Deluxe Burger"
    
    make_request "POST" "/api/admin/menu/items/with-recipe" \
        '{"category_id":2,"name":"Cola","description":"Refreshing soft drink","type":"drink","price":80.00,"prep_minutes":2,"is_available":true,"is_active":true,"ingredients":[{"inventory_item_id":5,"quantity":0.250}]}' \
        "$ADMIN_TOKEN" "Create Cola Drink"
    
    # Test cost analysis
    make_request "GET" "/api/admin/menu/items/1/cost-analysis" "" "$ADMIN_TOKEN" "Get cost analysis for Classic Burger"
    
    # Test public menu
    make_request "GET" "/api/public/menu" "" "" "Get public menu"
    
    success "Phase 3 completed"
    return 0
}

# Phase 4: Order Processing
phase4_orders() {
    log "\n" && log "=================================================="
    log "PHASE 4: Order Processing"
    log "=================================================="
    
    # Get tables and menu for POS
    make_request "GET" "/api/cashier/orders/tables" "" "$CASHIER_TOKEN" "Get available tables"
    make_request "GET" "/api/cashier/orders/menu" "" "$CASHIER_TOKEN" "Get menu for POS"
    
    # Create order
    make_request "POST" "/api/cashier/orders" \
        '{"table_id":1,"customer_name":"John Doe","customer_phone":"+1234567890","order_type":"dine_in","notes":"Extra ketchup","items":[{"menu_item_id":1,"quantity":2,"notes":"No onions"},{"menu_item_id":3,"quantity":1}]}' \
        "$CASHIER_TOKEN" "Create order"
    
    # Confirm order
    make_request "POST" "/api/cashier/orders/1/confirm" "" "$CASHIER_TOKEN" "Confirm order"
    
    # Get order details
    make_request "GET" "/api/cashier/orders/1" "" "$CASHIER_TOKEN" "Get order details"
    
    # Process order (inventory deduction)
    make_request "POST" "/api/admin/orders/1/process" "" "$ADMIN_TOKEN" "Process order"
    
    # Check inventory after processing
    make_request "GET" "/api/admin/inventory/items" "" "$ADMIN_TOKEN" "Check inventory after order"
    
    # Create second order
    make_request "POST" "/api/cashier/orders" \
        '{"table_id":2,"customer_name":"Jane Smith","order_type":"dine_in","items":[{"menu_item_id":2,"quantity":3}]}' \
        "$CASHIER_TOKEN" "Create second order"
    
    success "Phase 4 completed"
    return 0
}

# Phase 5: Payment & Billing
phase5_payments() {
    log "\n" && log "=================================================="
    log "PHASE 5: Payment & Billing"
    log "=================================================="
    
    # Issue bill
    make_request "POST" "/api/cashier/bills/1/issue" "" "$CASHIER_TOKEN" "Issue bill"
    
    # Get bill details
    make_request "GET" "/api/cashier/bills/1" "" "$CASHIER_TOKEN" "Get bill details"
    
    # Process payment (cash)
    make_request "POST" "/api/cashier/bills/1/payments" \
        '{"amount":441.00,"method":"cash","reference":"Cash payment"}' \
        "$CASHIER_TOKEN" "Process cash payment"
    
    # Issue bill for second order
    make_request "POST" "/api/cashier/bills/2/issue" "" "$CASHIER_TOKEN" "Issue bill for second order"
    
    # Process payment (card)
    make_request "POST" "/api/cashier/bills/2/payments" \
        '{"amount":750.00,"method":"card","reference":"Card payment - ****1234"}' \
        "$CASHIER_TOKEN" "Process card payment"
    
    # Get payment details
    make_request "GET" "/api/admin/payments" "" "$ADMIN_TOKEN" "Get all payments"
    
    # Test payment refund
    make_request "POST" "/api/admin/payments/1/refund" \
        '{"amount":50.00,"reason":"Customer dissatisfied"}' \
        "$ADMIN_TOKEN" "Test payment refund"
    
    success "Phase 5 completed"
    return 0
}

# Phase 6: Stock Alerts & Notifications
phase6_alerts() {
    log "\n" && log "=================================================="
    log "PHASE 6: Stock Alerts & Notifications"
    log "=================================================="
    
    # Check low stock alerts
    make_request "GET" "/api/admin/inventory/low-stock" "" "$ADMIN_TOKEN" "Check low stock alerts"
    
    # Simulate stock depletion
    make_request "PUT" "/api/admin/inventory/items/4" \
        '{"current_stock":15}' \
        "$ADMIN_TOKEN" "Update stock to trigger alert"
    
    # Test order cancellation with stock restoration
    make_request "POST" "/api/cashier/orders" \
        '{"table_id":1,"customer_name":"Cancel Test","order_type":"dine_in","items":[{"menu_item_id":1,"quantity":2}]}' \
        "$CASHIER_TOKEN" "Create order for cancellation test"
    
    make_request "POST" "/api/admin/orders/3/process" "" "$ADMIN_TOKEN" "Process cancellation order"
    make_request "POST" "/api/admin/orders/3/cancel" \
        '{"reason":"Customer request"}' \
        "$ADMIN_TOKEN" "Cancel order (restore stock)"
    
    # Check notifications
    make_request "GET" "/api/admin/notifications" "" "$ADMIN_TOKEN" "Get notifications"
    make_request "GET" "/api/admin/notifications/unread-count" "" "$ADMIN_TOKEN" "Get unread notifications count"
    
    success "Phase 6 completed"
    return 0
}

# Phase 7: Reports & Analytics
phase7_reports() {
    log "\n" && log "=================================================="
    log "PHASE 7: Reports & Analytics"
    log "=================================================="
    
    # Dashboard and reports
    make_request "GET" "/api/admin/general/dashboard" "" "$ADMIN_TOKEN" "Get admin dashboard"
    make_request "GET" "/api/admin/reports/sales-analytics" "" "$ADMIN_TOKEN" "Get sales analytics"
    make_request "GET" "/api/admin/reports/item-popularity" "" "$ADMIN_TOKEN" "Get item popularity report"
    make_request "GET" "/api/admin/reports/payment-method-summary" "" "$ADMIN_TOKEN" "Get payment method summary"
    make_request "GET" "/api/admin/reports/cashier-performance" "" "$ADMIN_TOKEN" "Get cashier performance"
    make_request "GET" "/api/admin/reports/refund-summary" "" "$ADMIN_TOKEN" "Get refund summary"
    
    success "Phase 7 completed"
    return 0
}

# Additional tests
additional_tests() {
    log "\n" && log "=================================================="
    log "ADDITIONAL TESTS"
    log "=================================================="
    
    # User management
    make_request "GET" "/api/admin/users" "" "$ADMIN_TOKEN" "Get all users"
    make_request "POST" "/api/admin/users" \
        '{"name":"Test User","email":"test@example.com","phone":"+1234567890","password":"password123","roles":["Cashier"]}' \
        "$ADMIN_TOKEN" "Create new user"
    
    # Recipe management
    make_request "GET" "/api/admin/recipes" "" "$ADMIN_TOKEN" "Get all recipes"
    make_request "GET" "/api/admin/menu/items/1/recipe" "" "$ADMIN_TOKEN" "Get recipe by menu item"
    
    # Audit logs
    make_request "GET" "/api/admin/audit-logs" "" "$ADMIN_TOKEN" "Get audit logs"
    
    success "Additional tests completed"
    return 0
}

# Main execution
main() {
    log "Starting AIG Cafe API Test Suite"
    log "Base URL: $BASE_URL"
    
    # Check dependencies
    if ! command -v curl &> /dev/null; then
        error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        warning "jq is not installed. JSON output will not be formatted"
    fi
    
    # Check if server is running
    check_server || exit 1
    
    # Run all phases
    local phases=(
        "phase1_authentication"
        "phase2_inventory"
        "phase3_menu"
        "phase4_orders"
        "phase5_payments"
        "phase6_alerts"
        "phase7_reports"
        "additional_tests"
    )
    
    local failed_phases=0
    
    for phase in "${phases[@]}"; do
        if ! $phase; then
            ((failed_phases++))
            error "Phase $phase failed"
        fi
    done
    
    # Summary
    log "\n" && log "=================================================="
    log "TEST SUMMARY"
    log "=================================================="
    
    if [ $failed_phases -eq 0 ]; then
        success "All phases completed successfully!"
    else
        error "$failed_phases phase(s) failed"
    fi
    
    log "API testing completed!"
}

# Run the script
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
