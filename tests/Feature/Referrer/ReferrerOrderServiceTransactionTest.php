<?php

declare(strict_types=1);

namespace Tests\Feature\Referrer;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Events\ReferrerOrderUpdated;
use App\Domains\Referrer\Models\CollectRequest;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use RuntimeException;
use Tests\TestCase;

/**
 * Pins the DB::transaction guarantees of ReferrerOrderService (quality-audit
 * item 2): updateExistingOrderForPooling writes the order's collect request
 * and resets the pooling flags atomically, and only notifies the provider
 * (ReferrerOrderUpdated → webhook) after the writes have committed.
 */
class ReferrerOrderServiceTransactionTest extends TestCase
{
    use RefreshDatabase;

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Referrer → Acceptance (with one pooling item) → ReferrerOrder chain plus
     * a CollectRequest not yet linked to the order.
     *
     * @return array{Acceptance, ReferrerOrder, CollectRequest, AcceptanceItem}
     */
    private function makeFixtures(): array
    {
        $user = User::factory()->create();

        $referrer = Referrer::create([
            'fullName'    => 'Pooling Referrer',
            'email'       => 'pool' . uniqid() . '@example.com',
            'phoneNo'     => '90000000',
            'billingInfo' => [],
        ]);

        $patient = Patient::create([
            'registrar_id' => $user->id,
            'fullName'     => 'Pooling Patient',
            'idNo'         => 'POOL' . uniqid(),
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
        ]);

        $acceptance = Acceptance::create([
            'acceptor_id'         => $user->id,
            'patient_id'          => $patient->id,
            'referrer_id'         => $referrer->id,
            'status'              => AcceptanceStatus::PROCESSING,
            'step'                => 5,
            'financial_approved'  => false,
            'out_patient'         => false,
            'waiting_for_pooling' => false,
        ]);

        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $this->getMethodTestId(),
            'price'            => 100,
            'discount'         => 0,
            'reportless'       => true,
            'sampleless'       => true,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
            'is_pooling'       => true,
        ]);

        $collectRequest = CollectRequest::create([
            'referrer_id' => $referrer->id,
            'status'      => 'pending',
            'barcode'     => 'POOL-BC-' . uniqid(),
        ]);

        $order = ReferrerOrder::create([
            'referrer_id'      => $referrer->id,
            'acceptance_id'    => $acceptance->id,
            'patient_id'       => $patient->id,
            'order_id'         => 'RO-' . uniqid(),
            'orderInformation' => ['status' => 'processing'],
            'status'           => 'processing',
            'pooling'          => false,
        ]);

        return [$acceptance, $order, $collectRequest, $item];
    }

    /**
     * Return a valid method_test_id, creating the minimal supporting chain
     * (test → method → method_test) if needed.
     */
    private function getMethodTestId(): int
    {
        $existing = DB::table('method_tests')->first();
        if ($existing) {
            return (int) $existing->id;
        }

        $testId = DB::table('tests')->insertGetId([
            'name' => 'Test ROX',
            'code' => 'ROX1',
            'fullName' => 'Test ROX',
            'type' => 'TEST',
            'status' => 1,
            'can_merge' => 0,
            'price_type' => 'Fix',
            'price' => 100,
            'referrer_price_type' => 'Fix',
            'referrer_price' => 100,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $methodId = DB::table('methods')->insertGetId([
            'name' => 'Method ROX',
            'turnaround_time' => 1,
            'price' => 100,
            'referrer_price' => 100,
            'price_type' => 'Fix',
            'referrer_price_type' => 'Fix',
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return DB::table('method_tests')->insertGetId([
            'test_id' => $testId,
            'method_id' => $methodId,
            'is_default' => 1,
            'status' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // updateExistingOrderForPooling
    // ─────────────────────────────────────────────────────────────────────────

    public function test_pooling_update_commits_writes_and_dispatches_event_after(): void
    {
        Event::fake([ReferrerOrderUpdated::class]);

        [$acceptance, $order, $collectRequest, $item] = $this->makeFixtures();

        $result = app(ReferrerOrderService::class)
            ->updateExistingOrderForPooling($acceptance, $collectRequest->id);

        $this->assertNotNull($result);
        $this->assertSame($collectRequest->id, (int) $order->fresh()->collect_request_id);
        $this->assertFalse((bool) $item->fresh()->is_pooling);
        Event::assertDispatched(ReferrerOrderUpdated::class);
    }

    public function test_pooling_update_rolls_back_and_skips_webhook_when_the_order_write_fails(): void
    {
        Event::fake([ReferrerOrderUpdated::class]);

        [$acceptance, $order, $collectRequest, $item] = $this->makeFixtures();

        // Fires inside the transaction, right after the order row is updated —
        // without the transaction the collect_request_id would already be
        // committed (autocommit) and survive the failure.
        Event::listen('eloquent.updated: ' . ReferrerOrder::class, function (): void {
            throw new RuntimeException('order write failed');
        });

        try {
            app(ReferrerOrderService::class)
                ->updateExistingOrderForPooling($acceptance, $collectRequest->id);
            $this->fail('updateExistingOrderForPooling should have thrown');
        } catch (RuntimeException) {
            // expected
        }

        $this->assertNull($order->fresh()->collect_request_id);
        $this->assertTrue((bool) $item->fresh()->is_pooling);
        Event::assertNotDispatched(ReferrerOrderUpdated::class);
    }
}
