<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The note to the supplier entered at "Issue PO". The printed order shows it
        // instead of the request's own notes, which are internal.
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->text('po_notes')->nullable()->after('signer_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropColumn('po_notes');
        });
    }
};
