<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Hot-column indexes surfaced by the performance pass (improvement-plan #12):
     * - samples.barcode: point-lookup on every barcode scan
     *   (Sample::where('barcode', ...)->first()), previously an unindexed full scan.
     * - acceptance_item_states(section_id, status): the section workflow dashboards
     *   filter/count states by section_id + status on every load
     *   (Section::{waiting,processing,finished,rejected}Items,
     *    AcceptanceItemStateRepository section/status filters). section_id alone was
     *   the FK index; the composite lets the status predicate use the index too.
     */
    public function up(): void
    {
        Schema::table('samples', function (Blueprint $table) {
            $table->index('barcode');
        });

        Schema::table('acceptance_item_states', function (Blueprint $table) {
            $table->index(['section_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('samples', function (Blueprint $table) {
            $table->dropIndex(['barcode']);
        });

        Schema::table('acceptance_item_states', function (Blueprint $table) {
            $table->dropIndex(['section_id', 'status']);
        });
    }
};
