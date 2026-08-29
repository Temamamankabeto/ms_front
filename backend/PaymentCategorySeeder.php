<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentCategory;

class PaymentCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Salary',
            'Allowance',
            'Procurement',
            'Operational',
            'Utility',
            'Training',
            'Transport',
            'Maintenance',
            'Professional Service',
            'Grant',
            'Compensation',
            'Financial Charge',
        ];

        foreach ($categories as $name) {
            PaymentCategory::updateOrCreate(
                ['name' => $name],
                ['name' => $name]
            );
        }
    }
}