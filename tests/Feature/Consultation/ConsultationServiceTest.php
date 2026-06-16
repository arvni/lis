<?php

namespace Tests\Feature\Consultation;

use App\Domains\Consultation\DTOs\ConsultationDTO;
use App\Domains\Consultation\Enums\ConsultationStatus;
use App\Domains\Consultation\Models\Consultant;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Consultation\Repositories\ConsultantRepository;
use App\Domains\Consultation\Repositories\ConsultationRepository;
use App\Domains\Consultation\Repositories\TimeRepository;
use App\Domains\Consultation\Services\ConsultationService;
use App\Domains\Setting\Repositories\SettingRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Pagination\LengthAwarePaginator;
use InvalidArgumentException;
use Mockery;
use Tests\TestCase;

class ConsultationServiceTest extends TestCase
{
    private ConsultationRepository $consultationRepo;
    private SettingRepository $settingRepo;
    private ConsultantRepository $consultantRepo;
    private TimeRepository $timeRepo;
    private ConsultationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->consultationRepo = Mockery::mock(ConsultationRepository::class);
        $this->settingRepo = Mockery::mock(SettingRepository::class);
        $this->consultantRepo = Mockery::mock(ConsultantRepository::class);
        $this->timeRepo = Mockery::mock(TimeRepository::class);
        $this->service = new ConsultationService(
            $this->consultationRepo,
            $this->settingRepo,
            $this->consultantRepo,
            $this->timeRepo,
        );
    }

    private function dto(): ConsultationDTO
    {
        $dto = Mockery::mock(ConsultationDTO::class);
        $dto->shouldReceive('toArray')->andReturn(['patient_id' => 1]);
        return $dto;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->consultationRepo->shouldReceive('listConsultation')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listConsultations([]));
    }

    public function test_get_recent_delegates(): void
    {
        $collection = new Collection();
        $this->consultationRepo->shouldReceive('getAll')->once()->andReturn($collection);
        $this->assertSame($collection, $this->service->getRecentConsultations([]));
    }

    public function test_create_delegates(): void
    {
        $consultation = new Consultation();
        $this->consultationRepo->shouldReceive('createConsultation')->once()->with(['patient_id' => 1])->andReturn($consultation);
        $this->assertSame($consultation, $this->service->createConsultation($this->dto()));
    }

    public function test_update_delegates(): void
    {
        $consultation = new Consultation();
        $this->consultationRepo->shouldReceive('updateConsultation')->once()->with($consultation, ['patient_id' => 1])->andReturn($consultation);
        $this->assertSame($consultation, $this->service->updateConsultation($consultation, $this->dto()));
    }

    public function test_delete_clears_time_and_delegates(): void
    {
        $timeRel = Mockery::mock(HasOne::class);
        $timeRel->shouldReceive('delete')->once()->andReturn(1);
        $consultation = Mockery::mock(Consultation::class)->makePartial();
        $consultation->shouldReceive('time')->once()->andReturn($timeRel);

        $this->consultationRepo->shouldReceive('deleteConsultation')->once()->with($consultation)->andReturnNull();

        $this->service->deleteConsultation($consultation);
        $this->assertTrue(true);
    }

    public function test_start_consultation_sets_started_status(): void
    {
        $consultation = new Consultation();
        $captured = null;
        $this->consultationRepo->shouldReceive('updateConsultation')->once()->andReturnUsing(function ($m, $data) use (&$captured) {
            $captured = $data;
            return $m;
        });

        $this->service->startConsultation($consultation);

        $this->assertSame(ConsultationStatus::STARTED, $captured['status']);
        $this->assertArrayHasKey('started_at', $captured);
    }

    public function test_get_available_slots_throws_when_consultant_missing(): void
    {
        $this->consultantRepo->shouldReceive('find')->once()->with(5)->andReturnNull();

        $this->expectException(InvalidArgumentException::class);
        $this->service->getAvailableTimeSlots(5, '2026-06-20');
    }

    public function test_get_available_slots_empty_when_no_schedule_for_day(): void
    {
        $consultant = new Consultant();
        $consultant->default_time_table = []; // no ranges for any day

        $this->consultantRepo->shouldReceive('find')->once()->with(7)->andReturn($consultant);
        $this->settingRepo->shouldReceive('getSettingsByClass')->once()->with('Consultation')->andReturn(['consultationDuration' => 30]);

        $this->assertSame([], $this->service->getAvailableTimeSlots(7, '2026-06-20'));
    }
}
