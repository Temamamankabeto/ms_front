<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | WINDOWS
        |--------------------------------------------------------------------------
        */

        $windows = DB::table('windows')
            ->pluck('id')
            ->toArray();

        /*
        |--------------------------------------------------------------------------
        | SERVICES
        |--------------------------------------------------------------------------
        */

        $services = [

            "Ragaa Kontraataa",
            "Galmee Hojii Gamtaa",
            "Haaromsaa Hojii Gamtaa",
            "Hayyama Hojii Gamtaa",
            "Ragaa Hojii Gamtaa",

            "Galmee Industirii",
            "Haaromsaa Industirii",
            "Hayyama Industirii",
            "Ragaa Industirii",

            "Galmee Misooma Qonnaa",
            "Haaromsaa Misooma Qonnaa",
            "Hayyama Misooma Qonnaa",
            "Ragaa Misooma Qonnaa",

            "Galmee Mana Barumsaa",
            "Haaromsaa Mana Barumsaa",
            "Hayyama Mana Barumsaa",

            "Galmee Turiizimii",
            "Haaromsaa Turiizimii",
            "Hayyama Turiizimii",

            "Galmee NGO",
            "Haaromsaa NGO",
            "Hayyama NGO",
        ];

        foreach ($services as $index => $serviceName) {

            /*
            |--------------------------------------------------------------------------
            | CREATE SERVICE
            |--------------------------------------------------------------------------
            */

            $serviceId = DB::table('services')
                ->updateOrInsert(

                    [
                        'name' => $serviceName,
                    ],

                    [
                        'has_back_officer' => true,

                        'service_fee' => 0,

                        'availability' => json_encode([
                            'city',
                            'subcity',
                            'woreda',
                        ]),

                        'status' => 'active',

                        'description' => null,

                        'created_at' => now(),

                        'updated_at' => now(),
                    ]
                );

            /*
            |--------------------------------------------------------------------------
            | GET SERVICE ID
            |--------------------------------------------------------------------------
            */

            $service = DB::table('services')
                ->where('name', $serviceName)
                ->first();

            /*
            |--------------------------------------------------------------------------
            | ASSIGN WINDOW
            |--------------------------------------------------------------------------
            */

            $windowId =
                $windows[
                    $index % count($windows)
                ];

            /*
            |--------------------------------------------------------------------------
            | INSERT PIVOT
            |--------------------------------------------------------------------------
            */

            DB::table('service_window')
                ->updateOrInsert(

                    [
                        'service_id' => $service->id,
                        'window_id' => $windowId,
                    ],

                    [
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
        }
    }
}