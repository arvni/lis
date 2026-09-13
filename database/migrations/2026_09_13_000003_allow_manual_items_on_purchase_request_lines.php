<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A purchase request can ask for something that isn't in the item catalogue yet:
        // the line then carries only a typed name, and is linked to a real item when the
        // goods are received (a stock entry always needs one).
        Schema::table('purchase_request_lines', function (Blueprint $table) {
            $table->dropForeign(['item_id']);
        });
        Schema::table('purchase_request_lines', function (Blueprint $table) {
            $table->unsignedBigInteger('item_id')->nullable()->change();
            $table->foreign('item_id')->references('id')->on('items')->restrictOnDelete();
            $table->string('item_name')->nullable()->after('item_id');
        });
    }

    public function down(): void
    {
        // Restoring NOT NULL fails while unlinked manual lines exist — on purpose, so a
        // rollback can't silently throw requested items away. Link or delete them first.
        Schema::table('purchase_request_lines', function (Blueprint $table) {
            $table->dropForeign(['item_id']);
        });
        Schema::table('purchase_request_lines', function (Blueprint $table) {
            $table->unsignedBigInteger('item_id')->nullable(false)->change();
            $table->foreign('item_id')->references('id')->on('items')->restrictOnDelete();
            $table->dropColumn('item_name');
        });
    }
};
