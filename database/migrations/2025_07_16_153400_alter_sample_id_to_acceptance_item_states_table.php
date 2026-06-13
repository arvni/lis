<?php

use App\Domains\Reception\Models\Sample;
use Database\Seeders\AddSampleToAcceptanceItemStatesTableSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn("acceptance_item_states", "sample_id")) {
            Schema::table('acceptance_item_states', function (Blueprint $table) {

                $table->foreignIdFor(Sample::class)->nullable()->after('section_id');
                $table->foreign("sample_id")->references("id")->on("samples");

            });

            // Backfill only when there is data; on a fresh install the table is
            // empty and the seeder's model query would reference the deleted_at
            // column, which is only added by a later migration.
            if (DB::table('acceptance_item_states')->exists()) {
                Artisan::call('db:seed', [
                    '--class' => AddSampleToAcceptanceItemStatesTableSeeder::class,
                    '--force' => true,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('acceptance_item_states', function (Blueprint $table) {
            $table->dropConstrainedForeignIdFor(Sample::class);
        });
    }
};
