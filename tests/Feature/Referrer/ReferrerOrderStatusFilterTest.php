<?php

declare(strict_types=1);

namespace Tests\Feature\Referrer;

use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Enums\ReferrerOrderStatus;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Repositories\ReferrerOrderRepository;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The referrer-order index gained a status filter alongside the existing search
 * (needed so "waiting for financial approval" orders can be pulled out).
 */
class ReferrerOrderStatusFilterTest extends TestCase
{
    use RefreshDatabase;

    private Referrer $referrer;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $registrar = User::factory()->create();

        $this->referrer = Referrer::create([
            'fullName' => 'Filter Referrer',
            'phoneNo' => '90000000',
            'email' => 'filter@example.com',
            'billingInfo' => [],
            'reportReceivers' => [],
        ]);

        $this->patient = Patient::create([
            'fullName' => 'Filter Patient',
            'idNo' => 'FLT-1',
            'registrar_id' => $registrar->id,
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
        ]);
    }

    private function makeOrder(string $orderId, ReferrerOrderStatus $status): ReferrerOrder
    {
        return ReferrerOrder::create([
            'referrer_id' => $this->referrer->id,
            'patient_id' => $this->patient->id,
            'order_id' => $orderId,
            'status' => $status->value,
            'orderInformation' => [],
        ]);
    }

    public function test_status_filter_narrows_the_listing(): void
    {
        $waitingForFinance = $this->makeOrder('RO-FIN', ReferrerOrderStatus::WAITING_FOR_FINANCIAL_APPROVAL);
        $this->makeOrder('RO-PROC', ReferrerOrderStatus::PROCESSING);
        $this->makeOrder('RO-REP', ReferrerOrderStatus::REPORTED);

        $result = app(ReferrerOrderRepository::class)->listReferrerOrder([
            'pageSize' => 10,
            'filters' => ['status' => [ReferrerOrderStatus::WAITING_FOR_FINANCIAL_APPROVAL->value]],
        ]);

        $this->assertCount(1, $result->items());
        $this->assertSame($waitingForFinance->id, $result->items()[0]->id);
    }

    public function test_status_filter_accepts_multiple_statuses(): void
    {
        $this->makeOrder('RO-FIN', ReferrerOrderStatus::WAITING_FOR_FINANCIAL_APPROVAL);
        $this->makeOrder('RO-PROC', ReferrerOrderStatus::PROCESSING);
        $this->makeOrder('RO-REP', ReferrerOrderStatus::REPORTED);

        $result = app(ReferrerOrderRepository::class)->listReferrerOrder([
            'pageSize' => 10,
            'filters' => [
                'status' => [
                    ReferrerOrderStatus::WAITING_FOR_FINANCIAL_APPROVAL->value,
                    ReferrerOrderStatus::REPORTED->value,
                ],
            ],
        ]);

        $this->assertCount(2, $result->items());
    }

    /**
     * A status that isn't part of the enum must not silently empty the listing.
     */
    public function test_unknown_status_values_are_ignored(): void
    {
        $this->makeOrder('RO-PROC', ReferrerOrderStatus::PROCESSING);

        $result = app(ReferrerOrderRepository::class)->listReferrerOrder([
            'pageSize' => 10,
            'filters' => ['status' => ['not-a-status']],
        ]);

        $this->assertCount(1, $result->items());
    }
}
