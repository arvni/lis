<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\PreOrder\Enums\ActionStatus;
use App\Domains\PreOrder\Events\PreOrderActionProcessed;
use App\Domains\PreOrder\Events\PreOrderChanged;
use App\Domains\PreOrder\Listeners\SendPreOrderActionResultWebhook;
use App\Domains\PreOrder\Listeners\SendPreOrderSnapshotWebhook;
use App\Domains\PreOrder\Listeners\SyncPreOrderFromReferrerOrder;
use App\Domains\PreOrder\Models\PreOrderAction;
use App\Domains\Referrer\Events\ReferrerOrderUpdated;
use App\Domains\Referrer\Models\ReferrerOrder;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PreOrderWebhookTest extends PreOrderTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.provider_app.webhook_domain' => 'https://provider.example.test/api/',
            'services.provider_app.webhook_secret' => 'test-secret',
        ]);
        Http::fake(['*' => Http::response(['ok' => true])]);
    }

    public function test_the_snapshot_is_signed_over_the_exact_body(): void
    {
        $preOrder = $this->draft([$this->test('NIPT', 'nipt')]);

        app(SendPreOrderSnapshotWebhook::class)->handle(new PreOrderChanged($preOrder));

        Http::assertSent(function (Request $request) use ($preOrder) {
            return $request->url() === 'https://provider.example.test/api/webhooks/pre-orders/upsert'
                && $request->header('X-Webhook-Signature')[0] === hash_hmac('sha256', $request->body(), 'test-secret')
                && $request['code'] === $preOrder->code
                && $request['version'] === $preOrder->version
                && $request['stage']['code'] === 'DRAFT';
        });
    }

    public function test_the_action_result_carries_the_panels_action_id(): void
    {
        $action = PreOrderAction::create([
            'uuid' => $uuid = (string) Str::uuid(),
            'referrer_id' => $this->referrerId,
            'type' => 'submit',
            'payload' => [],
            'actor' => [],
            'status' => ActionStatus::FAILED,
            'error' => 'Pre-order not found.',
        ]);

        app(SendPreOrderActionResultWebhook::class)->handle(new PreOrderActionProcessed($action));

        Http::assertSent(fn (Request $r) => str_ends_with($r->url(), '/webhooks/pre-orders/action-result')
            && $r['action_id'] === $uuid && $r['ok'] === false && $r['error'] === 'Pre-order not found.');
    }

    public function test_a_missing_secret_refuses_to_send_unsigned(): void
    {
        config(['services.provider_app.webhook_secret' => null]);
        $this->expectExceptionMessage('PROVIDER_APP_WEBHOOK_SECRET');

        app(SendPreOrderSnapshotWebhook::class)->handle(new PreOrderChanged($this->draft([$this->test('NIPT', 'nipt')])));
    }

    public function test_only_orders_from_a_pre_order_queue_a_sync(): void
    {
        $listener = app(SyncPreOrderFromReferrerOrder::class);
        $plain = new ReferrerOrder(['pre_order_id' => null]);
        $linked = new ReferrerOrder(['pre_order_id' => 5]);

        $this->assertFalse($listener->shouldQueue(new ReferrerOrderUpdated($plain)));
        $this->assertTrue($listener->shouldQueue(new ReferrerOrderUpdated($linked)));
    }
}
