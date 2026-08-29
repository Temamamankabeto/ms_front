<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class WindowSeeder extends Seeder
{
    public function run(): void
    {
        $windows = [

            "Window 1",
            "Window 2",
            "Window 3",
            "Window 4",
            "Window 5",
            "Window 6",
            "Window 7",
            "Window 8",
            "Window 9",
            "Window 10",
            "Window 11",
            "Window 12",
        ];

        foreach ($windows as $window) {

            DB::table('windows')->updateOrInsert(

                [
                    'name' => $window,
                ],

                [
                    'availability' => json_encode([
                        'city',
                        'subcity',
                        'woreda',
                    ]),

                    'created_at' => now(),

                    'updated_at' => now(),
                ]
            );
        }
    }
}