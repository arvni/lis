<?php

namespace Database\Seeders;

use App\Domains\Reception\Models\AcceptanceItemState;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AddSampleToAcceptanceItemStatesTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $acceptanceItemStates = AcceptanceItemState::query()->with("acceptanceItem.activeSample")->get();
        DB::transaction(function () use ($acceptanceItemStates) {
            foreach ($acceptanceItemStates as $acceptanceItemState) {
                if($acceptanceItemState?->acceptanceItem?->activeSample?->id){
                    $acceptanceItemState->sample()->associate($acceptanceItemState->acceptanceItem->activeSample->id);
                    if ($acceptanceItemState->isDirty())
                        $acceptanceItemState->save();
                }
            }
        });
    }
}
