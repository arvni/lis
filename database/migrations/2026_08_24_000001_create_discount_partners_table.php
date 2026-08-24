<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discount_partners', function (Blueprint $table) {
            $table->id();
            // The contracting company whose card holders get the discount.
            $table->string('name');
            $table->string('contract_no')->nullable();
            // {person, phone, email, address}
            $table->json('contact')->nullable();
            $table->date('starts_at')->nullable();
            $table->date('ends_at')->nullable();
            $table->boolean('active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['active', 'starts_at', 'ends_at'], 'discount_partners_validity_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_partners');
    }
};
