<?php

use App\Domains\Notification\Enums\WhatsappMessageType;
use App\Domains\Notification\Enums\WhatsappMessageWritten;
use App\Domains\Notification\Models\WhatsappMessage;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('whatsapp_messages');
        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignIdFor(WhatsappMessage::class, "replied_to_id")->nullable();
            $table->nullableMorphs('messageable');
            $table->string("sid",255)->unique()->nullable();
            $table->string("waId");
            $table->enum("type", WhatsappMessageType::values());
            $table->enum("written", WhatsappMessageWritten::values());
            $table->json('data');
            $table->string('status');
            $table->timestamps();
            $table->foreign("replied_to_id")->references("id")->on("whatsapp_messages")->nullOnDelete();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_messages');
    }
};
