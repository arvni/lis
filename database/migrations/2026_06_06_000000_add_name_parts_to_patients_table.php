<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->string('firstName')->nullable()->after('fullName');
            $table->string('secondName')->nullable()->after('firstName');
            $table->string('thirdName')->nullable()->after('secondName');
            $table->string('lastName')->nullable()->after('thirdName');
        });

        // Best-effort backfill: split the existing fullName on whitespace.
        DB::table('patients')
            ->select('id', 'fullName')
            ->orderBy('id')
            ->chunk(500, function ($patients) {
                foreach ($patients as $patient) {
                    $parts = preg_split('/\s+/', trim((string) $patient->fullName), -1, PREG_SPLIT_NO_EMPTY) ?: [];
                    if (!$parts) {
                        continue;
                    }

                    $firstName = array_shift($parts);
                    $lastName = count($parts) ? array_pop($parts) : null;
                    $secondName = count($parts) ? array_shift($parts) : null;
                    $thirdName = count($parts) ? implode(' ', $parts) : null;

                    DB::table('patients')->where('id', $patient->id)->update([
                        'firstName' => $firstName,
                        'secondName' => $secondName,
                        'thirdName' => $thirdName,
                        'lastName' => $lastName,
                    ]);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn(['firstName', 'secondName', 'thirdName', 'lastName']);
        });
    }
};
