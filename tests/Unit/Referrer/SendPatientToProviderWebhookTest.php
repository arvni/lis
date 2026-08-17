<?php

namespace Tests\Unit\Referrer;

use App\Domains\Reception\Models\Patient;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Events\ReferrerOrderPatientCreated;
use App\Listeners\SendPatientToProviderWebhook;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * The provider validates the patient webhook's order_id as an integer, so the
 * payload must carry the provider's numeric order id -- not this order's
 * "OR.<Ymd>.<id>" key, which was rejected outright and left relatives unlinked.
 */
class SendPatientToProviderWebhookTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.provider_app.webhook_domain' => 'http://provider.test/api',
            'services.provider_app.webhook_secret' => 'secret',
        ]);
    }

    public function test_it_sends_the_providers_numeric_order_id_and_the_acceptance_id(): void
    {
        Http::fake(['*' => Http::response(['success' => true])]);

        $this->dispatchFor($this->makeReferrerOrder(
            orderId: 'OR.20260101.42',
            orderInformation: ['id' => 42],
            acceptanceId: 1001,
        ));

        Http::assertSent(function (Request $request) {
            $this->assertSame(42, $request->data()['order_id']);
            $this->assertSame(1001, $request->data()['acceptance_id']);

            return true;
        });
    }

    /**
     * A lab-raised order has no provider order behind it, so order_id is null
     * and the provider matches on the acceptance id alone.
     */
    public function test_it_sends_a_null_order_id_for_lab_raised_orders(): void
    {
        Http::fake(['*' => Http::response(['success' => true])]);

        $this->dispatchFor($this->makeReferrerOrder(
            orderId: 'SC-IN-1001-1770000000',
            orderInformation: ['status' => 'processing'],
            acceptanceId: 1001,
        ));

        Http::assertSent(function (Request $request) {
            $this->assertNull($request->data()['order_id']);
            $this->assertSame(1001, $request->data()['acceptance_id']);

            return true;
        });
    }

    private function dispatchFor(ReferrerOrder $referrerOrder): void
    {
        $patient = new Patient();
        $patient->id = 7001;
        $patient->fullName = 'Bob Relative';
        $patient->idNo = 'ID-7001';
        $patient->nationality = 'Testland';
        $patient->dateOfBirth = '1985-05-05';
        $patient->gender = 'male';
        $patient->phone = null;

        (new SendPatientToProviderWebhook())->handle(
            new ReferrerOrderPatientCreated($referrerOrder, $patient, false)
        );
    }

    private function makeReferrerOrder(string $orderId, array $orderInformation, int $acceptanceId): ReferrerOrder
    {
        $referrerOrder = new ReferrerOrder();
        $referrerOrder->id = 99;
        $referrerOrder->order_id = $orderId;
        $referrerOrder->orderInformation = $orderInformation;
        $referrerOrder->acceptance_id = $acceptanceId;
        $referrerOrder->referrer_id = 7;

        return $referrerOrder;
    }
}
