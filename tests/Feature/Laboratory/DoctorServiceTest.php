<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\DoctorDTO;
use App\Domains\Laboratory\Models\Doctor;
use App\Domains\Laboratory\Repositories\DoctorRepository;
use App\Domains\Laboratory\Services\DoctorService;
use Exception;
use Mockery;
use Tests\TestCase;

class DoctorServiceTest extends TestCase
{
    private DoctorRepository $repo;
    private DoctorService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(DoctorRepository::class);
        $this->service = new DoctorService($this->repo);
    }

    private function dto(array $data = ['name' => 'Dr X']): DoctorDTO
    {
        $dto = Mockery::mock(DoctorDTO::class);
        $dto->shouldReceive('toArray')->andReturn($data);
        return $dto;
    }

    private function doctorWithMethods(bool $has): Doctor
    {
        $relation = Mockery::mock();
        $relation->shouldReceive('exists')->andReturn($has);
        $doctor = Mockery::mock(Doctor::class)->makePartial();
        $doctor->shouldReceive('methods')->andReturn($relation);
        return $doctor;
    }

    public function test_list_delegates(): void
    {
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListDoctors')->once()->with([])->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listDoctors([]));
    }

    public function test_store_delegates(): void
    {
        $doctor = new Doctor();
        $this->repo->shouldReceive('creatDoctor')->once()->with(['name' => 'Dr X'])->andReturn($doctor);
        $this->assertSame($doctor, $this->service->storeDoctor($this->dto()));
    }

    public function test_update_delegates(): void
    {
        $doctor = new Doctor();
        $this->repo->shouldReceive('updateDoctor')->once()->with($doctor, ['name' => 'Dr X'])->andReturn($doctor);
        $this->assertSame($doctor, $this->service->updateDoctor($doctor, $this->dto()));
    }

    public function test_delete_removes_doctor_without_methods(): void
    {
        $doctor = $this->doctorWithMethods(false);
        $this->repo->shouldReceive('deleteDoctor')->once()->with($doctor)->andReturnNull();
        $this->service->deleteDoctor($doctor);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_doctor_has_methods(): void
    {
        $doctor = $this->doctorWithMethods(true);
        $this->repo->shouldNotReceive('deleteDoctor');
        $this->expectException(Exception::class);
        $this->service->deleteDoctor($doctor);
    }

    public function test_create_or_get_returns_existing_doctor(): void
    {
        $existing = new Doctor();
        $this->repo->shouldReceive('getDoctorByName')->once()->with('Dr X')->andReturn($existing);
        $this->repo->shouldNotReceive('creatDoctor');
        $this->assertSame($existing, $this->service->createOrGetDoctor(['name' => 'Dr X']));
    }

    public function test_create_or_get_creates_when_missing(): void
    {
        $created = new Doctor();
        $this->repo->shouldReceive('getDoctorByName')->once()->with('New')->andReturnNull();
        $this->repo->shouldReceive('creatDoctor')->once()->with(['name' => 'New'])->andReturn($created);
        $this->assertSame($created, $this->service->createOrGetDoctor(['name' => 'New']));
    }
}
