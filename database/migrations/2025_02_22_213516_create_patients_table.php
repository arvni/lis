<?php

use App\Domains\User\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(User::class, 'registrar_id')->constrained('users')->restrictOnDelete();
            $table->string('fullName');
            $table->string('tribe')->nullable();
            $table->string('idNo')->nullable()->unique();
            $table->string('nationality');
            $table->string('wilayat')->nullable();
            $table->string('village')->nullable();
            $table->date('dateOfBirth');
            $table->enum('gender', ['male', 'female', 'unknown'])->nullable();
            $table->string('phone')->nullable();
            $table->text('avatar')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
