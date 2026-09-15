<?php

declare(strict_types=1);

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\PurchaseRequestStatus;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Services\PurchaseOrderNumberService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class PurchaseOrderNumberServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(Carbon::create(2026, 5, 4));
    }

    public function test_the_first_number_of_the_year_is_one(): void
    {
        $this->assertSame('PO-2026-0001', $this->next());
    }

    public function test_it_continues_after_the_highest_number_of_the_year(): void
    {
        $this->makeOrderedRequest('PO-2026-0010');
        $this->makeOrderedRequest('PO-2026-0009');
        $this->makeOrderedRequest('PO-2025-0044');

        $this->assertSame('PO-2026-0011', $this->next());
    }

    public function test_counting_restarts_in_a_new_year(): void
    {
        $this->makeOrderedRequest('PO-2026-0120');
        $this->travelTo(Carbon::create(2027, 1, 1));

        $this->assertSame('PO-2027-0001', $this->next());
    }

    public function test_hand_typed_numbers_without_a_numeric_suffix_are_ignored(): void
    {
        $this->makeOrderedRequest('PO-2026-0003');
        $this->makeOrderedRequest('PO-2026-LSC-88');
        $this->makeOrderedRequest('SUP/2026/991');

        $this->assertSame('PO-2026-0004', $this->next());
    }

    public function test_it_keeps_counting_past_four_digits(): void
    {
        $this->makeOrderedRequest('PO-2026-9999');

        $this->assertSame('PO-2026-10000', $this->next());
    }

    private function next(): string
    {
        return app(PurchaseOrderNumberService::class)->next();
    }

    private function makeOrderedRequest(string $poNumber): PurchaseRequest
    {
        return PurchaseRequest::create([
            'requested_by_user_id' => User::factory()->create()->id,
            'urgency' => 'NORMAL',
            'status' => PurchaseRequestStatus::ORDERED->value,
            'po_number' => $poNumber,
        ]);
    }
}
