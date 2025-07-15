<?php

namespace Database\Seeders;

use App\Domains\Laboratory\Models\Test;
use Illuminate\Database\Seeder;

class SyncTestAndTestGroupsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tests=Test::with("testGroup")->get();

        foreach ($tests as $test) {
            $test->testGroups()->sync($test->testGroup->id);
        }

    }
}
