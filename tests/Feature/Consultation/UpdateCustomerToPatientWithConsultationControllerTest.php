<?php

namespace Tests\Feature\Consultation;

use App\Domains\Consultation\Models\Consultant;
use App\Domains\Consultation\Models\Customer;
use App\Domains\Consultation\Models\Time;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class UpdateCustomerToPatientWithConsultationControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Reception.Patients.Create Patient';

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs($this->userWithCreatePermission());
    }

    public function test_customer_email_is_preserved_when_patient_has_no_meta_email(): void
    {
        $customer = $this->makeCustomer(['email' => 'old@example.com']);
        $time = $this->makeCustomerTime($customer);
        $patient = $this->makePatient(); // no patientMeta → no email

        $this->put(route('update-customer-to-patient', $time), ['id' => $patient->id])
            ->assertRedirect();

        // Bug guard: the customer's existing email must NOT be wiped to null.
        $this->assertSame('old@example.com', $customer->fresh()->email);
    }

    public function test_customer_email_is_taken_from_patient_meta_when_present(): void
    {
        $customer = $this->makeCustomer(['email' => 'old@example.com']);
        $time = $this->makeCustomerTime($customer);
        $patient = $this->makePatient();
        $patient->patientMeta()->create(['email' => 'meta@example.com']);

        $this->put(route('update-customer-to-patient', $time), ['id' => $patient->id])
            ->assertRedirect();

        $this->assertSame('meta@example.com', $customer->fresh()->email);
    }

    private function userWithCreatePermission(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::PERMISSION);
        $user->givePermissionTo(self::PERMISSION);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function makeConsultant(): Consultant
    {
        return Consultant::create([
            'user_id'            => User::factory()->create()->id,
            'name'               => 'Dr ' . Str::random(5),
            'title'              => 'Consultant',
            'speciality'         => 'General',
            'default_time_table' => [],
            'active'             => true,
        ]);
    }

    private function makeCustomer(array $overrides = []): Customer
    {
        return Customer::create(array_merge([
            'name'  => 'Customer ' . Str::random(5),
            'phone' => '9' . random_int(10000000, 99999999),
        ], $overrides));
    }

    private function makeCustomerTime(Customer $customer): Time
    {
        return Time::create([
            'consultant_id'   => $this->makeConsultant()->id,
            'reservable_type' => 'customer',
            'reservable_id'   => $customer->id,
            'title'           => 'Reservation',
            'started_at'      => now()->addDay(),
            'ended_at'        => now()->addDay()->addHour(),
            'active'          => true,
        ]);
    }

    private function makePatient(array $overrides = []): Patient
    {
        return Patient::create(array_merge([
            'fullName'     => 'Patient ' . Str::random(5),
            'idNo'         => 'ID' . Str::random(8),
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ], $overrides));
    }
}
