<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill samples.collect_request_id from the existing referrer_orders.collect_request_id.
 *
 * referrer_orders link to an acceptance; samples link to that acceptance's items via
 * acceptance_item_samples. We copy the CR onto the samples in two passes:
 *   Pass A — acceptances whose referrer orders all share ONE collect_request_id: fill
 *            every sample of the acceptance (safe, no ambiguity).
 *   Pass B — acceptances with multiple distinct collect_request_ids (pooling/multi-order):
 *            match precisely by barcode (orderInformation.samples[].sampleId == samples.barcode),
 *            constrained to that acceptance, so we never mis-assign.
 *
 * Only NULL samples are touched, so this is safe to run after the new write path is live.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Pass A: unambiguous acceptances (single distinct CR across their referrer orders).
        DB::statement(<<<'SQL'
            UPDATE samples s
            JOIN acceptance_item_samples ais ON ais.sample_id = s.id
            JOIN acceptance_items ai ON ai.id = ais.acceptance_item_id
            JOIN (
                SELECT acceptance_id, MAX(collect_request_id) AS cr
                FROM referrer_orders
                WHERE collect_request_id IS NOT NULL AND acceptance_id IS NOT NULL
                GROUP BY acceptance_id
                HAVING COUNT(DISTINCT collect_request_id) = 1
            ) ro ON ro.acceptance_id = ai.acceptance_id
            SET s.collect_request_id = ro.cr
            WHERE s.collect_request_id IS NULL
        SQL);

        // Pass B: ambiguous acceptances — assign per-sample by barcode.
        $ambiguous = DB::table('referrer_orders')
            ->whereNotNull('collect_request_id')
            ->whereNotNull('acceptance_id')
            ->groupBy('acceptance_id')
            ->havingRaw('COUNT(DISTINCT collect_request_id) > 1')
            ->pluck('acceptance_id')
            ->all();

        if (empty($ambiguous)) {
            return;
        }

        $referrerOrders = DB::table('referrer_orders')
            ->whereIn('acceptance_id', $ambiguous)
            ->whereNotNull('collect_request_id')
            ->select('acceptance_id', 'collect_request_id', 'orderInformation')
            ->orderBy('id')
            ->get();

        foreach ($referrerOrders as $ro) {
            $info = json_decode($ro->orderInformation ?? '', true);
            $barcodes = [];
            foreach ($info['samples'] ?? [] as $sample) {
                if (!empty($sample['sampleId'])) {
                    $barcodes[] = $sample['sampleId'];
                }
            }
            if (empty($barcodes)) {
                continue;
            }

            DB::table('samples')
                ->whereIn('barcode', $barcodes)
                ->whereNull('collect_request_id')
                ->whereExists(function ($query) use ($ro) {
                    $query->select(DB::raw(1))
                        ->from('acceptance_item_samples as ais')
                        ->join('acceptance_items as ai', 'ai.id', '=', 'ais.acceptance_item_id')
                        ->whereColumn('ais.sample_id', 'samples.id')
                        ->where('ai.acceptance_id', $ro->acceptance_id);
                })
                ->update(['collect_request_id' => $ro->collect_request_id]);
        }
    }

    public function down(): void
    {
        // Irreversible data backfill: leave samples.collect_request_id as-is on rollback,
        // since the new write path may have set values we must not clobber.
    }
};
