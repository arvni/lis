<?php

namespace Tests\Feature\Reception;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\DTOs\SampleDTO;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Sample;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Reception\Repositories\SampleRepository;
use App\Domains\Reception\Services\SampleService;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class SampleServiceTest extends TestCase
{
    use RefreshDatabase;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());

        $this->patient = Patient::create([
            'fullName'     => 'Sample Patient',
            'idNo'         => 'SMP001',
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }

    private function makeDTO(array $overrides = []): SampleDTO
    {
        return new SampleDTO(
            patientId: $overrides['patientId'] ?? $this->patient->id,
            sampleTypeId: $overrides['sampleTypeId'] ?? 1,
            samplerId: $overrides['samplerId'] ?? auth()->id(),
            sampleLocation: $overrides['sampleLocation'] ?? 'Lab',
            collectionDate: $overrides['collectionDate'] ?? now()->toDateString(),
            acceptanceItems: $overrides['acceptanceItems'] ?? [['id' => 1]],
            status: $overrides['status'] ?? 'collected',
            barcodeGroup: $overrides['barcodeGroup'] ?? ['abbr' => 'BL'],
            barcode: $overrides['barcode'] ?? null,
            materialId: $overrides['materialId'] ?? null,
            receivedAt: $overrides['receivedAt'] ?? now()->toDateString(),
            collectRequestId: $overrides['collectRequestId'] ?? null,
        );
    }

    // ── Thin delegations ───────────────────────────────────────────────────────

    public function test_list_samples_delegates_to_repository(): void
    {
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
        $repo = Mockery::mock(SampleRepository::class);
        $repo->shouldReceive('listSamples')->once()->with(['q' => 1])->andReturn($paginator);
        $service = new SampleService($repo, Mockery::mock(AcceptanceItemRepository::class));

        $this->assertSame($paginator, $service->listSamples(['q' => 1]));
    }

    public function test_list_sample_barcodes_delegates_to_repository(): void
    {
        $repo = Mockery::mock(SampleRepository::class);
        $repo->shouldReceive('listSampleBarcodes')->once()->andReturn(new Collection());
        $service = new SampleService($repo, Mockery::mock(AcceptanceItemRepository::class));

        $this->assertInstanceOf(Collection::class, $service->listSampleBarcodes([]));
    }

    public function test_find_sample_by_id_delegates_to_repository(): void
    {
        $sample = new Sample();
        $repo = Mockery::mock(SampleRepository::class);
        $repo->shouldReceive('findSampleById')->once()->with(7)->andReturn($sample);
        $service = new SampleService($repo, Mockery::mock(AcceptanceItemRepository::class));

        $this->assertSame($sample, $service->findSampleById(7));
    }

    public function test_find_sample_by_barcode_delegates_to_repository(): void
    {
        $repo = Mockery::mock(SampleRepository::class);
        $repo->shouldReceive('findSampleByBarcode')->once()->with('BL123')->andReturnNull();
        $service = new SampleService($repo, Mockery::mock(AcceptanceItemRepository::class));

        $this->assertNull($service->findSampleByBarcode('BL123'));
    }

    public function test_update_sample_delegates_to_repository(): void
    {
        $sample = new Sample();
        $repo = Mockery::mock(SampleRepository::class);
        $repo->shouldReceive('updateSample')->once()->andReturn($sample);
        $service = new SampleService($repo, Mockery::mock(AcceptanceItemRepository::class));

        $this->assertSame($sample, $service->updateSample($sample, $this->makeDTO()));
    }

    public function test_delete_sample_delegates_to_repository(): void
    {
        $sample = new Sample();
        $repo = Mockery::mock(SampleRepository::class);
        $repo->shouldReceive('deleteSample')->once()->with($sample)->andReturnNull();
        $service = new SampleService($repo, Mockery::mock(AcceptanceItemRepository::class));

        $service->deleteSample($sample);
        $this->assertTrue(true);
    }

    // ── storeSample branches ─────────────────────────────────────────────────────

    public function test_store_sample_creates_new_when_no_active_sample(): void
    {
        $repo = Mockery::mock(SampleRepository::class);
        $repo->shouldReceive('findActiveSample')->once()->andReturnNull();
        $repo->shouldReceive('findDeactivatedSample')->once()->andReturnNull();

        $created = new Sample();
        $captured = null;
        $repo->shouldReceive('creatSample')->once()->andReturnUsing(function ($data) use (&$captured, $created) {
            $captured = $data;
            return $created;
        });

        $service = new SampleService($repo, Mockery::mock(AcceptanceItemRepository::class));
        // Provide barcode + materialId so generateBarcode (DB) is skipped.
        $result = $service->storeSample($this->makeDTO(['barcode' => 'BL999', 'materialId' => 5]));

        $this->assertSame($created, $result);
        $this->assertArrayNotHasKey('id', $captured);
        $this->assertSame('BL999', $captured['barcode']);
    }

    public function test_store_sample_appends_R_suffix_from_deactivated_sample(): void
    {
        $repo = Mockery::mock(SampleRepository::class);
        $repo->shouldReceive('findActiveSample')->once()->andReturnNull();

        $deactivated = new Sample(['barcode' => 'BL123']);
        $repo->shouldReceive('findDeactivatedSample')->once()->andReturn($deactivated);

        $captured = null;
        $repo->shouldReceive('creatSample')->once()->andReturnUsing(function ($data) use (&$captured) {
            $captured = $data;
            return new Sample();
        });

        $service = new SampleService($repo, Mockery::mock(AcceptanceItemRepository::class));
        // materialId set so the recycled barcode "BL123R" is kept rather than regenerated.
        $service->storeSample($this->makeDTO(['materialId' => 5]));

        $this->assertSame('BL123R', $captured['barcode']);
    }

    public function test_store_sample_reuses_existing_sample_and_syncs_items(): void
    {
        $existing = new Sample();
        $repo = Mockery::mock(SampleRepository::class);
        $repo->shouldReceive('findActiveSample')->once()->andReturn($existing);
        // No acceptance_items in DB → "needs more samples" query is false → reuse path.
        $repo->shouldReceive('syncAcceptanceItems')->once()->with($existing, [1])->andReturnNull();

        $service = new SampleService($repo, Mockery::mock(AcceptanceItemRepository::class));
        $result = $service->storeSample($this->makeDTO(['acceptanceItems' => [['id' => 1]]]));

        $this->assertSame($existing, $result);
    }

    // ── generateBarcode (real DB) ────────────────────────────────────────────────

    public function test_generate_barcode_prefixes_group_abbreviation(): void
    {
        $acceptance = Acceptance::create([
            'status'              => \App\Domains\Reception\Enums\AcceptanceStatus::PENDING,
            'step'                => 5,
            'patient_id'          => $this->patient->id,
            'acceptor_id'         => auth()->id(),
            'financial_approved'  => false,
            'out_patient'         => false,
            'waiting_for_pooling' => false,
        ]);

        $test = Test::create(['name' => 'S', 'fullName' => 'S', 'code' => 'S' . uniqid(), 'type' => TestType::TEST, 'status' => true, 'can_merge' => false]);
        $method = Method::create(['name' => 'M', 'price' => 0, 'turnaround_time' => 1, 'status' => true, 'no_patient' => 1, 'no_sample' => 1]);
        $methodTest = MethodTest::create(['method_id' => $method->id, 'test_id' => $test->id, 'is_default' => true, 'status' => true]);

        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTest->id,
            'price'            => 50,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        $service = new SampleService(app(SampleRepository::class), app(AcceptanceItemRepository::class));
        $barcode = $service->generateBarcode($this->makeDTO(['acceptanceItems' => [['id' => $item->id]]]), 0);

        $this->assertStringStartsWith('BL', $barcode);
    }
}
