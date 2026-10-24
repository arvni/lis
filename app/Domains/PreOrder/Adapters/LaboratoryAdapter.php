<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Adapters;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Repositories\TestRepository;
use App\Domains\Referrer\Repositories\ReferrerTestRepository;

/**
 * The PreOrder domain's view of the test catalogue: which tests take pre-orders, their flow,
 * and what a line costs a given center.
 */
class LaboratoryAdapter
{
    public function __construct(
        private readonly TestRepository $testRepository,
        private readonly ReferrerTestRepository $referrerTestRepository,
    ) {}

    public function findTest(int $id): ?Test
    {
        return $this->testRepository->findTestById($id);
    }

    public function flowIdOf(Test $test): ?int
    {
        return $test->flow_id;
    }

    /** A test that only rides along (e.g. a parental karyotype) can't set the flow. */
    public function canBeMain(Test $test): bool
    {
        return (bool) ($test->preorder['can_be_main'] ?? true);
    }

    /**
     * The catalogue price for this center: its referrer price when one is set, otherwise the
     * list price. Only fixed prices are used; formula and conditional prices need the
     * quotation editor (phase 2), so they stay null here rather than guessed.
     */
    public function unitPrice(Test $test, int $referrerId): ?string
    {
        $referrerTest = $this->referrerTestRepository->findByReferrerIdAndTestId($referrerId, $test->id);
        if ($referrerTest && $referrerTest->price_type === MethodPriceType::FIX->value && $referrerTest->price !== null) {
            return (string) $referrerTest->price;
        }

        if ($test->price_type === MethodPriceType::FIX && $test->price !== null) {
            return (string) $test->price;
        }

        return null;
    }
}
