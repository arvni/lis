<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Widen the enum so both old and new values are valid during the data move.
        DB::statement("ALTER TABLE patients MODIFY gender ENUM('male','female','unknown','ambiguous','none') NULL");
        // Existing 'Other' patients become 'ambiguous'.
        DB::statement("UPDATE patients SET gender = 'ambiguous' WHERE gender = 'unknown'");
        // Drop the legacy 'unknown' value.
        DB::statement("ALTER TABLE patients MODIFY gender ENUM('male','female','ambiguous','none') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE patients MODIFY gender ENUM('male','female','unknown','ambiguous','none') NULL");
        DB::statement("UPDATE patients SET gender = 'unknown' WHERE gender IN ('ambiguous','none')");
        DB::statement("ALTER TABLE patients MODIFY gender ENUM('male','female','unknown') NULL");
    }
};
