<?php

use App\Domains\Laboratory\Enums\OfferType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('type', OfferType::names());
            $table->decimal('amount', 8, 3)->default(0);
            $table->date("started_at")->nullable();
            $table->date("ended_at")->nullable();
            $table->boolean('active',)->default(true);
            $table->timestamps();
        });

        Schema::create("offer_test", function (Blueprint $table) {
            $table->id();
            $table->foreignId("offer_id")->constrained("offers");
            $table->foreignId("test_id")->constrained("tests");
        });

        Schema::create("offer_referrer", function (Blueprint $table) {
            $table->id();
            $table->foreignId("offer_id")->constrained("offers");
            $table->foreignId("referrer_id")->constrained("referrers");
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offer_test');
        Schema::dropIfExists('offer_referrer');
        Schema::dropIfExists('offers');
    }
};
