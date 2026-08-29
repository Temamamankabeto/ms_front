<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Feedback;
use App\Models\Service;
use Faker\Factory as Faker;

class FeedbackSeeder extends Seeder
{

    public function run(): void
    {

        $faker = Faker::create();


        /*
        |--------------------------------------------------------------------------
        | Get Existing Services
        |--------------------------------------------------------------------------
        */

        $services = Service::where('status','active')
            ->get();



        if($services->count() == 0)
        {
            return;
        }



        /*
        |--------------------------------------------------------------------------
        | Generate Feedback
        |--------------------------------------------------------------------------
        */

        foreach($services as $service)
        {


            for($i = 1; $i <= 50; $i++)
            {


                $satisfaction = $faker->randomElement([

                    'highly_satisfied',

                    'satisfied',

                    'not_satisfied',

                ]);



                Feedback::create([


                    'service_id' => $service->id,



                    'satisfaction' => $satisfaction,



                    'overall_rating' => match($satisfaction)
                    {

                        'highly_satisfied'
                        => $faker->numberBetween(4,5),


                        'satisfied'
                        => $faker->numberBetween(3,4),


                        'not_satisfied'
                        => $faker->numberBetween(1,2),

                    },



                    'staff_behavior'
                    => $faker->numberBetween(1,5),



                    'waiting_time'
                    => $faker->numberBetween(1,5),



                    'service_quality'
                    => $faker->numberBetween(1,5),



                    'cleanliness'
                    => $faker->numberBetween(1,5),



                    'comment'
                    => $faker->optional()->sentence(),



                    'gender'
                    => $faker->randomElement([
                        'male',
                        'female'
                    ]),



                    'age'
                    => $faker->numberBetween(
                        18,
                        70
                    ),



                    'ip_address'
                    => $faker->ipv4(),



                    'user_agent'
                    => $faker->userAgent(),



                    'device'
                    => $faker->randomElement([

                        'mobile',

                        'desktop',

                        'tablet'

                    ]),


                ]);


            }


        }


    }

}
