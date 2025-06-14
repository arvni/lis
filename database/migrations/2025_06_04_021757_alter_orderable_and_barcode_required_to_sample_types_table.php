<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sample_types', function (Blueprint $table) {
            $table->boolean("orderable")->default(false)->after('description');
            $table->boolean("required_barcode")->default(false)->after('orderable');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sample_types', function (Blueprint $table) {
            $table->dropColumn("orderable");
            $table->dropColumn("required_barcode");
        });
    }
};
