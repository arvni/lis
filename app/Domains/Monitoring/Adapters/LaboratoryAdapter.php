<?php

namespace App\Domains\Monitoring\Adapters;

use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Repositories\SectionRepository;
use Illuminate\Support\Collection;

/**
 * Adapter that translates between Monitoring and Laboratory domains.
 */
class LaboratoryAdapter
{
    public function __construct(private SectionRepository $sectionRepository) {}

    /**
     * Active lab sections as lightweight {id, name} options for the node form.
     *
     * @return Collection<int, array{id: int, name: string}>
     */
    public function activeSectionsForSelect(): Collection
    {
        return $this->sectionRepository->getActiveOrdered()
            ->map(fn (Section $s) => ['id' => $s->id, 'name' => $s->name])
            ->values();
    }
}
