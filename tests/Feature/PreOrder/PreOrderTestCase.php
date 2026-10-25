<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\PreOrder\DTOs\Actor;
use App\Domains\PreOrder\DTOs\CreatePreOrderDTO;
use App\Domains\PreOrder\Events\PreOrderActionProcessed;
use App\Domains\PreOrder\Events\PreOrderChanged;
use App\Domains\PreOrder\Events\QuotationSent;
use App\Domains\PreOrder\Models\Flow;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Services\PreOrderWorkflow;
use App\Domains\Referrer\Events\ReferrerOrderUpdated;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

/** Shared fixtures: a center, a counsellor, and tests switched on for the seeded flows. */
abstract class PreOrderTestCase extends TestCase
{
    use RefreshDatabase;

    protected PreOrderWorkflow $workflow;

    protected User $counsellor;

    protected int $referrerId;

    protected function setUp(): void
    {
        parent::setUp();
        // Webhooks and queued listeners are exercised in their own tests. Only these events are
        // faked: model events must still fire (spatie's permission cache relies on them).
        Event::fake([PreOrderChanged::class, PreOrderActionProcessed::class, ReferrerOrderUpdated::class, QuotationSent::class]);
        $this->workflow = app(PreOrderWorkflow::class);
        $this->counsellor = User::factory()->create(['name' => 'Dr Counsellor']);
        $this->referrerId = $this->referrer('Muscat IVF');
    }

    protected function referrer(string $name): int
    {
        return (int) DB::table('referrers')->insertGetId([
            'fullName' => $name,
            'email' => strtolower(str_replace(' ', '', $name)).'@example.test',
            'phoneNo' => '+96800000000',
            'billingInfo' => '{}',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /** A catalogue test; `$family` switches it on for pre-orders with that seeded flow. */
    protected function test(string $code, ?string $family = null, bool $canBeMain = true, float $price = 100): int
    {
        $flowId = $family ? Flow::query()->where('family', $family)->value('id') : null;

        return (int) DB::table('tests')->insertGetId([
            'name' => $code,
            'code' => $code,
            'fullName' => "$code full",
            'price' => $price,
            'price_type' => 'Fix',
            'flow_id' => $flowId,
            'preorder' => json_encode(['can_be_main' => $canBeMain]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    protected function bion(): Actor
    {
        return Actor::bion($this->counsellor);
    }

    protected function center(): Actor
    {
        return Actor::center('Center nurse');
    }

    /** @param  list<int>  $testIds */
    protected function draft(array $testIds = [], ?int $referrerId = null): PreOrder
    {
        return $this->workflow->createDraft($referrerId ?? $this->referrerId, CreatePreOrderDTO::fromArray([
            'start_mode' => $testIds ? 'tests' : 'describe',
            'referral_reason' => $testIds ? null : 'Recurrent miscarriage, couple wants advice',
            'patients' => [
                ['ref' => 'P1', 'fullName' => 'Mother Example', 'gender' => 'female'],
                ['ref' => 'P2', 'fullName' => 'Father Example', 'gender' => 'male', 'relationship' => 'spouse'],
            ],
            'tests' => array_map(fn (int $id) => ['test_id' => $id], $testIds),
        ]), $this->center());
    }

    /** A referrer order the center placed from the pre-order's release. */
    protected function linkedOrder(PreOrder $preOrder, string $status = 'waiting', bool $received = false, string $release = 'M1'): int
    {
        return (int) DB::table('referrer_orders')->insertGetId([
            'referrer_id' => $preOrder->referrer_id,
            'pre_order_id' => $preOrder->id,
            'order_id' => 'ORD-'.uniqid(),
            'orderInformation' => json_encode(['pre_order_release_key' => $preOrder->code.'-'.$release]),
            'status' => $status,
            'acceptance_id' => $received ? $this->acceptance() : null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function acceptance(): int
    {
        // Only its existence matters here (received = linked to an acceptance), so skip the patient graph.
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        $id = (int) DB::table('acceptances')->insertGetId([
            'acceptor_id' => $this->counsellor->id,
            'patient_id' => 999999,
            'status' => 'processing',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        return $id;
    }
}
