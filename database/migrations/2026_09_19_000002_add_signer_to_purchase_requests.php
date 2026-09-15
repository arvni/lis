<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The user who signs the purchase order: chosen at "Issue PO", and whose
        // signature and stamp are printed on it.
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->foreignId('signer_user_id')->nullable()->after('po_file')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('signer_user_id');
        });
    }
};
