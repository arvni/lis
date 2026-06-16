<?php

namespace Tests\Feature\Notification;

use App\Domains\Notification\Jobs\SendCollectRequestWebhook;
use App\Domains\Notification\Jobs\SendOrderMaterialUpdateWebhook;
use App\Domains\Notification\Listeners\NotifyLogisticsAppOfCollectRequestUpdate;
use App\Domains\Notification\Listeners\NotifyProviderOfOrderMaterialUpdate;
use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Referrer\Enums\OrderMaterialStatus;
use App\Domains\Referrer\Events\CollectRequestEvent;
use App\Domains\Referrer\Models\OrderMaterial;
use App\Domains\Referrer\Models\Referrer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class NotificationListenersTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // N-10: NotifyProviderOfOrderMaterialUpdate dispatches SendOrderMaterialUpdateWebhook
    // -------------------------------------------------------------------------

    public function test_notify_provider_of_order_material_update_dispatches_job(): void
    {
        Queue::fake();

        $referrer = Referrer::create([
            'fullName' => 'OM Referrer',
            'email' => 'om@example.com',
            'phoneNo' => '90000000',
            'billingInfo' => [],
        ]);
        $orderMaterial = OrderMaterial::create([
            'server_id'      => 10,
            'referrer_id'    => $referrer->id,
            'sample_type_id' => SampleType::create(['name' => 'ST10'])->id,
            'amount'         => 1,
            'status'         => OrderMaterialStatus::ORDERED,
        ]);

        // Create a plain object event with the orderMaterial property
        $event = new \stdClass();
        $event->orderMaterial = $orderMaterial;

        $listener = new NotifyProviderOfOrderMaterialUpdate();
        $listener->handle($event);

        Queue::assertPushed(SendOrderMaterialUpdateWebhook::class, function ($job) use ($orderMaterial) {
            // The job stores the model; verify via reflection that the bound model matches
            $reflection = new \ReflectionClass($job);
            $property   = $reflection->getProperty('orderMaterial');
            $property->setAccessible(true);
            $boundModel = $property->getValue($job);

            return $boundModel->id === $orderMaterial->id;
        });
    }

    // -------------------------------------------------------------------------
    // N-11: NotifyLogisticsAppOfCollectRequestUpdate dispatches SendCollectRequestWebhook
    // -------------------------------------------------------------------------

    public function test_notify_logistics_of_collect_request_dispatches_job(): void
    {
        Queue::fake();

        $event = new CollectRequestEvent(55, 'create');

        $listener = new NotifyLogisticsAppOfCollectRequestUpdate();
        $listener->handle($event);

        Queue::assertPushed(SendCollectRequestWebhook::class, function ($job) {
            $reflection = new \ReflectionClass($job);

            $idProp = $reflection->getProperty('id');
            $idProp->setAccessible(true);

            $actionProp = $reflection->getProperty('action');
            $actionProp->setAccessible(true);

            return $idProp->getValue($job) === 55
                && $actionProp->getValue($job) === 'create';
        });
    }
}
