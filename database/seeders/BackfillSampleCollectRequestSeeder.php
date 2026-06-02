<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seed samples.collect_request_id from the existing referrer_orders.collect_request_id.
 *
 * referrer_orders link to an acceptance; samples link to that acceptance's items via
 * acceptance_item_samples. We copy the CR onto the samples in two passes:
 *   Pass A — acceptances whose referrer orders all share ONE collect_request_id: fill
 *            every sample of the acceptance (safe, no ambiguity).
 *   Pass B — acceptances with multiple distinct collect_request_ids (pooling/multi-order):
 *            match precisely by barcode (orderInformation.samples[].sampleId == samples.barcode),
 *            constrained to that acceptance, so we never mis-assign.
 *
 * Only NULL samples are touched, so this is safe to re-run alongside the live write path
 * (StoreReferrerOrderSamplesController) without clobbering values it has already set.
 */
class BackfillSampleCollectRequestSeeder extends Seeder
{
    public function run(): void
    {
        $before = DB::table('samples')->whereNull('collect_request_id')->count();
        $this->command->info("Samples without a collect_request_id before backfill: {$before}");

        // Pass A: unambiguous acceptances (single distinct CR across their referrer orders).
        $passA = DB::affectingStatement(<<<'SQL'
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

        $this->command->info("Pass A (unambiguous acceptances): {$passA} samples linked.");

        // Pass B: ambiguous acceptances — assign per-sample by barcode.
        $ambiguous = DB::table('referrer_orders')
            ->whereNotNull('collect_request_id')
            ->whereNotNull('acceptance_id')
            ->groupBy('acceptance_id')
            ->havingRaw('COUNT(DISTINCT collect_request_id) > 1')
            ->pluck('acceptance_id')
            ->all();

        $passB = 0;

        if (!empty($ambiguous)) {
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

                $passB += DB::table('samples')
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

        $this->command->info("Pass B (ambiguous/pooling acceptances): {$passB} samples linked by barcode.");

        $after = DB::table('samples')->whereNull('collect_request_id')->count();
        $this->command->info("Done. Linked " . ($passA + $passB) . " samples; {$after} still without a collect_request_id (no related referrer order).");
    }
}
