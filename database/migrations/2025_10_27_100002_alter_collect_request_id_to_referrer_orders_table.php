<?php

use App\Domains\Referrer\Models\CollectRequest;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('referrer_orders', function (Blueprint $table) {
            $table->foreignIdFor(CollectRequest::class)->nullable()->after('referrer_id')->constrained()->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('referrer_orders', function (Blueprint $table) {
            $table->dropForeign(['collect_request_id']);
            $table->dropColumn('collect_request_id');
        });
    }
};
