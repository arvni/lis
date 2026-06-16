<?php

namespace Tests\Feature\Reception;

use App\Domains\Reception\DTOs\PatientDTO;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Repositories\PatientRepository;
use App\Domains\Reception\Services\PatientService;
use App\Domains\User\Models\User;
use Exception;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class PatientServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
    }

    private function makeDTO(array $overrides = []): PatientDTO
    {
        return new PatientDTO(
            firstName: $overrides['firstName'] ?? 'John',
            lastName: $overrides['lastName'] ?? 'Doe',
            secondName: null,
            thirdName: null,
            idNo: $overrides['idNo'] ?? 'PID' . uniqid(),
            nationality: 'OM',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            avatar: $overrides['avatar'] ?? [],
        );
    }

    private function makePatient(string $id = 'P1'): Patient
    {
        return Patient::create([
            'fullName'     => 'Patient ' . $id,
            'idNo'         => $id . uniqid(),
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }

    // ── Delegations (mocked repository) ──────────────────────────────────────────

    public function test_list_patients_delegates_to_repository(): void
    {
        $repo = Mockery::mock(PatientRepository::class);
        $repo->shouldReceive('listPatient')->once()->with(['x' => 1])->andReturn('PAGE');
        $service = new PatientService($repo);

        $this->assertSame('PAGE', $service->listPatients(['x' => 1]));
    }

    public function test_get_patient_by_id_no_delegates_to_repository(): void
    {
        $patient = new Patient();
        $repo = Mockery::mock(PatientRepository::class);
        $repo->shouldReceive('findPatientByIdNo')->once()->with('ABC')->andReturn($patient);
        $service = new PatientService($repo);

        $this->assertSame($patient, $service->getPatientByIdNo('ABC'));
    }

    public function test_get_patient_by_id_delegates_to_repository(): void
    {
        $patient = new Patient();
        $repo = Mockery::mock(PatientRepository::class);
        $repo->shouldReceive('findPatientById')->once()->with(9)->andReturn($patient);
        $service = new PatientService($repo);

        $this->assertSame($patient, $service->getPatientById(9));
    }

    public function test_get_patient_stats_aggregates_counts(): void
    {
        $repo = Mockery::mock(PatientRepository::class);
        $repo->shouldReceive('countPatients')->once()->withNoArgs()->andReturn(42);
        $repo->shouldReceive('countPatients')->once()->with('nationality')->andReturn(['OM' => 30]);
        $repo->shouldReceive('countPatients')->once()->with('gender')->andReturn(['male' => 20]);
        $service = new PatientService($repo);

        $stats = $service->getPatientStats();

        $this->assertSame(42, $stats['patients']);
        $this->assertSame(['OM' => 30], $stats['patientsPerNation']);
        $this->assertSame(['male' => 20], $stats['patientsPerGender']);
    }

    public function test_create_patient_delegates_without_avatar(): void
    {
        $created = new Patient();
        $repo = Mockery::mock(PatientRepository::class);
        $repo->shouldReceive('createPatient')->once()->andReturn($created);
        $service = new PatientService($repo);

        $this->assertSame($created, $service->createPatient($this->makeDTO()));
    }

    // ── deletePatient guard (real DB) ────────────────────────────────────────────

    public function test_delete_patient_removes_patient_without_associations(): void
    {
        $patient = $this->makePatient('Del');
        $service = app(PatientService::class);

        $service->deletePatient($patient);

        $this->assertDatabaseMissing('patients', ['id' => $patient->id]);
    }

    public function test_delete_patient_throws_when_consultations_exist(): void
    {
        $patient = $this->makePatient('Has');
        $consultant = \App\Domains\Consultation\Models\Consultant::create([
            'user_id' => User::factory()->create()->id,
            'name'    => 'Dr Test',
            'active'  => true,
        ]);
        \App\Domains\Consultation\Models\Consultation::create([
            'patient_id'    => $patient->id,
            'consultant_id' => $consultant->id,
            'dueDate'       => now(),
            'information'   => [],
            'status'        => \App\Domains\Consultation\Enums\ConsultationStatus::cases()[0],
        ]);

        $service = app(PatientService::class);

        $this->expectException(Exception::class);
        $this->expectExceptionMessage('associated acceptances or consultations');
        $service->deletePatient($patient);
    }

    // ── getPatientDetails (real DB) ──────────────────────────────────────────────

    public function test_get_patient_details_returns_full_structure(): void
    {
        $patient = $this->makePatient('Det');
        $service = app(PatientService::class);

        $details = $service->getPatientDetails($patient);

        $this->assertArrayHasKey('patient', $details);
        $this->assertArrayHasKey('relatives', $details);
        $this->assertArrayHasKey('invoices', $details);
        $this->assertArrayHasKey('acceptances', $details);
        $this->assertArrayHasKey('stats', $details);
        $this->assertSame(0, $details['stats']['invoices']);
        $this->assertSame(0, $details['stats']['acceptances']);
        $this->assertSame($patient->id, $details['patient']->id);
    }
}
