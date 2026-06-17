<?php

namespace Tests\Feature\Reception;

use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Services\PatientMergeService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Tests\TestCase;

class PatientMergeServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
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

    private function service(): PatientMergeService
    {
        return app(PatientMergeService::class);
    }

    public function test_it_rejects_merging_a_patient_into_itself(): void
    {
        $patient = $this->makePatient();

        $this->expectException(InvalidArgumentException::class);
        $this->service()->merge($patient, $patient);
    }

    public function test_it_deletes_the_removed_patient(): void
    {
        $keep = $this->makePatient();
        $remove = $this->makePatient();

        $this->service()->merge($keep, $remove);

        $this->assertDatabaseHas('patients', ['id' => $keep->id]);
        $this->assertDatabaseMissing('patients', ['id' => $remove->id]);
    }

    public function test_it_transfers_direct_foreign_key_relations(): void
    {
        $keep = $this->makePatient();
        $remove = $this->makePatient();

        $customerId = DB::table('customers')->insertGetId([
            'patient_id' => $remove->id,
            'name'       => 'Acme',
            'phone'      => '999' . Str::random(6),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->service()->merge($keep, $remove);

        $this->assertDatabaseHas('customers', ['id' => $customerId, 'patient_id' => $keep->id]);
    }

    public function test_it_transfers_patient_meta_when_kept_patient_has_none(): void
    {
        $keep = $this->makePatient();
        $remove = $this->makePatient();

        DB::table('patient_metas')->insert([
            'patient_id' => $remove->id,
            'profession' => 'Engineer',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->service()->merge($keep, $remove);

        $this->assertDatabaseHas('patient_metas', ['patient_id' => $keep->id, 'profession' => 'Engineer']);
        $this->assertDatabaseMissing('patient_metas', ['patient_id' => $remove->id]);
    }

    public function test_it_keeps_existing_meta_baseline_and_drops_removed_meta(): void
    {
        $keep = $this->makePatient();
        $remove = $this->makePatient();

        DB::table('patient_metas')->insert([
            'patient_id' => $keep->id,
            'profession' => 'Doctor',
        ]);
        DB::table('patient_metas')->insert([
            'patient_id' => $remove->id,
            'profession' => 'Engineer',
        ]);

        // No meta choices -> the kept patient's meta is the baseline and wins.
        $this->service()->merge($keep, $remove);

        $this->assertSame(1, DB::table('patient_metas')->where('patient_id', $keep->id)->count());
        $this->assertDatabaseHas('patient_metas', ['patient_id' => $keep->id, 'profession' => 'Doctor']);
        $this->assertDatabaseMissing('patient_metas', ['patient_id' => $remove->id]);
    }

    public function test_it_applies_chosen_meta_field_values_per_field(): void
    {
        $keep = $this->makePatient();
        $remove = $this->makePatient();

        DB::table('patient_metas')->insert([
            'patient_id' => $keep->id,
            'profession' => 'Doctor',
            'company'    => 'KeepCo',
        ]);
        DB::table('patient_metas')->insert([
            'patient_id' => $remove->id,
            'profession' => 'Engineer',
            'company'    => 'RemoveCo',
        ]);

        // Pick the removed patient's profession but keep the survivor's company.
        $this->service()->merge($keep, $remove, [], [
            'profession'       => 'Engineer',
            'company'          => 'KeepCo',
            'not_a_meta_field' => 'ignored',
        ]);

        $this->assertSame(1, DB::table('patient_metas')->where('patient_id', $keep->id)->count());
        $this->assertDatabaseHas('patient_metas', [
            'patient_id' => $keep->id,
            'profession' => 'Engineer',
            'company'    => 'KeepCo',
        ]);
        $this->assertDatabaseMissing('patient_metas', ['patient_id' => $remove->id]);
    }

    public function test_it_creates_meta_for_kept_patient_from_chosen_values_when_neither_has_meta(): void
    {
        $keep = $this->makePatient();
        $remove = $this->makePatient();

        $this->service()->merge($keep, $remove, [], ['profession' => 'Pilot']);

        $this->assertDatabaseHas('patient_metas', ['patient_id' => $keep->id, 'profession' => 'Pilot']);
    }

    public function test_it_transfers_relatives_and_drops_self_and_duplicate_links(): void
    {
        $keep = $this->makePatient();
        $remove = $this->makePatient();
        $relative = $this->makePatient();

        // Both keep and remove are linked to the same relative -> after merge this
        // collapses into a single link from keep.
        DB::table('relatives')->insert([
            ['patient_id' => $keep->id, 'relative_id' => $relative->id, 'relationship' => 'brother'],
            ['patient_id' => $remove->id, 'relative_id' => $relative->id, 'relationship' => 'brother'],
        ]);
        // A link directly between keep and remove must vanish (becomes a self link).
        DB::table('relatives')->insert([
            ['patient_id' => $keep->id, 'relative_id' => $remove->id, 'relationship' => 'father'],
        ]);

        $this->service()->merge($keep, $remove);

        $this->assertSame(0, DB::table('relatives')->whereColumn('patient_id', 'relative_id')->count());
        $this->assertSame(
            1,
            DB::table('relatives')
                ->where('patient_id', $keep->id)
                ->where('relative_id', $relative->id)
                ->count()
        );
        $this->assertSame(0, DB::table('relatives')->where('patient_id', $remove->id)->count());
        $this->assertSame(0, DB::table('relatives')->where('relative_id', $remove->id)->count());
    }

    public function test_it_transfers_polymorphic_owner_and_related_relations(): void
    {
        $keep = $this->makePatient();
        $remove = $this->makePatient();

        $ownedHash = (string) Str::uuid();
        $relatedHash = (string) Str::uuid();
        DB::table('documents')->insert([
            'hash'       => $ownedHash,
            'ext'        => 'pdf',
            'tag'        => 'document',
            'owner_type' => 'patient',
            'owner_id'   => $remove->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('documents')->insert([
            'hash'         => $relatedHash,
            'ext'          => 'pdf',
            'tag'          => 'document',
            'related_type' => 'patient',
            'related_id'   => $remove->id,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        $this->service()->merge($keep, $remove);

        $this->assertDatabaseHas('documents', ['hash' => $ownedHash, 'owner_id' => $keep->id, 'owner_type' => 'patient']);
        $this->assertDatabaseHas('documents', ['hash' => $relatedHash, 'related_id' => $keep->id, 'related_type' => 'patient']);
    }

    public function test_it_transfers_notifications(): void
    {
        $keep = $this->makePatient();
        $remove = $this->makePatient();

        $id = (string) Str::uuid();
        DB::table('notifications')->insert([
            'id'              => $id,
            'type'            => 'App\\Notifications\\Dummy',
            'notifiable_type' => 'patient',
            'notifiable_id'   => $remove->id,
            'data'            => json_encode(['x' => 1]),
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);

        $this->service()->merge($keep, $remove);

        $this->assertDatabaseHas('notifications', ['id' => $id, 'notifiable_id' => $keep->id, 'notifiable_type' => 'patient']);
    }

    public function test_it_dedupes_acceptance_item_pivot_rows(): void
    {
        $keep = $this->makePatient();
        $remove = $this->makePatient();

        Schema::disableForeignKeyConstraints();
        DB::table('acceptance_item_patient')->insert([
            ['acceptance_item_id' => 10, 'patient_id' => $keep->id, 'order' => 0],
            ['acceptance_item_id' => 10, 'patient_id' => $remove->id, 'order' => 0], // duplicate item -> dropped
            ['acceptance_item_id' => 20, 'patient_id' => $remove->id, 'order' => 0], // unique -> re-pointed
        ]);
        Schema::enableForeignKeyConstraints();

        $this->service()->merge($keep, $remove);

        $this->assertSame(0, DB::table('acceptance_item_patient')->where('patient_id', $remove->id)->count());
        $this->assertSame(1, DB::table('acceptance_item_patient')->where('patient_id', $keep->id)->where('acceptance_item_id', 10)->count());
        $this->assertSame(1, DB::table('acceptance_item_patient')->where('patient_id', $keep->id)->where('acceptance_item_id', 20)->count());
    }

    public function test_it_applies_chosen_field_values_to_the_kept_patient(): void
    {
        $keep = $this->makePatient(['phone' => null, 'firstName' => 'Old', 'lastName' => 'Name']);
        $remove = $this->makePatient(['phone' => '12345678']);

        $this->service()->merge($keep, $remove, [
            'phone'     => '12345678',
            'firstName' => 'Chosen',
            'not_a_real_field' => 'ignored',
        ]);

        $keep->refresh();
        $this->assertSame('12345678', $keep->phone);
        $this->assertSame('Chosen', $keep->firstName);
    }
}
