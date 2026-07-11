<?php

namespace App\Domains\Reception\Adapters;


use App\Domains\Laboratory\Models\Doctor;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Repositories\MethodRepository;
use App\Domains\Laboratory\Repositories\MethodTestRepository;
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
    private MethodTestRepository $methodTestRepository;
    private DoctorService $doctorService;

    public function __construct(
        MethodRepository     $methodRepository,
        TestRepository       $testRepository,
        MethodTestRepository $methodTestRepository,
        DoctorService        $doctorService
    )
    {
        $this->methodRepository = $methodRepository;
        $this->testRepository = $testRepository;
        $this->methodTestRepository = $methodTestRepository;
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

    public function getTestById(int $id): ?Test
    {
        $test = $this->testRepository->findTestById($id);
        $test?->load(["methodTests"]);
        return $test;
    }

    /**
     * Plain test lookup (no eager loads, unlike getTestById) — used by the pricing cascade.
     */
    public function findTest(int|string $id): ?Test
    {
        return $this->testRepository->findTestById($id);
    }

    /**
     * Plain method lookup — used by the pricing cascade.
     */
    public function findMethod(int|string $id): ?Method
    {
        return $this->methodRepository->findMethodById($id);
    }

    /**
     * A method's default individual MethodTest (target when ejecting items from a panel).
     */
    public function findDefaultMethodTestForMethod(int|string $methodId): ?MethodTest
    {
        return $this->methodTestRepository->findDefaultMethodTestForMethod($methodId);
    }

    /**
     * The MethodTests forming a panel, with test (+ sample types) and method loaded.
     *
     * @param  array<int, int|string>  $ids
     * @return Collection<int, MethodTest>
     */
    public function getPanelMethodTests(array $ids): Collection
    {
        return $this->methodTestRepository->getMethodTestsByIdsWithPanelRelations($ids);
    }

}
