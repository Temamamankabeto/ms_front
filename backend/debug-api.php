<?php

require __DIR__.'/vendor/autoload.php';

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\InventoryItem;
use Illuminate\Support\Facades\DB;

// Test basic Laravel functionality
echo "Testing Laravel API...\n";

try {
    // Test database connection
    echo "Database connection: " . (DB::connection()->getPdo() ? "OK" : "FAILED") . "\n";
    
    // Test user authentication
    $user = User::where('email', 'admin@restaurant.local')->first();
    echo "Admin user found: " . ($user ? "YES" : "NO") . "\n";
    
    if ($user) {
        $token = $user->createToken('test-token')->plainTextToken;
        echo "Token created: " . substr($token, 0, 20) . "...\n";
        
        // Test inventory creation manually
        try {
            $inventory = new InventoryItem([
                'name' => 'Test Item',
                'unit' => 'pcs',
                'current_stock' => 100,
                'minimum_quantity' => 10,
                'average_purchase_price' => 50.00
            ]);
            
            $inventory->save();
            echo "Inventory item created: ID " . $inventory->id . "\n";
            
            // Clean up
            $inventory->delete();
            echo "Inventory item deleted\n";
            
        } catch (Exception $e) {
            echo "Inventory creation error: " . $e->getMessage() . "\n";
            echo "Stack trace: " . $e->getTraceAsString() . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "General error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\nTesting complete.\n";
