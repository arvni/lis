<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * The patient pages show the same money the acceptance page does: the list
 * derives a Debt column from per-patient sums, and the show page carries the
 * patient's invoices and payments. Both ride on "View Financials", and as on the
 * acceptance page the amounts must never reach the browser without it.
 */
class PatientFinancialVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private const LIST = 'Reception.Patients.List Patients';

    private const VIEW = 'Reception.Patients.View Patient';

    private const FINANCIALS = 'Reception.Acceptances.View Financials';

    private User $registrar;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->registrar = User::factory()->create();
        $this->patient = Patient::create([
            'fullName' => 'Money Patient',
            'idNo' => 'PFIN'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => $this->registrar->id,
        ]);

        Invoice::create([
            'user_id' => $this->registrar->id,
            'owner_id' => $this->patient->id,
            'owner_type' => 'patient',
            'status' => InvoiceStatus::WAITING_FOR_PAYMENT->value,
            'discount' => 0,
        ]);
    }

    public function test_the_list_withholds_the_sums_the_debt_column_is_built_from(): void
    {
        $this->actingAs($this->userWith([self::LIST]))
            ->get(route('patients.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canViewFinancials', false)
                ->missing('patients.data.0.payments_sum_price')
                ->missing('patients.data.0.acceptance_items_sum_price')
                ->missing('patients.data.0.acceptance_items_sum_discount'));
    }

    public function test_the_list_carries_the_sums_when_the_permission_is_held(): void
    {
        $this->actingAs($this->userWith([self::LIST, self::FINANCIALS]))
            ->get(route('patients.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canViewFinancials', true)
                ->has('patients.data.0.payments_sum_price')
                ->has('patients.data.0.acceptance_items_sum_price')
                ->has('patients.data.0.acceptance_items_sum_discount'));
    }

    public function test_the_patient_page_withholds_invoices_and_payments(): void
    {
        $this->actingAs($this->userWith([self::VIEW]))
            ->get(route('patients.show', $this->patient->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canViewFinancials', false)
                ->missing('invoices')
                ->missing('payments')
                ->missing('stats.invoices')
                ->missing('stats.payments')
                // The rest of the page is unaffected.
                ->has('acceptances')
                ->has('stats.acceptances'));
    }

    public function test_the_patient_page_shows_invoices_and_payments_when_permitted(): void
    {
        $this->actingAs($this->userWith([self::VIEW, self::FINANCIALS]))
            ->get(route('patients.show', $this->patient->id))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('canViewFinancials', true)
                ->has('invoices', 1)
                ->has('payments')
                ->has('stats.invoices')
                ->has('stats.payments'));
    }

    /**
     * @param  list<string>  $permissions
     */
    private function userWith(array $permissions): User
    {
        $user = User::factory()->create();

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
