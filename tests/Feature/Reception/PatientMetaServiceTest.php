<?php

namespace Tests\Feature\Reception;

use App\Domains\Reception\DTOs\PatientMetaDTO;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\PatientMeta;
use App\Domains\Reception\Repositories\PatientRepository;
use App\Domains\Reception\Services\PatientMetaService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PatientMetaServiceTest extends TestCase
{
    use RefreshDatabase;

    private PatientMetaService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->service = new PatientMetaService(app(PatientRepository::class));
    }

    public function test_update_patient_updates_existing_meta_row(): void
    {
        $patient = Patient::create([
            'fullName'     => 'Meta Patient',
            'idNo'         => 'META001',
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);

        $patient->patientMeta()->save(new PatientMeta([
            'company'    => 'Old Co',
            'profession' => 'Old Job',
            'email'      => 'old@example.com',
        ]));

        $this->service->updatePatient($patient, new PatientMetaDTO(
            maritalStatus: true,
            company: 'New Co',
            profession: 'Engineer',
            email: 'new@example.com',
            address: '123 Street',
            details: 'Some notes',
        ));

        $meta = $patient->patientMeta()->first();
        $this->assertSame('New Co', $meta->company);
        $this->assertSame('Engineer', $meta->profession);
        $this->assertSame('new@example.com', $meta->email);
        $this->assertSame('123 Street', $meta->address);
        $this->assertSame('Some notes', $meta->details);
    }
}
