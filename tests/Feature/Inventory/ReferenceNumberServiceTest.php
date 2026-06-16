<?php

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Enums\TransactionType;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Services\ReferenceNumberService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReferenceNumberServiceTest extends TestCase
{
    use RefreshDatabase;

    private ReferenceNumberService $service;
    private Store $store;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new ReferenceNumberService();
        $this->user = User::factory()->create();
        $this->store = Store::create(['name' => 'S', 'code' => 'S', 'is_active' => true]);
    }

    public function test_generates_first_reference_for_type_and_year(): void
    {
        $year = now()->year;
        $this->assertSame("ENT-{$year}-000001", $this->service->generate(TransactionType::ENTRY));
    }

    public function test_increments_within_same_type_and_year(): void
    {
        $year = now()->year;
        $this->makeTransaction("ENT-{$year}-000003");
        $this->assertSame("ENT-{$year}-000004", $this->service->generate(TransactionType::ENTRY));
    }

    public function test_sequences_isolated_per_type(): void
    {
        $year = now()->year;
        $this->makeTransaction("ENT-{$year}-000009");
        $this->assertSame("EXP-{$year}-000001", $this->service->generate(TransactionType::EXPORT));
    }

    private function makeTransaction(string $reference): StockTransaction
    {
        return StockTransaction::create([
            'transaction_type'     => TransactionType::ENTRY->value,
            'reference_number'     => $reference,
            'transaction_date'     => now()->toDateString(),
            'store_id'             => $this->store->id,
            'requested_by_user_id' => $this->user->id,
            'status'               => \App\Domains\Inventory\Enums\TransactionStatus::DRAFT->value,
        ]);
    }
}
