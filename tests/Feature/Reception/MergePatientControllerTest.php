<?php

namespace Tests\Feature\Reception;

use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class MergePatientControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Reception.Patients.Merge Patients';

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs($this->userWithMergePermission());
    }

    private function userWithMergePermission(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::PERMISSION);
        $user->givePermissionTo(self::PERMISSION);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
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

    public function test_create_renders_merge_page_with_field_lists(): void
    {
        $this->get(route('patients.merge.create'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Patient/Merge')
                ->has('fields')
                ->has('metaFields'));
    }

    public function test_compare_returns_date_of_birth_as_plain_date_not_iso_string(): void
    {
        $first = $this->makePatient(['dateOfBirth' => '1991-09-22']);
        $second = $this->makePatient(['dateOfBirth' => '2009-05-02']);

        $response = $this->getJson(route('api.patients.mergeCompare', [
            'first_id' => $first->id,
            'second_id' => $second->id,
        ]))->assertOk();

        // The bug: dateOfBirth used to serialise as "1991-09-22T20:00:00.000000Z",
        // which MySQL then rejected when chosen and saved back.
        $response->assertJsonPath('first.fields.dateOfBirth', '1991-09-22');
        $response->assertJsonPath('second.fields.dateOfBirth', '2009-05-02');
        $this->assertStringNotContainsString('T', $response->json('first.fields.dateOfBirth'));
    }

    public function test_compare_exposes_avatar_meta_and_relation_buckets(): void
    {
        $first = $this->makePatient();
        $second = $this->makePatient();

        $this->getJson(route('api.patients.mergeCompare', [
            'first_id' => $first->id,
            'second_id' => $second->id,
        ]))
            ->assertOk()
            ->assertJsonStructure([
                'first' => [
                    'id', 'fullName',
                    'fields' => ['avatar', 'firstName', 'idNo', 'dateOfBirth', 'gender'],
                    'meta' => ['maritalStatus', 'company', 'profession', 'address', 'email', 'details'],
                    'relations' => ['acceptances', 'consultations', 'samples', 'invoices', 'payments', 'documents', 'relatives'],
                ],
                'second' => ['id', 'fields', 'meta', 'relations'],
            ]);
    }

    public function test_compare_rejects_identical_patients(): void
    {
        $patient = $this->makePatient();

        $this->getJson(route('api.patients.mergeCompare', [
            'first_id' => $patient->id,
            'second_id' => $patient->id,
        ]))->assertStatus(422);
    }

    public function test_merge_applies_chosen_values_transfers_relations_and_redirects(): void
    {
        $keep = $this->makePatient(['phone' => null, 'dateOfBirth' => '2009-05-02']);
        $remove = $this->makePatient([
            'phone'       => '78454640',
            'dateOfBirth' => '1991-09-22',
            'avatar'      => '/documents/abc.png',
        ]);

        // A relation on the removed patient that must move to the kept patient.
        $customerId = DB::table('customers')->insertGetId([
            'patient_id' => $remove->id,
            'name'       => 'Acme',
            'phone'      => '999' . Str::random(6),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Drive the real frontend flow: read the comparison, then submit choices
        // built from that payload (so dateOfBirth is the normalised Y-m-d value).
        $compare = $this->getJson(route('api.patients.mergeCompare', [
            'first_id' => $keep->id,
            'second_id' => $remove->id,
        ]))->json();

        $response = $this->post(route('patients.merge'), [
            'keep_id'   => $keep->id,
            'remove_id' => $remove->id,
            'attributes' => [
                'phone'       => $compare['second']['fields']['phone'],
                'avatar'      => $compare['second']['fields']['avatar'],
                'dateOfBirth' => $compare['second']['fields']['dateOfBirth'],
            ],
            'meta' => [
                'profession' => 'Pilot',
            ],
        ]);

        $response->assertRedirect(route('patients.show', $keep->id));
        $response->assertSessionHas('success', true);

        $this->assertDatabaseMissing('patients', ['id' => $remove->id]);
        $this->assertDatabaseHas('patients', [
            'id'          => $keep->id,
            'phone'       => '78454640',
            'avatar'      => '/documents/abc.png',
            'dateOfBirth' => '1991-09-22',
        ]);
        $this->assertDatabaseHas('customers', ['id' => $customerId, 'patient_id' => $keep->id]);
        $this->assertDatabaseHas('patient_metas', ['patient_id' => $keep->id, 'profession' => 'Pilot']);
    }

    public function test_merge_validates_that_patients_differ(): void
    {
        $patient = $this->makePatient();

        $this->post(route('patients.merge'), [
            'keep_id'   => $patient->id,
            'remove_id' => $patient->id,
        ])->assertSessionHasErrors('remove_id');

        $this->assertDatabaseHas('patients', ['id' => $patient->id]);
    }

    public function test_merge_requires_the_merge_permission(): void
    {
        $keep = $this->makePatient();
        $remove = $this->makePatient();

        // A fresh user without the merge permission.
        $this->actingAs(User::factory()->create());

        $this->post(route('patients.merge'), [
            'keep_id'   => $keep->id,
            'remove_id' => $remove->id,
        ])->assertForbidden();

        $this->assertDatabaseHas('patients', ['id' => $remove->id]);
    }

    public function test_create_page_requires_the_merge_permission(): void
    {
        $this->actingAs(User::factory()->create());

        $this->get(route('patients.merge.create'))->assertForbidden();
    }
}
