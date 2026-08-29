<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {

            // =========================
            // CITY (avoid duplicate)
            // =========================
            $cityId = DB::table('cities')->updateOrInsert(
                ['name' => 'Adama'],
                [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // get actual ID
            $cityId = DB::table('cities')->where('name', 'Adama')->value('id');

            // =========================
            // DATA
            // =========================
            $data = [
                'Abbaa Gadaa' => ['Badhaatuu','Dagaagaa','Odaa'],
                'Boolee' => ['Gooroo','Dhakaa Adii','Dhaddacha Araaraa','Andoodee'],
                'Daabee' => ['Caffee','Hangaatuu','Solloqqee Dongorree'],
                'Bokkuu Shanan' => ['Haroorettii','Torban Oboo','Hawaash Malkaa Sa’aa'],
                'Luugoo' => ['Barreechaa','Migiraa','Dirree Nagaa'],
                'Dambalaa' => ['Irreecha','Malkaa Adaamaa','Wanjii'],
            ];

            foreach ($data as $subcityName => $woredas) {

                // =========================
                // SUBCITY (avoid duplicate)
                // =========================
                DB::table('subcities')->updateOrInsert(
                    [
                        'name' => $subcityName,
                        'city_id' => $cityId
                    ],
                    [
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );

                $subcityId = DB::table('subcities')
                    ->where('name', $subcityName)
                    ->where('city_id', $cityId)
                    ->value('id');

                // =========================
                // WOREDAS
                // =========================
                foreach ($woredas as $woredaName) {
                    DB::table('woredas')->updateOrInsert(
                        [
                            'name' => $woredaName,
                            'subcity_id' => $subcityId
                        ],
                        [
                            'updated_at' => now(),
                            'created_at' => now(),
                        ]
                    );
                }
            }
        });
    }
}