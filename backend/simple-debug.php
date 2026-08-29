<?php

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "Laravel bootstrapped successfully\n";

// Check if models exist
if (class_exists('App\Models\User')) {
    echo "User model exists\n";
    $users = \App\Models\User::count();
    echo "Users in database: $users\n";
} else {
    echo "User model not found\n";
}

if (class_exists('App\Models\InventoryItem')) {
    echo "InventoryItem model exists\n";
    $items = \App\Models\InventoryItem::count();
    echo "Inventory items in database: $items\n";
} else {
    echo "InventoryItem model not found\n";
}

// Test basic database
try {
    $pdo = \Illuminate\Support\Facades\DB::connection()->getPdo();
    echo "Database connection: OK\n";
} catch (Exception $e) {
    echo "Database connection failed: " . $e->getMessage() . "\n";
}
