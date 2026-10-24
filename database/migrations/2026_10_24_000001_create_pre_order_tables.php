<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pre-orders: one clinical request from a center that BION reviews before anything reaches the
 * lab, then releases as one or more ordinary referrer orders. The stage list itself is the
 * PreOrderStage enum, not a table; a flow only picks which of those stages a test family uses.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('flows', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Groups tests that share a flow: nipt, carrier, exome, familial, pgt_a, pgt_m.
            $table->string('family', 32);
            $table->boolean('active')->default(true);
            // One entry per library stage the flow uses, in library order:
            // {stage, mode (on|off|rule), rule?, label_en?, label_ar?, reminder_hours?, batch_mode?, center_can_close?}
            $table->json('stages');
            // Bumped on every publish. A pre-order copies stages when it starts, so open pre-orders
            // keep the version they began on without a separate versions table.
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();
        });

        Schema::create('pre_orders', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->foreignId('referrer_id')->constrained()->restrictOnDelete();
            // The counsellor who owns the test list from start to end.
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            // Null until BION picks the main test, which is what sets the flow.
            $table->foreignId('main_test_id')->nullable()->constrained('tests')->nullOnDelete();
            $table->foreignId('flow_id')->nullable()->constrained()->nullOnDelete();
            $table->json('flow_stages')->nullable();
            $table->unsignedInteger('flow_version')->nullable();

            $table->string('stage', 32);
            $table->string('action_owner', 8);
            $table->timestamp('stage_entered_at')->nullable();
            // An exception sits on top of the stage and never replaces it: {type, reason, comment, by, at}.
            $table->json('exception')->nullable();

            // How the center started: chose tests, or described the case and left the choice to BION.
            $table->string('start_mode', 16);
            $table->string('start_hint', 16)->nullable();
            $table->text('referral_reason')->nullable();
            // The center's patients as it sent them. LIS patient rows only exist once samples are
            // accepted, so each entry carries the center's reference and, later, patient_id.
            $table->json('patients');
            $table->string('main_patient_ref', 64)->nullable();
            $table->json('scope')->nullable();
            $table->json('clinical')->nullable();

            // The center user who created it, as named by the provider panel.
            $table->json('created_by')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            // Bumped on every change; the provider panel drops snapshots older than the one it has.
            $table->unsignedInteger('version')->default(1);
            $table->timestamps();

            $table->index(['stage', 'action_owner']);
            $table->index(['referrer_id', 'stage']);
        });

        Schema::create('pre_order_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_order_id')->constrained()->cascadeOnDelete();
            // R1, R2… per pre-order.
            $table->unsignedSmallInteger('number');
            // Any of: information, samples, test.
            $table->json('types');
            $table->string('reason', 64);
            $table->text('message');
            // {samples: [{patient_ref, sample_type, count}], documents: [tag…]}
            $table->json('needs')->nullable();
            $table->boolean('blocking')->default(false);
            $table->timestamp('due_at')->nullable();
            $table->string('status', 24);
            $table->text('answer')->nullable();
            $table->foreignId('raised_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('answered_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->unique(['pre_order_id', 'number']);
        });

        Schema::create('pre_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('test_id')->constrained()->restrictOnDelete();
            $table->string('patient_ref', 64)->nullable();
            $table->unsignedSmallInteger('qty')->default(1);
            // Priced from the catalogue when the line is added; never typed.
            $table->decimal('unit_price', 12, 3)->nullable();
            $table->string('added_by', 8);
            $table->string('status', 16);
            // The request that asked for this test, when it was added mid-flow.
            $table->foreignId('request_id')->nullable()->constrained('pre_order_requests')->nullOnDelete();
            // Set when the line is released to the lab: the provider-panel order key it was sent on.
            $table->string('release_key', 64)->nullable();
            $table->string('release_purpose', 16)->nullable();
            $table->timestamps();

            $table->index(['pre_order_id', 'status']);
        });

        Schema::create('pre_order_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pre_order_id')->constrained()->cascadeOnDelete();
            // stage, exception, decision, comment, request. Messages are comment rows.
            $table->string('type', 16);
            $table->string('from_stage', 32)->nullable();
            $table->string('to_stage', 32)->nullable();
            $table->text('body')->nullable();
            // Internal notes are BION-only and never leave the LIS.
            $table->boolean('internal')->default(false);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            // center or bion; a center actor has no LIS user, so their name is kept here.
            $table->string('side', 8);
            $table->string('actor_name')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['pre_order_id', 'created_at']);
        });

        // Written by the api app (the only service centers reach) and processed by the LIS.
        Schema::create('pre_order_actions', function (Blueprint $table) {
            $table->id();
            // Sent by the provider panel, so a retried action is applied once.
            $table->uuid('uuid')->unique();
            $table->foreignId('referrer_id')->constrained()->cascadeOnDelete();
            // Null for create, which has no pre-order yet.
            $table->foreignId('pre_order_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type', 32);
            $table->json('payload');
            // {user_id, name} of the provider-panel user.
            $table->json('actor');
            $table->string('status', 12)->default('pending');
            $table->text('error')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'id']);
        });

        Schema::table('tests', function (Blueprint $table) {
            // Null = not available for pre-orders; the test keeps direct ordering.
            $table->foreignId('flow_id')->nullable()->after('request_form_id')->constrained()->nullOnDelete();
        });

        Schema::table('referrer_orders', function (Blueprint $table) {
            $table->foreignId('pre_order_id')->nullable()->after('referrer_id')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('referrer_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pre_order_id');
        });
        Schema::table('tests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('flow_id');
        });
        Schema::dropIfExists('pre_order_actions');
        Schema::dropIfExists('pre_order_histories');
        Schema::dropIfExists('pre_order_items');
        Schema::dropIfExists('pre_order_requests');
        Schema::dropIfExists('pre_orders');
        Schema::dropIfExists('flows');
    }
};
