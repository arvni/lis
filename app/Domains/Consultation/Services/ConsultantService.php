<?php

namespace App\Domains\Consultation\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Consultation\DTOs\ConsultantDTO;
use App\Domains\Consultation\Events\ConsultantDocumentUpdateEvent;
use App\Domains\Consultation\Models\Consultant;
use App\Domains\Consultation\Repositories\ConsultantRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

class ConsultantService
{
    public function __construct(protected ConsultantRepository $consultantRepository)
    {
    }

    public function listConsultants(array $filters): LengthAwarePaginator
    {
        return $this->consultantRepository->all($filters);
    }

    public function createConsultant(ConsultantDTO $consultantDTO): Consultant
    {
        $consultant = $this->consultantRepository->create([
            ...Arr::except($consultantDTO->toArray(), ['avatar']),
            "avatar" => $consultantDTO->avatar['id'] ? relative_route("documents.download", [$consultantDTO->avatar['id']]) : $consultantDTO->avatar,
        ]);
        $this->handleDocumentUpdate($consultant, $consultantDTO);
        return $consultant;
    }

    public function updateConsultant(Consultant $consultant, ConsultantDTO $consultantDTO): Consultant
    {
        $this->handleDocumentUpdate($consultant, $consultantDTO);
        if (isset($consultantDTO->avatar['id'])) {
            $consultantDTO->avatar = relative_route("documents.download", [$consultantDTO->avatar['id']]);
        }
        return $this->consultantRepository->update(
            $consultant,
            $consultantDTO->toArray()
        );
    }

    public function deleteConsultant(Consultant $consultant): void
    {
        $this->consultantRepository->delete($consultant);
    }

    private function handleDocumentUpdate(Consultant $consultant, ConsultantDTO $consultantDTO): void
    {

        if (isset($consultantDTO->avatar['id'])) {
            ConsultantDocumentUpdateEvent::dispatch($consultantDTO->avatar['id'], $consultant->id, DocumentTag::AVATAR->value);

        }
        if ($consultant->isDirty())
            $consultant->save();
    }

    public function loadConsultantRelation(Consultant $consultant): Consultant
    {
        return $consultant->load([
            'user',
            'consultations',
            'consultations.patient'
        ])
            ->loadCount([
                'consultations',
                'upcomingTimes',
                'upcomingConsultations',
            ]);
    }
}
