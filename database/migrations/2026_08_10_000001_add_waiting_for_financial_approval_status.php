<?php

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Referrer\Enums\ReferrerOrderStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Adds the "waiting for financial approval" status.
     *
     * `acceptances.status` is a plain string column so it only needs a backfill:
     * acceptances previously parked at "waiting for publishing" with finance not
     * yet approved are exactly the ones that now belong on the new status.
     * `referrer_orders.status` is an ENUM column, so it has to be widened first.
     */
    public function up(): void
    {
        DB::statement(
            'ALTER TABLE `referrer_orders` MODIFY `status` ENUM('
            ."'waiting','processing','waiting for financial approval','reported','downloaded'"
            .") NOT NULL DEFAULT 'waiting'"
        );

        DB::table('acceptances')
            ->where('status', AcceptanceStatus::WAITING_FOR_PUBLISHING->value)
            ->where('financial_approved', false)
            ->update(['status' => AcceptanceStatus::WAITING_FOR_FINANCIAL_APPROVAL->value]);

        // Mirror the backfill onto the linked referrer orders.
        DB::table('referrer_orders')
            ->whereIn('status', [
                ReferrerOrderStatus::WAITING->value,
                ReferrerOrderStatus::PROCESSING->value,
            ])
            ->whereIn('acceptance_id', function ($query) {
                $query->select('id')
                    ->from('acceptances')
                    ->where('status', AcceptanceStatus::WAITING_FOR_FINANCIAL_APPROVAL->value);
            })
            ->update(['status' => ReferrerOrderStatus::WAITING_FOR_FINANCIAL_APPROVAL->value]);
    }

    public function down(): void
    {
        DB::table('referrer_orders')
            ->where('status', ReferrerOrderStatus::WAITING_FOR_FINANCIAL_APPROVAL->value)
            ->update(['status' => ReferrerOrderStatus::PROCESSING->value]);

        DB::table('acceptances')
            ->where('status', AcceptanceStatus::WAITING_FOR_FINANCIAL_APPROVAL->value)
            ->update(['status' => AcceptanceStatus::WAITING_FOR_PUBLISHING->value]);

        DB::statement(
            'ALTER TABLE `referrer_orders` MODIFY `status` ENUM('
            ."'waiting','processing','reported','downloaded'"
            .") NOT NULL DEFAULT 'waiting'"
        );
    }
};
