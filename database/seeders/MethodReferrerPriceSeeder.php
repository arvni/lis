<?php

namespace Database\Seeders;

use App\Domains\Laboratory\Models\Method;
use Illuminate\Database\Seeder;

class MethodReferrerPriceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Method::query()->chunk(100,function ($methods){
            foreach ($methods as $method){
                $method->referrer_price=$method->price;
                $method->referrer_price_type=$method->price_type;
                $method->referrer_extra=$method->extra;
                $method->save();
            }
        });
    }
}
