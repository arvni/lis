<?php

use App\Domains\Referrer\Models\Material;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('samples', function (Blueprint $table) {
            $table->foreignIdFor(Material::class)->nullable()->after('id');
            $table->foreign('material_id')
                ->references('id')
                ->on('materials')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('samples', function (Blueprint $table) {
            $table->dropConstrainedForeignIdFor(Material::class);
        });
    }
};
