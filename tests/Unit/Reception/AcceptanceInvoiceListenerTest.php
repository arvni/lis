<?php

namespace Tests\Unit\Reception;

use App\Domains\Billing\Events\InvoiceAcceptanceUpdateEvent;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Reception\Adapters\BillingAdapter;
use App\Domains\Reception\Listeners\AcceptanceInvoiceListener;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use Mockery;
use Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;
use Tests\TestCase;

/**
 * Verifies the listener talks to Billing only through the Reception BillingAdapter
 * (the cross-domain boundary) rather than reaching into Billing's services directly.
 * Pure-unit: every collaborator is mocked, no DB.
 */
class AcceptanceInvoiceListenerTest extends TestCase
{
    use MockeryPHPUnitIntegration;

    public function test_recomposes_invoice_through_the_billing_adapter(): void
    {
        $event = new InvoiceAcceptanceUpdateEvent(acceptanceId: 7, invoiceId: 42);
        $acceptance = new Acceptance;
        $invoice = new Invoice;

        $acceptanceService = Mockery::mock(AcceptanceService::class);
        $acceptanceService->shouldReceive('getAcceptanceById')->once()->with(7)->andReturn($acceptance);
        $acceptanceService->shouldReceive('updateAcceptanceInvoice')->once()->with($acceptance, 42);

        $billingAdapter = Mockery::mock(BillingAdapter::class);
        $billingAdapter->shouldReceive('findInvoiceById')->once()->with(42)->andReturn($invoice);
        $billingAdapter->shouldReceive('recomposeInvoice')->once()->with($invoice)->andReturn(1);

        (new AcceptanceInvoiceListener($acceptanceService, $billingAdapter))->handle($event);
    }

    public function test_bails_out_when_acceptance_is_missing(): void
    {
        $event = new InvoiceAcceptanceUpdateEvent(acceptanceId: 7, invoiceId: 42);

        $acceptanceService = Mockery::mock(AcceptanceService::class);
        $acceptanceService->shouldReceive('getAcceptanceById')->once()->with(7)->andReturnNull();
        $acceptanceService->shouldNotReceive('updateAcceptanceInvoice');

        $billingAdapter = Mockery::mock(BillingAdapter::class);
        $billingAdapter->shouldNotReceive('findInvoiceById');
        $billingAdapter->shouldNotReceive('recomposeInvoice');

        (new AcceptanceInvoiceListener($acceptanceService, $billingAdapter))->handle($event);
    }

    public function test_skips_recompose_when_invoice_not_found(): void
    {
        $event = new InvoiceAcceptanceUpdateEvent(acceptanceId: 7, invoiceId: 42);
        $acceptance = new Acceptance;

        $acceptanceService = Mockery::mock(AcceptanceService::class);
        $acceptanceService->shouldReceive('getAcceptanceById')->once()->with(7)->andReturn($acceptance);
        $acceptanceService->shouldReceive('updateAcceptanceInvoice')->once()->with($acceptance, 42);

        $billingAdapter = Mockery::mock(BillingAdapter::class);
        $billingAdapter->shouldReceive('findInvoiceById')->once()->with(42)->andReturnNull();
        $billingAdapter->shouldNotReceive('recomposeInvoice');

        (new AcceptanceInvoiceListener($acceptanceService, $billingAdapter))->handle($event);
    }
}
