<?php

declare(strict_types=1);

namespace App\Domains\Billing\Adapters;

use App\Domains\Referrer\Repositories\ReferrerTestRepository;
use App\Domains\Shared\Helpers\PriceFormula;

/**
 * Adapter that translates between Billing and Referrer domains.
 *
 * A referrer's own price list can switch a test or panel to "combine on invoice"; Billing reads
 * only those choices through here, never the price rows themselves.
 */
class ReferrerAdapter
{
    public function __construct(private readonly ReferrerTestRepository $referrerTestRepository) {}

    /**
     * Whether each test's referrer price list switched on "combine on invoice": for the
     * test/panel as a whole and per method. Tests without a price list row for this referrer
     * are left out.
     *
     * @param  list<int>  $testIds
     * @return array<int, array{test: bool, methods: array<int, bool>}>
     */
    public function combineOnInvoiceChoices(int $referrerId, array $testIds): array
    {
        if ($testIds === []) {
            return [];
        }

        $choices = [];
        foreach ($this->referrerTestRepository->forReferrerAndTests($referrerId, $testIds) as $row) {
            $methods = [];
            foreach ((array) ($row->methods ?? []) as $entry) {
                if (is_array($entry) && isset($entry['method_id'])) {
                    $extra = $entry['extra'] ?? null;
                    $methods[(int) $entry['method_id']] = is_array($extra) && PriceFormula::combinesOnInvoice($extra);
                }
            }

            $choices[$row->test_id] = [
                'test' => is_array($row->extra) && PriceFormula::combinesOnInvoice($row->extra),
                'methods' => $methods,
            ];
        }

        return $choices;
    }
}
