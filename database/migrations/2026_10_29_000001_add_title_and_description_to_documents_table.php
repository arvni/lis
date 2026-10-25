<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A name and details the uploader gives a file, shown instead of the bare file name. Optional:
 * existing documents and other uploads keep showing their original name.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('title', 150)->nullable()->after('originalName');
            $table->text('description')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['title', 'description']);
        });
    }
};
