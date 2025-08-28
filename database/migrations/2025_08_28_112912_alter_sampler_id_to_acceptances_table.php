<?php

use App\Domains\User\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('acceptances', function (Blueprint $table) {
            $table->foreignIdFor(User::class, "sampler_id")->after("referrer_id")->nullable()->constrained();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('acceptances', function (Blueprint $table) {
            $table->dropConstrainedForeignIdFor(User::class,"sampler_id");
        });
    }
};
