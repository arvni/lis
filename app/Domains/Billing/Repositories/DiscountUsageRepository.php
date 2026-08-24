<?php

declare(strict_types=1);

namespace App\Domains\Billing\Repositories;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Read-side of the redemption ledger.
 *
 * Nobody is billed for these discounts — the lab absorbs them — so this answers
 * "what did we give away, to whom" and "is any one card being hammered", not
 * "what does the partner owe us".
 */
class DiscountUsageRepository
{
    /**
     * @return array{total_amount: float, visits: int, items: int, cards_used: int, partners: int}
     */
    public function summary(array $filters): array
    {
        $row = $this->baseQuery($filters)
            ->selectRaw('
                COALESCE(SUM(r.amount), 0) AS total_amount,
                COUNT(DISTINCT r.acceptance_id) AS visits,
                COUNT(*) AS items,
                COUNT(DISTINCT r.discount_card_id) AS cards_used,
                COUNT(DISTINCT c.discount_partner_id) AS partners
            ')
            ->first();

        return [
            'total_amount' => (float) ($row->total_amount ?? 0),
            'visits' => (int) ($row->visits ?? 0),
            'items' => (int) ($row->items ?? 0),
            'cards_used' => (int) ($row->cards_used ?? 0),
            'partners' => (int) ($row->partners ?? 0),
        ];
    }

    /**
     * @return Collection<int, \stdClass>
     */
    public function byPartner(array $filters): Collection
    {
        return $this->baseQuery($filters)
            ->selectRaw('
                p.id AS partner_id,
                p.name AS partner_name,
                COUNT(DISTINCT r.discount_card_id) AS cards_used,
                COUNT(DISTINCT r.acceptance_id) AS visits,
                COUNT(*) AS items,
                COALESCE(SUM(r.amount), 0) AS total_amount
            ')
            ->groupBy('p.id', 'p.name')
            ->orderByDesc('total_amount')
            ->get();
    }

    /**
     * The cards working hardest. A bearer card that has been photographed and
     * passed around shows up here long before anyone reports it.
     *
     * @return Collection<int, \stdClass>
     */
    public function busiestCards(array $filters, int $limit = 10): Collection
    {
        return $this->baseQuery($filters)
            ->selectRaw('
                c.id AS card_id,
                c.number AS card_number,
                c.usage_limit AS usage_limit,
                p.name AS partner_name,
                COUNT(DISTINCT r.acceptance_id) AS visits,
                COALESCE(SUM(r.amount), 0) AS total_amount
            ')
            ->groupBy('c.id', 'c.number', 'c.usage_limit', 'p.name')
            ->orderByDesc('visits')
            ->limit($limit)
            ->get();
    }

    /**
     * Line-level rows for the export. Deliberately carries no patient identity:
     * this is a finance report, and a bearer card never identified a patient anyway.
     *
     * @return Collection<int, \stdClass>
     */
    public function rows(array $filters): Collection
    {
        return $this->baseQuery($filters)
            ->join('acceptances AS a', 'a.id', '=', 'r.acceptance_id')
            ->leftJoin('offers AS o', 'o.id', '=', 'r.offer_id')
            ->leftJoin('acceptance_items AS ai', 'ai.id', '=', 'r.acceptance_item_id')
            ->leftJoin('method_tests AS mt', 'mt.id', '=', 'ai.method_test_id')
            ->leftJoin('tests AS t', 't.id', '=', 'mt.test_id')
            ->selectRaw('
                r.applied_at,
                p.name AS partner_name,
                c.number AS card_number,
                a.id AS acceptance_id,
                a.referenceCode AS reference_code,
                t.fullName AS test_name,
                o.title AS offer_title,
                r.amount
            ')
            ->orderBy('r.applied_at')
            ->get();
    }

    /**
     * Live redemptions only — a reverted one gave nothing away.
     */
    private function baseQuery(array $filters): Builder
    {
        $query = DB::table('discount_card_redemptions AS r')
            ->join('discount_cards AS c', 'c.id', '=', 'r.discount_card_id')
            ->join('discount_partners AS p', 'p.id', '=', 'c.discount_partner_id')
            ->whereNull('r.reverted_at');

        if (! empty($filters['from_date'])) {
            $query->whereDate('r.applied_at', '>=', $filters['from_date']);
        }
        if (! empty($filters['to_date'])) {
            $query->whereDate('r.applied_at', '<=', $filters['to_date']);
        }
        if (! empty($filters['discount_partner_id'])) {
            $query->where('c.discount_partner_id', $filters['discount_partner_id']);
        }

        return $query;
    }
}
