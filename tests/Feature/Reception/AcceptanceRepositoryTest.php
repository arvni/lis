<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Payment;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Repositories\AcceptanceRepository;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * What an acceptance is owed is summed in SQL from unsigned money columns, so an
 * item carrying a discount above its own price is not merely mispriced — on MySQL
 * it aborts the statement with "1690 DECIMAL UNSIGNED value is out of range",
 * which is what took the dashboard down. Each item is worth its price less its
 * discount and never less than nothing.
 */
class AcceptanceRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private AcceptanceRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->repository = app(AcceptanceRepository::class);
    }

    public function test_an_over_discounted_item_is_worth_nothing_rather_than_less_than_nothing(): void
    {
        $acceptance = $this->makeAcceptance();
        // Worth 10 in total: the second item cannot refund part of the first.
        $this->addItem($acceptance, price: 10, discount: 0);
        $this->addItem($acceptance, price: 3, discount: 3.334);

        $this->pay($acceptance, 9.8);
        $this->assertSame(0, $this->repository->getTotalWaitingForSampling());

        $this->pay($acceptance, 0.2);
        $this->assertSame(1, $this->repository->getTotalWaitingForSampling());
    }

    private function makeAcceptance(): Acceptance
    {
        $patient = Patient::create([
            'fullName' => 'Repo Patient',
            'idNo' => 'REPO'.uniqid(),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => auth()->id(),
        ]);

        $invoice = Invoice::create([
            'owner_id' => $patient->id,
            'owner_type' => Patient::class,
            'user_id' => auth()->id(),
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ]);

        return Acceptance::create([
            'status' => AcceptanceStatus::PROCESSING,
            'step' => 5,
            'patient_id' => $patient->id,
            'acceptor_id' => auth()->id(),
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
            'invoice_id' => $invoice->id,
        ]);
    }

    private function addItem(Acceptance $acceptance, float $price, float $discount): AcceptanceItem
    {
        $test = Test::create(['name' => 'R', 'fullName' => 'R', 'code' => 'R'.uniqid(), 'type' => TestType::TEST, 'status' => true, 'can_merge' => false]);
        $method = Method::create(['name' => 'M', 'price' => 0, 'turnaround_time' => 1, 'status' => true, 'no_patient' => 1, 'no_sample' => 1]);
        $methodTest = MethodTest::create(['method_id' => $method->id, 'test_id' => $test->id, 'is_default' => true, 'status' => true]);

        return AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => $price,
            'discount' => $discount,
            'reportless' => false,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);
    }

    private function pay(Acceptance $acceptance, float $amount): void
    {
        Payment::create([
            'invoice_id' => $acceptance->invoice_id,
            'price' => $amount,
            'paymentMethod' => PaymentMethod::CASH,
            'cashier_id' => auth()->id(),
            'payer_type' => Patient::class,
            'payer_id' => $acceptance->patient_id,
        ]);
    }
}
