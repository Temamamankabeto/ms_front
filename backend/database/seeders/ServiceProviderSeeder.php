<?php

namespace Database\Seeders;

use App\Models\ServiceProvider;
use Illuminate\Database\Seeder;

class ServiceProviderSeeder extends Seeder
{
    public function run(): void
    {
        $providers = [
            'Mayor Office',
            'Municipality Office',
            'Finance Office',
            'Revenue Authority',
            'Land Management Office',
            'Trade & Industry Office',
            'Health Office',
            'Education Office',
            'Agriculture Office',
            'Women & Children Affairs Office',
            'Civil Service Office',
            'ICT Office',
            'Water & Sewerage Office',
            'Planning & Development Office',
            'Environmental Protection Office',
            'Peace & Security Office',
            'Court and Justice Offices',
            'Police Commission',
            'Fire & Emergency Office',
            'Culture & Tourism Office',
            'Youth & Sports Office',
            'Procurement & Property Administration Office',
            'Records & Archives Office',
            'Public Service & Human Resource Office',
        ];

        foreach ($providers as $name) {
            ServiceProvider::firstOrCreate(['name' => $name]);
        }
    }
}
