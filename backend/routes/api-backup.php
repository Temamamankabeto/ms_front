<?php

use App\Http\Controllers\Api\AuthController;

use App\Http\Controllers\Api\BillController;
use App\Http\Controllers\Api\CashShiftController;
use App\Http\Controllers\Api\CustomerDashboardController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DiningTableController;
use App\Http\Controllers\Api\InventoryItemController;
use App\Http\Controllers\Api\InventoryReportController;
use App\Http\Controllers\Api\InventoryTransactionController;
use App\Http\Controllers\Api\MenuCategoryController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\PublicAuthController;
use App\Http\Controllers\Api\PublicMenuController;
use App\Http\Controllers\Api\PublicOrderController;
use App\Http\Controllers\Api\PublicPaymentController;

use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\RecipeController;

// add these only if the controllers really exist in your project
use App\Http\Controllers\Api\RefundRequestController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\StockReceivingController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WaiterOrderController;
use App\Http\Controllers\BarTicketController;
use App\Http\Controllers\KitchenTicketController;
use Illuminate\Support\Facades\Route;



/*
|--------------------------------------------------------------------------
| Public test endpoint
|--------------------------------------------------------------------------
*/
Route::get('/ping', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working',
        'time' => now(),
    ]);
});

/*
|--------------------------------------------------------------------------
| Public auth routes
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

/*
|--------------------------------------------------------------------------
| Public menu + orders
|--------------------------------------------------------------------------
*/
Route::prefix('public')->group(function () {

Route::get('/menu', [PublicMenuController::class, 'index']);
Route::get('/menu/categories', [PublicMenuController::class, 'categories']);
Route::get('/menu/{id}', [PublicMenuController::class, 'show']);

Route::get('/tables', [PublicOrderController::class, 'tables']);

Route::post('/register', [PublicAuthController::class, 'register']);
Route::post('/login', [PublicAuthController::class, 'login']);

Route::post('/orders', [PublicOrderController::class, 'store']);
Route::get('/orders/{orderNumber}', [PublicOrderController::class, 'show']);

Route::get('/bills/{id}', [PublicPaymentController::class, 'showBill']);
Route::post('/bills/{id}/payments', [PublicPaymentController::class, 'storePayment']);

});

/*
|--------------------------------------------------------------------------
| Customer self-service
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/customer/dashboard', [CustomerDashboardController::class, 'index']);
    Route::post('/customer/profile', [CustomerDashboardController::class, 'updateProfile']);
});

/*
|--------------------------------------------------------------------------
| Protected routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Dashboards
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:dashboard.waiter')->group(function () {
        Route::get('/waiter/dashboard', [DashboardController::class, 'waiterDashboard']);
    });

    Route::middleware('permission:cashier.dashboard')->group(function () {
        Route::get('/cashier/dashboard', [DashboardController::class, 'cashierDashboard']);
    });

    Route::middleware('permission:bar.dashboard')->group(function () {
        Route::get('/bar/dashboard', [DashboardController::class, 'barDashboard']);
    });

    Route::middleware('permission:kitchen.dashboard')->group(function () {
        Route::get('/kitchen/dashboard', [DashboardController::class, 'kitchenDashboard']);
    });

    Route::middleware('permission:food-controller.dashboard')->group(function () {
        Route::get('/food-controller/dashboard', [DashboardController::class, 'foodControllerDashboard']);
    });

    Route::middleware('permission:finance.dashboard')->group(function () {
        Route::get('/finance/dashboard', [DashboardController::class, 'financeDashboard']);
    });

    Route::middleware('permission:manager.dashboard')->group(function () {
        Route::get('/manager/dashboard', [DashboardController::class, 'managerDashboard']);
    });

    Route::middleware('permission:general.dashboard')->group(function () {
        Route::get('/general/dashboard', [DashboardController::class, 'generalDashboard']);
    });

    /*
    |--------------------------------------------------------------------------
    | Menu management
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:menu.read')->group(function () {
        Route::get('/menu/categories', [MenuCategoryController::class, 'index']);
        Route::get('/menu/items', [MenuItemController::class, 'index']);
        Route::get('/menu/items/{id}', [MenuItemController::class, 'show']);
    });

    Route::middleware('permission:menu.create')->group(function () {
        Route::post('/menu/categories', [MenuCategoryController::class, 'store']);
        Route::post('/menu/items', [MenuItemController::class, 'store']);
    });

    Route::middleware('permission:menu.update')->group(function () {
        Route::put('/menu/categories/{id}', [MenuCategoryController::class, 'update']);
        Route::put('/menu/items/{id}', [MenuItemController::class, 'update']);
        Route::post('/menu/items/{id}/image', [MenuItemController::class, 'uploadImage']);
    });

    Route::middleware('permission:menu.disable')->group(function () {
        Route::patch('/menu/categories/{id}/toggle', [MenuCategoryController::class, 'toggleActive']);
        Route::patch('/menu/items/{id}/toggle', [MenuItemController::class, 'toggleActive']);
        Route::patch('/menu/items/{id}/availability', [MenuItemController::class, 'setAvailability']);
    });

    /*
    |--------------------------------------------------------------------------
    | Roles + permissions
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:roles.read')->group(function () {
        Route::get('/roles', [RoleController::class, 'index']);
        Route::get('/role-permissions', [RoleController::class, 'permissions']);
        Route::get('/roles/{id}/permissions', [RoleController::class, 'rolePermissions']);
    });

    Route::middleware('permission:roles.create')->group(function () {
        Route::post('/roles', [RoleController::class, 'store']);
    });

    Route::middleware('permission:roles.update')->group(function () {
        Route::put('/roles/{id}', [RoleController::class, 'update']);
    });

    Route::middleware('permission:roles.assign')->group(function () {
        Route::post('/roles/{id}/permissions', [RoleController::class, 'assignPermissions']);
    });

    /*
    |--------------------------------------------------------------------------
    | Users management
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:users.read')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::get('/roles-lite', [UserController::class, 'rolesLite']);
        Route::get('/waiters-lite', [UserController::class, 'waitersLite']);
    });

    Route::middleware('permission:users.create')->group(function () {
        Route::post('/users', [UserController::class, 'store']);
    });

    Route::middleware('permission:users.update')->group(function () {
        Route::put('/users/{id}', [UserController::class, 'update']);
    });

    Route::middleware('permission:users.disable')->group(function () {
        Route::patch('/users/{id}/toggle', [UserController::class, 'toggle']);
        Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
    });

    Route::middleware('permission:roles.assign')->group(function () {
        Route::post('/users/{id}/roles', [UserController::class, 'assignRole']);
    });

    /*
    |--------------------------------------------------------------------------
    | Permissions management
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:permissions.read')->group(function () {
        Route::get('/permissions', [PermissionController::class, 'index']);
    });

    Route::middleware('permission:permissions.create')->group(function () {
        Route::post('/permissions', [PermissionController::class, 'store']);
    });

    Route::middleware('permission:permissions.update')->group(function () {
        Route::put('/permissions/{id}', [PermissionController::class, 'update']);
    });

    Route::middleware('permission:permissions.delete')->group(function () {
        Route::delete('/permissions/{id}', [PermissionController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | Dining tables
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:tables.read')->group(function () {
        Route::get('/tables', [DiningTableController::class, 'index']);
        Route::get('/tables/{id}', [DiningTableController::class, 'show']);
    });

    Route::middleware('permission:tables.create')->group(function () {
        Route::post('/tables', [DiningTableController::class, 'store']);
    });

    Route::middleware('permission:tables.assign')->group(function () {
        Route::post('/tables/{id}/assign', [DiningTableController::class, 'assignWaiter']);
    });

    Route::middleware('permission:tables.transfer')->group(function () {
        Route::post('/tables/{id}/transfer', [DiningTableController::class, 'transfer']);
    });

    Route::middleware('permission:tables.update')->group(function () {
        Route::patch('/tables/{id}/status', [DiningTableController::class, 'setStatus']);
        Route::patch('/tables/{id}/toggle', [DiningTableController::class, 'toggleActive']);
        Route::put('/tables/{id}', [DiningTableController::class, 'update']);
    });

    // put static route before /orders/{id}
    Route::middleware('permission:orders.request.cancel')->group(function () {
    Route::get('/orders/request/cancel', [OrderController::class, 'requestCancel']);
    });

    Route::middleware('permission:orders.read')->group(function () {
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
Route::get('/waiter/orders/cancelable', [WaiterOrderController::class,'cancelableOrders']);
    Route::get('/waiter/orders/confirmed', [WaiterOrderController::class, 'confirmedOrders']);
        Route::get('/waiter/orders/rejected', [WaiterOrderController::class, 'rejectedOrders']);
    Route::get('/waiter/orders/ready', [WaiterOrderController::class, 'readyOrders']);
 Route::get('/waiter/orders/served', [WaiterOrderController::class, 'servedOrders']);
 Route::post('/waiter/payments/submit', [PaymentController::class, 'submitByWaiter']);
 Route::get('/payments/pending-approval', [PaymentController::class, 'pendingApproval']);
 Route::post('/payments/{id}/approve', [PaymentController::class, 'approve']);
 Route::post('/payments/{id}/return', [PaymentController::class, 'returnPayment']);
 Route::post('/payments/{id}/fail', [PaymentController::class, 'fail']);

 Route::get('/waiter/payments/report', [PaymentController::class, 'waiterReport']);
Route::get('/waiter/reports/sold-items', [WaiterOrderController::class, 'waiterSoldItems']);
Route::get('/report/categories', [WaiterOrderController::class, 'categories']);



    });

     

    /*
    |--------------------------------------------------------------------------
    | Kitchen KDS
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:kds.kitchen')->group(function () {
        Route::get('/kitchen/tickets', [KitchenTicketController::class, 'index']);
        Route::post('/kitchen/tickets/{id}/accept', [KitchenTicketController::class, 'accept']);
        Route::post('/kitchen/tickets/{id}/ready', [KitchenTicketController::class, 'ready']);
        Route::post('/kitchen/tickets/{id}/delay', [KitchenTicketController::class, 'delay']);
        Route::post('/kitchen/tickets/{id}/reject', [KitchenTicketController::class, 'reject']);
    });

    /*
    |--------------------------------------------------------------------------
    | Bar BDS
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:kds.bar')->group(function () {
        Route::get('/bar/tickets', [BarTicketController::class, 'index']);
        Route::post('/bar/tickets/{id}/accept', [BarTicketController::class, 'accept']);
        Route::post('/bar/tickets/{id}/ready', [BarTicketController::class, 'ready']);
        Route::post('/bar/tickets/{id}/delay', [BarTicketController::class, 'delay']);
        Route::post('/bar/tickets/{id}/reject', [BarTicketController::class, 'reject']);
    });

    /*
    |--------------------------------------------------------------------------
    | Billing
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:bills.read')->group(function () {
        Route::get('/bills', [BillController::class, 'index']);
        Route::get('/bills/{id}', [BillController::class, 'show']);
        Route::get('/orders/{id}/bill', [BillController::class, 'showByOrder']);
    });

    Route::middleware('permission:bills.issue')->group(function () {
        Route::post('/orders/{id}/bill', [BillController::class, 'createOrUpdateDraft']);
        Route::post('/bills/{id}/issue', [BillController::class, 'issue']);
        Route::post('/bills/{id}/void', [BillController::class, 'void']);
    });

    /*
    |--------------------------------------------------------------------------
    | Payments
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:payments.create')->group(function () {
        Route::post('/bills/{id}/payments', [PaymentController::class, 'store']);
    });

    Route::middleware('permission:payments.read')->group(function () {
        Route::get('/payments', [PaymentController::class, 'index']);
        Route::get('/payments/{id}', [PaymentController::class, 'show']);
    });

    /*
    |--------------------------------------------------------------------------
    | Refunds
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:refunds.request')->group(function () {
        Route::post('/payments/{id}/refund-requests', [RefundRequestController::class, 'store']);
    });

    Route::middleware('permission:refunds.approve')->group(function () {
        Route::post('/refund-requests/{id}/approve', [RefundRequestController::class, 'approve']);
        Route::post('/refund-requests/{id}/reject', [RefundRequestController::class, 'reject']);
        Route::post('/refund-requests/{id}/process', [RefundRequestController::class, 'processRefund']);
    });

    Route::middleware('permission:refunds.read')->group(function () {
        Route::get('/refund-requests', [RefundRequestController::class, 'index']);
        Route::get('/refund-requests/{id}', [RefundRequestController::class, 'show']);
    });

    /*
    |--------------------------------------------------------------------------
    | Cash shifts
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:shifts.manage')->group(function () {
        Route::post('/cash-shifts/open', [CashShiftController::class, 'open']);
        Route::post('/cash-shifts/{id}/close', [CashShiftController::class, 'close']);
        Route::get('/cash-shifts', [CashShiftController::class, 'index']);
        Route::get('/cash-shifts/current', [CashShiftController::class, 'current']);
        Route::get('/cash-shifts/{id}', [CashShiftController::class, 'show']);
    });

    /*
    |--------------------------------------------------------------------------
    | Inventory
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:inventory.read')->group(function () {
        Route::get('/inventory/items', [InventoryItemController::class, 'index']);
        Route::get('/inventory/items/{id}', [InventoryItemController::class, 'show']);
        Route::get('/inventory/transactions', [InventoryTransactionController::class, 'index']);
        Route::get('/reports/low-stock', [InventoryReportController::class, 'lowStock']);
        Route::get('/reports/reorder-suggestions', [InventoryReportController::class, 'reorderSuggestions']);
    });

    Route::middleware('permission:inventory.create')->group(function () {
        Route::post('/inventory/items', [InventoryItemController::class, 'store']);
    });

    Route::middleware('permission:inventory.update')->group(function () {
        Route::put('/inventory/items/{id}', [InventoryItemController::class, 'update']);
    });

    Route::middleware('permission:inventory.adjust')->group(function () {
        Route::post('/inventory/items/{id}/adjust', [InventoryTransactionController::class, 'adjust']);
        Route::post('/inventory/items/{id}/waste', [InventoryTransactionController::class, 'waste']);
    });

    /*
    |--------------------------------------------------------------------------
    | Suppliers + purchasing
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:suppliers.read')->group(function () {
        Route::get('/suppliers', [SupplierController::class, 'index']);
        Route::get('/suppliers/{id}', [SupplierController::class, 'show']);
    });

    Route::middleware('permission:suppliers.create')->group(function () {
        Route::post('/suppliers', [SupplierController::class, 'store']);
    });

    Route::middleware('permission:suppliers.update')->group(function () {
        Route::put('/suppliers/{id}', [SupplierController::class, 'update']);
    });

    Route::middleware('permission:purchases.read')->group(function () {
        Route::get('/purchase-orders', [PurchaseOrderController::class, 'index']);
        Route::get('/purchase-orders/{id}', [PurchaseOrderController::class, 'show']);
    });

    Route::middleware('permission:purchases.create')->group(function () {
        Route::post('/purchase-orders', [PurchaseOrderController::class, 'store']);
    });

    Route::middleware('permission:purchases.approve')->group(function () {
        Route::post('/purchase-orders/{id}/approve', [PurchaseOrderController::class, 'approve']);
        Route::post('/purchase-orders/{id}/cancel', [PurchaseOrderController::class, 'cancel']);
    });

    Route::middleware('permission:stock.receive')->group(function () {
        Route::post('/purchase-orders/{id}/receive', [StockReceivingController::class, 'receive']);
    });

    /*
    |--------------------------------------------------------------------------
    | Recipes
    |--------------------------------------------------------------------------
    */
    Route::middleware('permission:recipes.read')->group(function () {
        Route::get('/recipes', [RecipeController::class, 'index']);
        Route::get('/recipes/{id}', [RecipeController::class, 'show']);
        Route::get('/menu/items/{id}/recipe', [RecipeController::class, 'showByMenuItem']);
    });

    Route::middleware('permission:recipes.create')->group(function () {
        Route::post('/recipes', [RecipeController::class, 'store']);
    });

    Route::middleware('permission:recipes.update')->group(function () {
        Route::put('/recipes/{id}', [RecipeController::class, 'update']);
    });
});

// Waiter order management routes
Route::middleware(['auth:sanctum'])->prefix('waiter')->group(function () {
    Route::middleware('permission:orders.update')->group(function () {

            // Order listing routes
            Route::get('/orders/pending', [WaiterOrderController::class, 'pendingOrders']);
            Route::get('/orders/confirmed', [WaiterOrderController::class, 'confirmedOrders']);
            Route::get('/orders/rejected', [WaiterOrderController::class, 'rejectedOrders']);
            Route::get('/orders/ready', [WaiterOrderController::class, 'readyOrders']);
            Route::get('/orders/served', [WaiterOrderController::class, 'servedOrders']);
            Route::get('/orders/cancelable', [WaiterOrderController::class, 'cancelableOrders']);

            // Order status update routes
            Route::post('/orders/{id}/confirm', [WaiterOrderController::class, 'confirmOrder']);
            Route::post('/orders/{id}/prepare', [WaiterOrderController::class, 'markPreparing']);
            Route::post('/orders/{id}/serve', [WaiterOrderController::class, 'markServed']);

            // Existing order actions
            Route::post('/orders/{id}/request-cancel', [WaiterOrderController::class, 'requestCancel']);
            Route::post('/orders/{id}/approve-cancel', [WaiterOrderController::class, 'approveCancel']);
            Route::post('/orders/{id}/void', [WaiterOrderController::class, 'voidOrder']);
    });

        Route::middleware('permission:orders.create')->group(function () {
                Route::get('/menu', [WaiterOrderController::class, 'menu']);
                Route::get('/tables', [WaiterOrderController::class, 'tables']);
                Route::post('/orders', [WaiterOrderController::class, 'store']);
            });
});