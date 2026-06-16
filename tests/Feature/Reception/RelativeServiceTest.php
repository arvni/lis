<?php

namespace Tests\Feature\Reception;

use App\Domains\Reception\DTOs\RelativeDTO;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Relative;
use App\Domains\Reception\Services\RelativeService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RelativeServiceTest extends TestCase
{
    use RefreshDatabase;

    private RelativeService $service;
    private Patient $patient;
    private Patient $relativePatient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->service = new RelativeService();

        $this->patient = $this->makePatient('Main');
        $this->relativePatient = $this->makePatient('Kin');
    }

    public function test_make_relative_creates_record(): void
    {
        $this->service->makeRelative(new RelativeDTO(
            $this->patient->id,
            $this->relativePatient->id,
            'father',
        ));

        $this->assertDatabaseHas('relatives', [
            'patient_id'   => $this->patient->id,
            'relative_id'  => $this->relativePatient->id,
            'relationship' => 'father',
        ]);
    }

    public function test_make_relative_joins_array_relationship_into_string(): void
    {
        $this->service->makeRelative(new RelativeDTO(
            $this->patient->id,
            $this->relativePatient->id,
            ['father', 'guardian'],
        ));

        $this->assertDatabaseHas('relatives', [
            'patient_id'   => $this->patient->id,
            'relationship' => 'father,guardian',
        ]);
    }

    public function test_update_relation_changes_relationship(): void
    {
        $relative = Relative::create([
            'patient_id'   => $this->patient->id,
            'relative_id'  => $this->relativePatient->id,
            'relationship' => 'father',
        ]);

        $this->service->updateRelation($relative, new RelativeDTO(
            $this->patient->id,
            $this->relativePatient->id,
            'brother',
        ));

        // relationship is stored as a comma-joined string and cast back to an array on read.
        $this->assertSame(['brother'], (array) $relative->fresh()->relationship);
    }

    public function test_delete_relation_removes_record(): void
    {
        $relative = Relative::create([
            'patient_id'   => $this->patient->id,
            'relative_id'  => $this->relativePatient->id,
            'relationship' => 'father',
        ]);

        $this->service->deleteRelation($relative);

        $this->assertDatabaseMissing('relatives', ['id' => $relative->id]);
    }

    private function makePatient(string $label): Patient
    {
        return Patient::create([
            'fullName'     => "Relative $label",
            'idNo'         => strtoupper($label) . uniqid(),
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }
}
