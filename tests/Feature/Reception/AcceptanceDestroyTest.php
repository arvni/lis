<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * HTTP-level coverage for deleting and restoring an acceptance: the status
 * guard, the soft-delete cascade onto items and invoice, and the recovery list.
 * The refusal used to escape as an uncaught exception and hit the user as a 500.
 */
class AcceptanceDestroyTest extends TestCase
{
    use RefreshDatabase;

    private const DELETE_PERMISSION = 'Reception.Acceptances.Delete Acceptance';

    private const RESTORE_PERMISSION = 'Reception.Acceptances.Restore Acceptance';

    // An acceptance that already has an invoice is only deletable with this on top.
    private const INVOICED_PERMISSION = 'Reception.Acceptances.Edit Invoiced Acceptance';

    private const LIST_PERMISSION = 'Reception.Acceptances.List Acceptance';

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs($this->userWithPermissions(
            self::DELETE_PERMISSION,
            self::RESTORE_PERMISSION,
            self::INVOICED_PERMISSION,
            self::LIST_PERMISSION,
        ));

        $this->patient = Patient::create([
            'fullName' => 'Delete Patient',
            'idNo' => 'DEL'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }

    private function userWithPermissions(string ...$permissions): User
    {
        $user = User::factory()->create();
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function createAcceptance(AcceptanceStatus $status, ?int $invoiceId = null): Acceptance
    {
        return Acceptance::create([
            'status' => $status,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => auth()->id(),
            'invoice_id' => $invoiceId,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);
    }

    private function createItem(Acceptance $acceptance): AcceptanceItem
    {
        $method = Method::create([
            'name' => 'Method '.Str::random(4),
            'price' => 0,
            'turnaround_time' => 1,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ]);
        $test = Test::create([
            'name' => 'Test '.Str::random(4),
            'fullName' => 'Full Test',
            'code' => 'T'.uniqid(),
            'type' => TestType::TEST,
            'status' => true,
            'can_merge' => false,
            'price' => 10,
        ]);
        $methodTest = MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => true,
            'status' => true,
        ]);

        return AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => 10,
            'discount' => 0,
            'reportless' => false,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);
    }

    private function createInvoice(): Invoice
    {
        return Invoice::create([
            'owner_id' => $this->patient->id,
            'owner_type' => Patient::class,
            'user_id' => auth()->id(),
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT,
            'discount' => 0,
        ]);
    }

    /**
     * @return array<string, array{0: AcceptanceStatus}>
     */
    public static function deletableStatusProvider(): array
    {
        return [
            'pending' => [AcceptanceStatus::PENDING],
            'processing' => [AcceptanceStatus::PROCESSING],
            'cancelled' => [AcceptanceStatus::CANCELLED],
        ];
    }

    #[DataProvider('deletableStatusProvider')]
    public function test_deletes_an_acceptance_in_a_deletable_status(AcceptanceStatus $status): void
    {
        $acceptance = $this->createAcceptance($status);

        $this->delete(route('acceptances.destroy', $acceptance->id))
            ->assertRedirect()
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', true);

        // Soft delete: the row survives, it just stops being visible.
        $this->assertSoftDeleted('acceptances', ['id' => $acceptance->id]);
    }

    /**
     * @return array<string, array{0: AcceptanceStatus}>
     */
    public static function undeletableStatusProvider(): array
    {
        return [
            'waiting for payment' => [AcceptanceStatus::WAITING_FOR_PAYMENT],
            'sampling' => [AcceptanceStatus::SAMPLING],
            'waiting for entering' => [AcceptanceStatus::WAITING_FOR_ENTERING],
            'reported' => [AcceptanceStatus::REPORTED],
        ];
    }

    #[DataProvider('undeletableStatusProvider')]
    public function test_refuses_to_delete_an_acceptance_that_must_be_cancelled_first(AcceptanceStatus $status): void
    {
        $acceptance = $this->createAcceptance($status);

        $this->delete(route('acceptances.destroy', $acceptance->id))
            ->assertRedirect()
            ->assertSessionHasErrors('message');

        $this->assertNotSoftDeleted('acceptances', ['id' => $acceptance->id]);
    }

    // The success message used to interpolate a `name` attribute the model does
    // not have, so every delete reported " Successfully Deleted."
    public function test_names_the_patient_in_the_success_message(): void
    {
        $acceptance = $this->createAcceptance(AcceptanceStatus::PENDING);

        $this->delete(route('acceptances.destroy', $acceptance->id))
            ->assertRedirect()
            ->assertSessionHas('status', 'Delete Patient Successfully Deleted.');
    }

    public function test_delete_takes_the_items_with_it_and_cancels_the_invoice(): void
    {
        $invoice = $this->createInvoice();
        $acceptance = $this->createAcceptance(AcceptanceStatus::PROCESSING, $invoice->id);
        $item = $this->createItem($acceptance);

        $this->delete(route('acceptances.destroy', $acceptance->id))->assertRedirect();

        $this->assertSoftDeleted('acceptance_items', ['id' => $item->id]);
        // The invoice keeps its row, its number and its payments — it is only
        // parked as cancelled.
        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => InvoiceStatus::CANCELED->value,
        ]);
    }

    public function test_a_deleted_acceptance_drops_out_of_the_list_and_into_the_recovery_list(): void
    {
        $acceptance = $this->createAcceptance(AcceptanceStatus::PROCESSING);
        $this->createItem($acceptance);

        $this->delete(route('acceptances.destroy', $acceptance->id))->assertRedirect();

        $this->get(route('acceptances.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('acceptances.total', 0));

        $this->get(route('acceptances.deleted'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('acceptances.total', 1)
                // Counts reach through the cascade, or the row would read "0 tests".
                ->where('acceptances.data.0.acceptance_items_count', 1)
                ->where('acceptances.data.0.id', $acceptance->id));
    }

    public function test_restore_brings_back_the_acceptance_and_its_items_and_uncancels_the_invoice(): void
    {
        $invoice = $this->createInvoice();
        $acceptance = $this->createAcceptance(AcceptanceStatus::PROCESSING, $invoice->id);
        $item = $this->createItem($acceptance);

        $this->delete(route('acceptances.destroy', $acceptance->id))->assertRedirect();

        $this->put(route('acceptances.restore', $acceptance->id))
            ->assertRedirect()
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success', true);

        $this->assertNotSoftDeleted('acceptances', ['id' => $acceptance->id]);
        $this->assertNotSoftDeleted('acceptance_items', ['id' => $item->id]);
        // The exact status is recomputed from what has been paid; what matters
        // here is that the invoice no longer reads as cancelled.
        $this->assertNotSame(InvoiceStatus::CANCELED->value, $invoice->fresh()->status);
    }

    // An item deleted on its own, before the acceptance went, was not part of
    // this delete and must not ride the restore back in.
    public function test_restore_leaves_items_that_were_already_deleted_alone(): void
    {
        $acceptance = $this->createAcceptance(AcceptanceStatus::PROCESSING);
        $keptItem = $this->createItem($acceptance);
        $earlierItem = $this->createItem($acceptance);
        $earlierItem->delete();

        $this->delete(route('acceptances.destroy', $acceptance->id))->assertRedirect();
        $this->put(route('acceptances.restore', $acceptance->id))->assertRedirect();

        $this->assertNotSoftDeleted('acceptance_items', ['id' => $keptItem->id]);
        $this->assertSoftDeleted('acceptance_items', ['id' => $earlierItem->id]);
    }

    public function test_restoring_a_live_acceptance_is_refused(): void
    {
        $acceptance = $this->createAcceptance(AcceptanceStatus::PROCESSING);

        $this->put(route('acceptances.restore', $acceptance->id))
            ->assertRedirect()
            ->assertSessionHasErrors('message');
    }

    public function test_the_recovery_list_and_restore_need_the_restore_permission(): void
    {
        $acceptance = $this->createAcceptance(AcceptanceStatus::PROCESSING);
        $this->delete(route('acceptances.destroy', $acceptance->id))->assertRedirect();

        $this->actingAs($this->userWithPermissions(self::DELETE_PERMISSION));

        $this->get(route('acceptances.deleted'))->assertForbidden();
        $this->put(route('acceptances.restore', $acceptance->id))->assertForbidden();
    }
}
