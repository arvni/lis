<?php

namespace Tests\Feature\Billing;

use App\Domains\Billing\Enums\InvoiceItemKind;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\InvoiceItem;
use App\Domains\Billing\Services\InvoiceItemSyncService;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceItemSyncServiceTest extends TestCase
{
    use RefreshDatabase;

    private InvoiceItemSyncService $service;
    private Invoice $invoice;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->service = new InvoiceItemSyncService();

        $patient = Patient::create([
            'fullName'     => 'Inv Patient',
            'idNo'         => 'INV001',
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);

        $this->invoice = Invoice::create([
            'owner_type' => 'patient',
            'owner_id'   => $patient->id,
            'user_id'    => auth()->id(),
            'status'     => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount'   => 0,
        ]);
    }

    public function test_create_adds_manual_fee_locked_with_computed_price(): void
    {
        $summary = $this->service->sync($this->invoice, [
            ['title' => 'Extra fee', 'unit_price' => 20, 'qty' => 3],
        ]);

        $this->assertSame(['created' => 1, 'updated' => 0, 'deleted' => 0], $summary);

        $item = $this->invoice->invoiceItems()->first();
        $this->assertSame(InvoiceItemKind::MANUAL_FEE, $item->kind);
        $this->assertEqualsWithDelta(60.0, (float) $item->price, 0.001);
        $this->assertNotNull($item->locked_at);
    }

    public function test_create_defaults_qty_to_one_when_zero(): void
    {
        $this->service->sync($this->invoice, [
            ['title' => 'Flat', 'unit_price' => 15, 'qty' => 0],
        ]);

        $item = $this->invoice->invoiceItems()->first();
        $this->assertEqualsWithDelta(15.0, (float) $item->price, 0.001);
    }

    public function test_update_modifies_fields_and_recalculates_price(): void
    {
        $item = $this->invoice->invoiceItems()->create([
            'kind'       => InvoiceItemKind::MANUAL_FEE->value,
            'title'      => 'Old',
            'unit_price' => 10,
            'qty'        => 1,
            'price'      => 10,
            'discount'   => 0,
        ]);

        $summary = $this->service->sync($this->invoice, [
            ['id' => $item->id, 'title' => 'Updated', 'unit_price' => 25, 'qty' => 2],
        ]);

        $this->assertSame(1, $summary['updated']);
        $item->refresh();
        $this->assertSame('Updated', $item->title);
        $this->assertEqualsWithDelta(50.0, (float) $item->price, 0.001);
        $this->assertNotNull($item->locked_at);
    }

    public function test_destroy_soft_deletes_and_keeps_lock(): void
    {
        $item = $this->invoice->invoiceItems()->create([
            'kind'       => InvoiceItemKind::MANUAL_FEE->value,
            'title'      => 'Doomed',
            'unit_price' => 10,
            'qty'        => 1,
            'price'      => 10,
            'discount'   => 0,
        ]);

        $summary = $this->service->sync($this->invoice, [
            ['id' => $item->id, '_destroy' => true],
        ]);

        $this->assertSame(1, $summary['deleted']);
        $this->assertSoftDeleted('invoice_items', ['id' => $item->id]);
        $this->assertNotNull(InvoiceItem::withTrashed()->find($item->id)->locked_at);
    }

    public function test_update_and_destroy_ignore_unknown_ids(): void
    {
        $summary = $this->service->sync($this->invoice, [
            ['id' => 9999, 'title' => 'ghost', 'unit_price' => 1, 'qty' => 1],
            ['id' => 8888, '_destroy' => true],
        ]);

        $this->assertSame(['created' => 0, 'updated' => 0, 'deleted' => 0], $summary);
    }

    public function test_sync_handles_mixed_payload(): void
    {
        $existing = $this->invoice->invoiceItems()->create([
            'kind'       => InvoiceItemKind::MANUAL_FEE->value,
            'title'      => 'Keep',
            'unit_price' => 10,
            'qty'        => 1,
            'price'      => 10,
            'discount'   => 0,
        ]);
        $toDelete = $this->invoice->invoiceItems()->create([
            'kind'       => InvoiceItemKind::MANUAL_FEE->value,
            'title'      => 'Remove',
            'unit_price' => 5,
            'qty'        => 1,
            'price'      => 5,
            'discount'   => 0,
        ]);

        $summary = $this->service->sync($this->invoice, [
            ['title' => 'New', 'unit_price' => 30, 'qty' => 1],
            ['id' => $existing->id, 'unit_price' => 12, 'qty' => 1],
            ['id' => $toDelete->id, '_destroy' => true],
        ]);

        $this->assertSame(['created' => 1, 'updated' => 1, 'deleted' => 1], $summary);
    }
}
