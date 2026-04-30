<?php

namespace Tests\Feature\Notification;

use App\Domains\Laboratory\Models\ConsentForm;
use App\Domains\Laboratory\Models\Instruction;
use App\Domains\Laboratory\Models\RequestForm;
use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Notification\Jobs\SendCollectRequestWebhook;
use App\Domains\Notification\Jobs\SendConsentFormUpdateWebhook;
use App\Domains\Notification\Jobs\SendInstructionUpdateWebhook;
use App\Domains\Notification\Jobs\SendOrderMaterialUpdateWebhook;
use App\Domains\Notification\Jobs\SendRequestFormUpdateWebhook;
use App\Domains\Notification\Jobs\SendSampleTypeUpdateWebhook;
use App\Domains\Referrer\Enums\OrderMaterialStatus;
use App\Domains\Referrer\Models\CollectRequest;
use App\Domains\Referrer\Models\OrderMaterial;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WebhookJobsTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // N-01: SendOrderMaterialUpdateWebhook posts with HMAC signature
    // -------------------------------------------------------------------------

    public function test_send_order_material_update_webhook_posts_with_hmac_signature(): void
    {
        Http::fake(['*' => Http::response('', 200)]);

        config([
            'services.provider_app.webhook_domain'          => 'https://provider.example.com',
            'services.provider_app.order_material_webhook_url' => '/api/webhook/order-material/',
            'services.provider_app.webhook_secret'          => 'test-secret',
        ]);

        // Create the order material without actual materials (load returns empty collection)
        $orderMaterial = OrderMaterial::create([
            'server_id' => 42,
            'status'    => OrderMaterialStatus::ORDERED,
        ]);

        $job = new SendOrderMaterialUpdateWebhook($orderMaterial);
        $job->handle();

        Http::assertSent(function ($request) use ($orderMaterial) {
            // Verify the URL contains the server_id
            $this->assertStringContainsString('42', $request->url());
            $this->assertStringContainsString('provider.example.com', $request->url());

            // Recompute expected signature
            $payload = [
                'order_id'   => $orderMaterial->server_id,
                'status'     => $orderMaterial->status,
                'updated_at' => $orderMaterial->updated_at?->toISOString(),
                'materials'  => $orderMaterial->materials?->toArray() ?? [],
            ];
            $expectedSignature = hash_hmac('sha256', json_encode($payload), 'test-secret');

            return $request->header('X-Webhook-Signature')[0] === $expectedSignature;
        });
    }

    // -------------------------------------------------------------------------
    // N-02: SendOrderMaterialUpdateWebhook throws on non-2xx response
    // -------------------------------------------------------------------------

    public function test_send_order_material_update_webhook_throws_on_non_2xx_response(): void
    {
        Http::fake(['*' => Http::response(null, 500)]);

        config([
            'services.provider_app.webhook_domain'          => 'https://provider.example.com',
            'services.provider_app.order_material_webhook_url' => '/api/webhook/order-material/',
            'services.provider_app.webhook_secret'          => 'test-secret',
        ]);

        $orderMaterial = OrderMaterial::create([
            'server_id' => 99,
            'status'    => OrderMaterialStatus::ORDERED,
        ]);

        $this->expectException(Exception::class);

        $job = new SendOrderMaterialUpdateWebhook($orderMaterial);
        $job->handle();
    }

    // -------------------------------------------------------------------------
    // N-03: SendOrderMaterialUpdateWebhook has 3 tries and correct backoff
    // -------------------------------------------------------------------------

    public function test_send_order_material_update_webhook_has_3_tries_with_backoff(): void
    {
        $orderMaterial = OrderMaterial::make([
            'server_id' => 1,
            'status'    => OrderMaterialStatus::ORDERED,
        ]);

        $job = new SendOrderMaterialUpdateWebhook($orderMaterial);

        $this->assertSame(3, $job->tries);
        $this->assertSame([10, 30, 60], $job->backoff);
    }

    // -------------------------------------------------------------------------
    // N-04: SendCollectRequestWebhook update action includes full payload
    // -------------------------------------------------------------------------

    public function test_send_collect_request_webhook_update_action_includes_full_payload(): void
    {
        Http::fake(['*' => Http::response('', 200)]);

        config([
            'services.logistics_app.webhook_domain'              => 'https://logistics.example.com',
            'services.logistics_app.collect_request_webhook_url' => '/api/collect-requests',
            'services.logistics_app.webhook_secret'              => 'logistics-secret',
        ]);

        // Create a CollectRequest in the DB so the job can load it with relationships
        $collectRequest = CollectRequest::create([
            'status'   => null,
            'barcode'  => 'BC-TEST-001',
        ]);

        $job = new SendCollectRequestWebhook($collectRequest->id, 'update');
        $job->handle();

        Http::assertSent(function ($request) use ($collectRequest) {
            $body = $request->data();

            $this->assertArrayHasKey('id', $body);
            $this->assertArrayHasKey('action', $body);
            $this->assertArrayHasKey('status', $body);
            $this->assertArrayHasKey('referrer', $body);
            $this->assertArrayHasKey('sample_collector', $body);
            $this->assertSame($collectRequest->id, $body['id']);
            $this->assertSame('update', $body['action']);

            return true;
        });
    }

    // -------------------------------------------------------------------------
    // N-05: SendCollectRequestWebhook delete action sends only id
    // -------------------------------------------------------------------------

    public function test_send_collect_request_webhook_delete_action_sends_only_id(): void
    {
        Http::fake(['*' => Http::response('', 200)]);

        config([
            'services.logistics_app.webhook_domain'              => 'https://logistics.example.com',
            'services.logistics_app.collect_request_webhook_url' => '/api/collect-requests',
            'services.logistics_app.webhook_secret'              => 'logistics-secret',
        ]);

        $job = new SendCollectRequestWebhook(77, 'delete');
        $job->handle();

        Http::assertSent(function ($request) {
            $body = $request->data();

            $this->assertSame(['id' => 77], $body);

            return true;
        });
    }

    // -------------------------------------------------------------------------
    // N-06: SendConsentFormUpdateWebhook posts and signs
    // -------------------------------------------------------------------------

    public function test_send_consent_form_update_webhook_posts_and_signs(): void
    {
        Http::fake(['*' => Http::response('', 200)]);

        config([
            'services.provider_app.webhook_domain'           => 'https://provider.example.com',
            'services.provider_app.consent_form_webhook_url' => '/api/consent-forms/',
            'services.provider_app.webhook_secret'           => 'provider-secret',
        ]);

        $consentForm = ConsentForm::create([
            'name'      => 'Test Consent Form',
            'is_active' => true,
        ]);

        $job = new SendConsentFormUpdateWebhook($consentForm, 'update');
        $job->handle();

        Http::assertSent(function ($request) use ($consentForm) {
            $this->assertStringContainsString('provider.example.com', $request->url());
            $this->assertStringContainsString((string) $consentForm->id, $request->url());

            // Signature header must be present
            $this->assertNotEmpty($request->header('X-Webhook-Signature'));

            return true;
        });
    }

    // -------------------------------------------------------------------------
    // N-07: SendInstructionUpdateWebhook posts and signs
    // -------------------------------------------------------------------------

    public function test_send_instruction_update_webhook_posts_and_signs(): void
    {
        Http::fake(['*' => Http::response('', 200)]);

        config([
            'services.provider_app.webhook_domain'        => 'https://provider.example.com',
            'services.provider_app.instruction_webhook_url' => '/api/instructions/',
            'services.provider_app.webhook_secret'        => 'provider-secret',
        ]);

        $instruction = Instruction::create([
            'name'      => 'Test Instruction',
            'is_active' => true,
        ]);

        $job = new SendInstructionUpdateWebhook($instruction, 'update');
        $job->handle();

        Http::assertSent(function ($request) use ($instruction) {
            $this->assertStringContainsString('provider.example.com', $request->url());
            $this->assertStringContainsString((string) $instruction->id, $request->url());
            $this->assertNotEmpty($request->header('X-Webhook-Signature'));

            return true;
        });
    }

    // -------------------------------------------------------------------------
    // N-08: SendRequestFormUpdateWebhook posts and signs
    // -------------------------------------------------------------------------

    public function test_send_request_form_update_webhook_posts_and_signs(): void
    {
        Http::fake(['*' => Http::response('', 200)]);

        config([
            'services.provider_app.webhook_domain'           => 'https://provider.example.com',
            'services.provider_app.request_form_webhook_url' => '/api/request-forms/',
            'services.provider_app.webhook_secret'           => 'provider-secret',
        ]);

        $requestForm = RequestForm::create([
            'name'      => 'Test Request Form',
            'is_active' => true,
        ]);

        $job = new SendRequestFormUpdateWebhook($requestForm, 'update');
        $job->handle();

        Http::assertSent(function ($request) use ($requestForm) {
            $this->assertStringContainsString('provider.example.com', $request->url());
            $this->assertStringContainsString((string) $requestForm->id, $request->url());
            $this->assertNotEmpty($request->header('X-Webhook-Signature'));

            return true;
        });
    }

    // -------------------------------------------------------------------------
    // N-09: SendSampleTypeUpdateWebhook posts and signs
    // -------------------------------------------------------------------------

    public function test_send_sample_type_update_webhook_posts_and_signs(): void
    {
        Http::fake(['*' => Http::response('', 200)]);

        config([
            'services.provider_app.webhook_domain'          => 'https://provider.example.com',
            'services.provider_app.sample_type_webhook_url' => '/api/sample-types/',
            'services.provider_app.webhook_secret'          => 'provider-secret',
        ]);

        $sampleType = SampleType::create([
            'name'            => 'Test Sample Type',
            'orderable'       => true,
            'required_barcode' => false,
        ]);

        $job = new SendSampleTypeUpdateWebhook($sampleType, 'update');
        $job->handle();

        Http::assertSent(function ($request) use ($sampleType) {
            $this->assertStringContainsString('provider.example.com', $request->url());
            $this->assertStringContainsString((string) $sampleType->id, $request->url());
            $this->assertNotEmpty($request->header('X-Webhook-Signature'));

            return true;
        });
    }
}
