<?php

use App\Domains\Billing\Models\InvoiceItem;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('acceptance_items', function (Blueprint $table) {
            $table->foreignIdFor(InvoiceItem::class)->nullable()->after('panel_id')
                ->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('acceptance_items', function (Blueprint $table) {
            $table->dropConstrainedForeignIdFor(InvoiceItem::class);
        });
    }
};
