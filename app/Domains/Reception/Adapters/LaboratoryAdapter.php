<?php

namespace App\Domains\Reception\Adapters;


use App\Domains\Laboratory\Models\Doctor;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Repositories\MethodRepository;
use App\Domains\Laboratory\Repositories\TestRepository;
use App\Domains\Laboratory\Services\DoctorService;
use App\Domains\Reception\Models\AcceptanceItem;
use Illuminate\Database\Eloquent\Collection;

/**
 * Adapter that translates between Reception and Laboratory domains
 */
class LaboratoryAdapter
{
    private MethodRepository $methodRepository;
    private TestRepository $testRepository;
    private DoctorService $doctorService;

    public function __construct(
        MethodRepository $methodRepository,
        TestRepository   $testRepository,
        DoctorService    $doctorService
    )
    {
        $this->methodRepository = $methodRepository;
        $this->testRepository = $testRepository;
        $this->doctorService = $doctorService;
    }

    /**
     * Get laboratory method for a reception acceptance item
     *
     * @param AcceptanceItem $acceptanceItem
     * @return Method
     */
    public function getMethodForAcceptanceItem(AcceptanceItem $acceptanceItem): Method
    {
        return $this->methodRepository->findMethodByMethodTestId($acceptanceItem->method_test_id);
    }

    /**
     * Get laboratory test for a reception acceptance item
     *
     * @param AcceptanceItem $acceptanceItem
     * @return Test
     */
    public function getTestForAcceptanceItem(AcceptanceItem $acceptanceItem): Test
    {
        return $this->testRepository->findTestByMethodTestId($acceptanceItem->method_test_id);
    }

    /**
     * Get template URL for a report template
     *
     * @param Collection $reportTemplates
     * @return array
     */
    public function getTemplateUrl(Collection $reportTemplates): array
    {
        $output = [];
        foreach ($reportTemplates as $reportTemplate) {
            $reportTemplate->load(["parameters", "template"]);
            if ($reportTemplate->template) {
                $reportTemplate->template = route("documents.show", $reportTemplate->template->hash);
            }
            $output[] = $reportTemplate;
        }


        return $output;
    }

    public function createOrGetDoctor(array $data): Doctor
    {
        return $this->doctorService->createOrGetDoctor($data);
    }

    public function getTestById(int $id)
    {
        $test = $this->testRepository->findTestById($id);
        $test?->load(["methodTests"]);
        return $test;
    }

}
