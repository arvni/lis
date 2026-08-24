<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\Repositories\DiscountUsageRepository;
use Illuminate\Support\Collection;

class DiscountUsageReportService
{
    /** Reports default to the current month rather than the whole ledger. */
    private const DEFAULT_MONTHS_BACK = 1;

    public function __construct(private readonly DiscountUsageRepository $usageRepository) {}

    /**
     * @return array{filters: array<string, mixed>, summary: array<string, mixed>, partners: Collection<int, \stdClass>, busiest_cards: Collection<int, \stdClass>}
     */
    public function report(array $filters): array
    {
        $filters = $this->withDefaults($filters);

        return [
            'filters' => $filters,
            'summary' => $this->usageRepository->summary($filters),
            'partners' => $this->usageRepository->byPartner($filters),
            'busiest_cards' => $this->usageRepository->busiestCards($filters),
        ];
    }

    /**
     * @return Collection<int, \stdClass>
     */
    public function rows(array $filters): Collection
    {
        return $this->usageRepository->rows($this->withDefaults($filters));
    }

    /**
     * @return array<string, mixed>
     */
    public function withDefaults(array $filters): array
    {
        return [
            'from_date' => $filters['from_date'] ?? now()->subMonths(self::DEFAULT_MONTHS_BACK)->toDateString(),
            'to_date' => $filters['to_date'] ?? now()->toDateString(),
            'discount_partner_id' => $filters['discount_partner_id'] ?? null,
        ];
    }
}
