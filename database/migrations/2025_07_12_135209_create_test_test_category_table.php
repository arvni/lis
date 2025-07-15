<?php

use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Models\TestGroup;
use Database\Seeders\SyncTestAndTestGroupsSeeder;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('test_group_test'))
            Schema::create('test_group_test', function (Blueprint $table) {
                $table->foreignIdFor(Test::class)->constrained();
                $table->foreignIdFor(TestGroup::class)->constrained();
            });
        Artisan::call('db:seed', [
            '--class' => SyncTestAndTestGroupsSeeder::class,
            '--force' => true,
        ]);
        Schema::table('tests', function (Blueprint $table) {
            $table->dropConstrainedForeignIdFor(TestGroup::class);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table("tests", function (Blueprint $table) {
            $table->foreignIdFor(TestGroup::class)->nullable()->after("id");
            $table->foreign("test_group_id")->references("id")->on("test_groups")->onDelete("cascade");
        });
        Schema::dropIfExists('test_group_test');
    }
};
