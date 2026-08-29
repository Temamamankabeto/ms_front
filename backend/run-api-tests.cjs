#!/usr/bin/env node

/**
 * AIG Cafe API Test Runner
 * 
 * Comprehensive automated testing for all APIs from inventory to payment
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const colors = require('colors');

class APITestRunner {
    constructor() {
        this.baseURL = 'http://localhost:8000';
        this.tokens = {
            admin: '',
            cashier: '',
            waiter: ''
        };
        this.testResults = {
            passed: 0,
            failed: 0,
            total: 0,
            errors: []
        };
        this.createdItems = {
            inventory: [],
            menu: [],
            orders: [],
            bills: [],
            payments: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}]`;
        
        switch(type) {
            case 'success':
                console.log(`${prefix} ${message}`.green);
                break;
            case 'error':
                console.log(`${prefix} ${message}`.red);
                break;
            case 'warning':
                console.log(`${prefix} ${message}`.yellow);
                break;
            default:
                console.log(`${prefix} ${message}`.cyan);
        }
    }

    async makeRequest(method, endpoint, data = null, token = '', description = '') {
        const { spawn } = require('child_process');
        
        // Use PowerShell on Windows, curl on Unix
        const isWindows = process.platform === 'win32';
        let args, command;
        
        if (isWindows) {
            // PowerShell version
            command = 'powershell';
            args = [
                '-Command',
                `$response = Invoke-WebRequest -Uri '${this.baseURL}${endpoint}' -Method '${method}' -ContentType 'application/json'${token ? ` -Headers @{'Authorization' = 'Bearer ${token}'}` : ''}${data ? ` -Body '${JSON.stringify(data)}'` : ''}; Write-Output $response.Content; Write-Output $response.StatusCode`
            ];
        } else {
            // Unix/Linux version
            command = 'curl';
            args = [
                '-s', '-w', '%{http_code}',
                '-X', method,
                `${this.baseURL}${endpoint}`,
                '-H', 'Content-Type: application/json',
                ...(token ? ['-H', `Authorization: Bearer ${token}`] : []),
                ...(data ? ['-d', JSON.stringify(data)] : [])
            ];
        }

        return new Promise((resolve) => {
            const child = spawn(command, args);
            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                try {
                    let response, statusCode;
                    
                    if (isWindows) {
                        // PowerShell output parsing
                        const lines = stdout.trim().split('\n');
                        const body = lines.slice(0, -1).join('\n').trim();
                        statusCode = parseInt(lines[lines.length - 1]);
                        
                        try {
                            response = JSON.parse(body);
                        } catch (e) {
                            response = body;
                        }
                    } else {
                        // curl output parsing
                        statusCode = parseInt(stdout.slice(-3));
                        const body = stdout.slice(0, -3).trim();
                        
                        try {
                            response = JSON.parse(body);
                        } catch (e) {
                            response = body;
                        }
                    }
                    
                    resolve({
                        success: statusCode >= 200 && statusCode < 300,
                        statusCode: statusCode || 0,
                        data: response,
                        error: stderr,
                        rawOutput: stdout
                    });
                } catch (error) {
                    resolve({
                        success: false,
                        statusCode: 0,
                        data: null,
                        error: error.message,
                        rawOutput: stdout
                    });
                }
            });
        });
    }

    async test(description, method, endpoint, data = null, tokenType = 'admin') {
        const token = this.tokens[tokenType] || '';
        this.testResults.total++;
        
        this.log(`Testing: ${description}`, 'info');
        
        try {
            const result = await this.makeRequest(method, endpoint, data, token, description);
            
            if (result.success) {
                this.testResults.passed++;
                this.log(`  ${'PASS'.green.bold} - ${result.statusCode}`);
                // Show response data for debugging
                if (process.env.DEBUG === 'true' && result.data) {
                    console.log('  Response:', JSON.stringify(result.data, null, 2));
                }
                return result.data;
            } else {
                this.testResults.failed++;
                this.log(`  ${'FAIL'.red.bold} - ${result.statusCode}`, 'error');
                
                // Show detailed error information
                if (result.data && typeof result.data === 'object') {
                    if (result.data.message) {
                        this.log(`  Message: ${result.data.message}`, 'error');
                    }
                    if (result.data.errors) {
                        this.log('  Validation Errors:', 'error');
                        Object.entries(result.data.errors).forEach(([field, messages]) => {
                            this.log(`    ${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`, 'error');
                        });
                    }
                }
                
                if (result.error && result.error.trim()) {
                    this.log(`  Error: ${result.error}`, 'error');
                }
                
                if (result.rawOutput && result.rawOutput.trim()) {
                    this.log(`  Raw Output: ${result.rawOutput}`, 'error');
                }
                
                this.testResults.errors.push({
                    test: description,
                    error: result.error,
                    status: result.statusCode,
                    response: result.data,
                    rawOutput: result.rawOutput
                });
                return null;
            }
        } catch (error) {
            this.testResults.failed++;
            this.log(`  ${'ERROR'.red.bold} - ${error.message}`, 'error');
            this.testResults.errors.push({
                test: description,
                error: error.message
            });
            return null;
        }
    }

    async login(email, role) {
        this.log(`Logging in as ${email}...`);
        
        const result = await this.test(
            `Login as ${role}`,
            'POST',
            '/api/auth/login',
            { email, password: 'password' },
            ''
        );

        if (result && result.token) {
            this.tokens[role] = result.token;
            this.log(`  ${role} logged in successfully`, 'success');
            return true;
        } else {
            this.log(`  Failed to login as ${role}`, 'error');
            return false;
        }
    }

    async runPhase1_Authentication() {
        this.log('\n' + '='.repeat(60), 'info');
        this.log('PHASE 1: Authentication', 'info');
        this.log('='.repeat(60), 'info');

        const adminLogin = await this.login('admin@restaurant.local', 'admin');
        const cashierLogin = await this.login('cashier@restaurant.local', 'cashier');
        const waiterLogin = await this.login('waiter@restaurant.local', 'waiter');

        return adminLogin && cashierLogin && waiterLogin;
    }

    async runPhase2_Inventory() {
        this.log('\n' + '='.repeat(60), 'info');
        this.log('PHASE 2: Inventory Management', 'info');
        this.log('='.repeat(60), 'info');

        // Get current inventory
        await this.test('Get inventory items', 'GET', '/api/admin/inventory/items');

        // Create inventory items
        const beef = await this.test('Create Premium Beef', 'POST', '/api/admin/inventory/items', {
            name: 'Premium Beef',
            unit: 'kg',
            current_stock: 50.000,
            minimum_quantity: 10.000,
            average_purchase_price: 600.00
        }, 'admin');

        if (beef && beef.data) this.createdItems.inventory.push(beef.data.id);

        const vegetables = await this.test('Create Fresh Vegetables', 'POST', '/api/admin/inventory/items', {
            name: 'Fresh Vegetables',
            unit: 'kg',
            current_stock: 30.000,
            minimum_quantity: 5.000,
            average_purchase_price: 25.50
        }, 'admin');

        if (vegetables && vegetables.data) this.createdItems.inventory.push(vegetables.data.id);

        const cheese = await this.test('Create Premium Cheese', 'POST', '/api/admin/inventory/items', {
            name: 'Premium Cheese',
            unit: 'kg',
            current_stock: 15.000,
            minimum_quantity: 3.000,
            average_purchase_price: 450.00
        }, 'admin');

        if (cheese && cheese.data) this.createdItems.inventory.push(cheese.data.id);

        const buns = await this.test('Create Burger Buns', 'POST', '/api/admin/inventory/items', {
            name: 'Burger Buns',
            unit: 'pcs',
            current_stock: 100,
            minimum_quantity: 20,
            average_purchase_price: 15.00
        }, 'admin');

        if (buns && buns.data) this.createdItems.inventory.push(buns.data.id);

        const drinks = await this.test('Create Soft Drinks', 'POST', '/api/admin/inventory/items', {
            name: 'Soft Drinks',
            unit: 'ltr',
            current_stock: 20.000,
            minimum_quantity: 5.000,
            average_purchase_price: 80.00
        }, 'admin');

        if (drinks && drinks.data) this.createdItems.inventory.push(drinks.data.id);

        // Test low stock
        await this.test('Check low stock items', 'GET', '/api/admin/inventory/low-stock');

        // Test batch adjustment
        await this.test('Batch stock adjustment', 'POST', '/api/admin/inventory/batch-adjust', {
            adjustments: [
                {
                    inventory_item_id: this.createdItems.inventory[0] || 1,
                    quantity: 10.000,
                    type: 'increase',
                    note: 'Stock received from supplier'
                }
            ]
        }, 'admin');

        return true;
    }

    async runPhase3_Menu() {
        this.log('\n' + '='.repeat(60), 'info');
        this.log('PHASE 3: Menu & Recipe Creation', 'info');
        this.log('='.repeat(60), 'info');

        // Get categories
        await this.test('Get menu categories', 'GET', '/api/admin/menu/categories');

        // Create menu items with recipes
        const classicBurger = await this.test('Create Classic Burger', 'POST', '/api/admin/menu/items/with-recipe', {
            category_id: 1,
            name: 'Classic Burger',
            description: 'Juicy beef patty with fresh vegetables and cheese',
            type: 'food',
            price: 180.50,
            prep_minutes: 15,
            is_available: true,
            is_active: true,
            ingredients: [
                { inventory_item_id: this.createdItems.inventory[0] || 1, quantity: 0.200 },
                { inventory_item_id: this.createdItems.inventory[1] || 2, quantity: 0.100 },
                { inventory_item_id: this.createdItems.inventory[2] || 3, quantity: 0.050 },
                { inventory_item_id: this.createdItems.inventory[3] || 4, quantity: 2 }
            ]
        }, 'admin');

        if (classicBurger && classicBurger.data) this.createdItems.menu.push(classicBurger.data.id);

        const deluxeBurger = await this.test('Create Deluxe Burger', 'POST', '/api/admin/menu/items/with-recipe', {
            category_id: 1,
            name: 'Deluxe Burger',
            description: 'Double patty burger with premium cheese',
            type: 'food',
            price: 250.00,
            prep_minutes: 20,
            is_available: true,
            is_active: true,
            ingredients: [
                { inventory_item_id: this.createdItems.inventory[0] || 1, quantity: 0.300 },
                { inventory_item_id: this.createdItems.inventory[2] || 3, quantity: 0.100 },
                { inventory_item_id: this.createdItems.inventory[3] || 4, quantity: 2 }
            ]
        }, 'admin');

        if (deluxeBurger && deluxeBurger.data) this.createdItems.menu.push(deluxeBurger.data.id);

        const cola = await this.test('Create Cola Drink', 'POST', '/api/admin/menu/items/with-recipe', {
            category_id: 2,
            name: 'Cola',
            description: 'Refreshing soft drink',
            type: 'drink',
            price: 80.00,
            prep_minutes: 2,
            is_available: true,
            is_active: true,
            ingredients: [
                { inventory_item_id: this.createdItems.inventory[4] || 5, quantity: 0.250 }
            ]
        }, 'admin');

        if (cola && cola.data) this.createdItems.menu.push(cola.data.id);

        // Test cost analysis
        await this.test('Get cost analysis for Classic Burger', 'GET', `/api/admin/menu/items/${this.createdItems.menu[0]}/cost-analysis`);

        // Test public menu
        await this.test('Get public menu', 'GET', '/api/public/menu');

        return true;
    }

    async runPhase4_Orders() {
        this.log('\n' + '='.repeat(60), 'info');
        this.log('PHASE 4: Order Processing', 'info');
        this.log('='.repeat(60), 'info');

        // Get tables and menu for POS
        await this.test('Get available tables', 'GET', '/api/cashier/orders/tables', null, 'cashier');
        await this.test('Get menu for POS', 'GET', '/api/cashier/orders/menu', null, 'cashier');

        // Create order
        const order = await this.test('Create order', 'POST', '/api/cashier/orders', {
            table_id: 1,
            customer_name: 'John Doe',
            customer_phone: '+1234567890',
            order_type: 'dine_in',
            notes: 'Extra ketchup',
            items: [
                { menu_item_id: this.createdItems.menu[0] || 1, quantity: 2, notes: 'No onions' },
                { menu_item_id: this.createdItems.menu[2] || 3, quantity: 1 }
            ]
        }, 'cashier');

        if (order && order.data) this.createdItems.orders.push(order.data.id);

        // Confirm order
        await this.test('Confirm order', 'POST', `/api/cashier/orders/${this.createdItems.orders[0]}/confirm`, null, 'cashier');

        // Get order details
        await this.test('Get order details', 'GET', `/api/cashier/orders/${this.createdItems.orders[0]}`, null, 'cashier');

        // Process order (inventory deduction)
        await this.test('Process order', 'POST', `/api/admin/orders/${this.createdItems.orders[0]}/process`, null, 'admin');

        // Check inventory after processing
        await this.test('Check inventory after order', 'GET', '/api/admin/inventory/items', null, 'admin');

        // Create multiple orders
        const order2 = await this.test('Create second order', 'POST', '/api/cashier/orders', {
            table_id: 2,
            customer_name: 'Jane Smith',
            order_type: 'dine_in',
            items: [
                { menu_item_id: this.createdItems.menu[1] || 2, quantity: 3 }
            ]
        }, 'cashier');

        if (order2 && order2.data) this.createdItems.orders.push(order2.data.id);

        return true;
    }

    async runPhase5_Payments() {
        this.log('\n' + '='.repeat(60), 'info');
        this.log('PHASE 5: Payment & Billing', 'info');
        this.log('='.repeat(60), 'info');

        // Issue bill
        const bill = await this.test('Issue bill', 'POST', `/api/cashier/bills/${this.createdItems.orders[0]}/issue`, null, 'cashier');
        if (bill && bill.data) this.createdItems.bills.push(bill.data.id);

        // Get bill details
        await this.test('Get bill details', 'GET', `/api/cashier/bills/${this.createdItems.bills[0]}`, null, 'cashier');

        // Process payment (cash)
        const payment1 = await this.test('Process cash payment', 'POST', `/api/cashier/bills/${this.createdItems.bills[0]}/payments`, {
            amount: 441.00,
            method: 'cash',
            reference: 'Cash payment'
        }, 'cashier');

        if (payment1 && payment1.data) this.createdItems.payments.push(payment1.data.id);

        // Issue bill for second order
        const bill2 = await this.test('Issue bill for second order', 'POST', `/api/cashier/bills/${this.createdItems.orders[1]}/issue`, null, 'cashier');
        if (bill2 && bill2.data) this.createdItems.bills.push(bill2.data.id);

        // Process payment (card)
        const payment2 = await this.test('Process card payment', 'POST', `/api/cashier/bills/${this.createdItems.bills[1]}/payments`, {
            amount: 750.00,
            method: 'card',
            reference: 'Card payment - ****1234'
        }, 'cashier');

        if (payment2 && payment2.data) this.createdItems.payments.push(payment2.data.id);

        // Get payment details
        await this.test('Get all payments', 'GET', '/api/admin/payments', null, 'admin');

        // Test payment refund
        await this.test('Test payment refund', 'POST', `/api/admin/payments/${this.createdItems.payments[0]}/refund`, {
            amount: 50.00,
            reason: 'Customer dissatisfied'
        }, 'admin');

        return true;
    }

    async runPhase6_StockAlerts() {
        this.log('\n' + '='.repeat(60), 'info');
        this.log('PHASE 6: Stock Alerts & Notifications', 'info');
        this.log('='.repeat(60), 'info');

        // Check low stock alerts
        await this.test('Check low stock alerts', 'GET', '/api/admin/inventory/low-stock', null, 'admin');

        // Simulate stock depletion
        await this.test('Update stock to trigger alert', 'PUT', `/api/admin/inventory/items/${this.createdItems.inventory[3]}`, {
            current_stock: 15
        }, 'admin');

        // Test order cancellation with stock restoration
        const cancelOrder = await this.test('Create order for cancellation test', 'POST', '/api/cashier/orders', {
            table_id: 1,
            customer_name: 'Cancel Test',
            order_type: 'dine_in',
            items: [
                { menu_item_id: this.createdItems.menu[0] || 1, quantity: 2 }
            ]
        }, 'cashier');

        if (cancelOrder && cancelOrder.data) {
            await this.test('Process cancellation order', 'POST', `/api/admin/orders/${cancelOrder.data.id}/process`, null, 'admin');
            await this.test('Cancel order (restore stock)', 'POST', `/api/admin/orders/${cancelOrder.data.id}/cancel`, {
                reason: 'Customer request'
            }, 'admin');
        }

        // Check notifications
        await this.test('Get notifications', 'GET', '/api/admin/notifications', null, 'admin');
        await this.test('Get unread notifications count', 'GET', '/api/admin/notifications/unread-count', null, 'admin');

        return true;
    }

    async runPhase7_Reports() {
        this.log('\n' + '='.repeat(60), 'info');
        this.log('PHASE 7: Reports & Analytics', 'info');
        this.log('='.repeat(60), 'info');

        // Dashboard and reports
        await this.test('Get admin dashboard', 'GET', '/api/admin/general/dashboard', null, 'admin');
        await this.test('Get sales analytics', 'GET', '/api/admin/reports/sales-analytics', null, 'admin');
        await this.test('Get item popularity report', 'GET', '/api/admin/reports/item-popularity', null, 'admin');
        await this.test('Get payment method summary', 'GET', '/api/admin/reports/payment-method-summary', null, 'admin');
        await this.test('Get cashier performance', 'GET', '/api/admin/reports/cashier-performance', null, 'admin');
        await this.test('Get refund summary', 'GET', '/api/admin/reports/refund-summary', null, 'admin');

        return true;
    }

    async runAdditionalTests() {
        this.log('\n' + '='.repeat(60), 'info');
        this.log('ADDITIONAL TESTS', 'info');
        this.log('='.repeat(60), 'info');

        // User management
        await this.test('Get all users', 'GET', '/api/admin/users', null, 'admin');
        await this.test('Create new user', 'POST', '/api/admin/users', {
            name: 'Test User',
            email: 'test@example.com',
            phone: '+1234567890',
            password: 'password123',
            roles: ['Cashier']
        }, 'admin');

        // Recipe management
        await this.test('Get all recipes', 'GET', '/api/admin/recipes', null, 'admin');
        await this.test('Get recipe by menu item', 'GET', `/api/admin/menu/items/${this.createdItems.menu[0]}/recipe`, null, 'admin');

        // Audit logs
        await this.test('Get audit logs', 'GET', '/api/admin/audit-logs', null, 'admin');

        return true;
    }

    printSummary() {
        this.log('\n' + '='.repeat(60), 'info');
        this.log('TEST SUMMARY', 'info');
        this.log('='.repeat(60), 'info');

        const total = this.testResults.total;
        const passed = this.testResults.passed;
        const failed = this.testResults.failed;
        const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

        this.log(`Total Tests: ${total}`, 'info');
        this.log(`Passed: ${passed}`, 'success');
        this.log(`Failed: ${failed}`, failed > 0 ? 'error' : 'info');
        this.log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : successRate >= 70 ? 'warning' : 'error');

        if (this.testResults.errors.length > 0) {
            this.log('\nFailed Tests:', 'error');
            this.testResults.errors.forEach((error, index) => {
                this.log(`${index + 1}. ${error.test}`, 'error');
                this.log(`   Status: ${error.status || 'N/A'}`, 'error');
                this.log(`   Error: ${error.error}`, 'error');
            });
        }

        this.log('\nCreated Items:', 'info');
        this.log(`Inventory Items: ${this.createdItems.inventory.length}`, 'info');
        this.log(`Menu Items: ${this.createdItems.menu.length}`, 'info');
        this.log(`Orders: ${this.createdItems.orders.length}`, 'info');
        this.log(`Bills: ${this.createdItems.bills.length}`, 'info');
        this.log(`Payments: ${this.createdItems.payments.length}`, 'info');
    }

    async runAllTests() {
        this.log('Starting AIG Cafe API Test Suite', 'info');
        this.log('Base URL: ' + this.baseURL, 'info');

        try {
            // Check if server is running
            const healthCheck = await this.makeRequest('GET', '/api/ping');
            if (!healthCheck.success) {
                this.log('Server is not running! Please start Laravel server first:', 'error');
                this.log('php artisan serve', 'info');
                return false;
            }

            // Run all test phases
            const phases = [
                () => this.runPhase1_Authentication(),
                () => this.runPhase2_Inventory(),
                () => this.runPhase3_Menu(),
                () => this.runPhase4_Orders(),
                () => this.runPhase5_Payments(),
                () => this.runPhase6_StockAlerts(),
                () => this.runPhase7_Reports(),
                () => this.runAdditionalTests()
            ];

            for (const phase of phases) {
                const success = await phase();
                if (!success) {
                    this.log('Phase failed, stopping tests', 'error');
                    break;
                }
            }

            this.printSummary();

        } catch (error) {
            this.log(`Test suite failed: ${error.message}`, 'error');
        }
    }
}

// Run the tests
if (require.main === module) {
    const runner = new APITestRunner();
    runner.runAllTests().catch(console.error);
}

module.exports = APITestRunner;
