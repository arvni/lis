<?php

namespace App\Domains\Laboratory\Services;

use App\Domains\Laboratory\DTOs\MethodDTO;
use App\Domains\Laboratory\DTOs\MethodTestDTO;
use App\Domains\Laboratory\DTOs\TestDTO;
use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Repositories\TestRepository;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

readonly class TestService
{
    public function __construct(
        private TestRepository    $testRepository,
        private MethodService     $methodService,
        private MethodTestService $methodTestService,
    ) {}

    public function listTests(array $queryData): LengthAwarePaginator
    {
        return $this->testRepository->ListTests($queryData);
    }

    public function allTests(array $queryData): Collection
    {
        return $this->testRepository->allTests($queryData);
    }

    public function storeTest(TestDTO $testDTO, array $validatedData): Test
    {
        return DB::transaction(function () use ($testDTO, $validatedData) {
            $test = $this->testRepository->creatTest(Arr::except($testDTO->toArray(), "report_templates"));
            $this->syncReportTemplates($test, $testDTO->report_templates);
            $this->syncTestRelationships($test, $validatedData);
            return $test;
        });
    }

    public function updateTest(Test $test, TestDTO $testDTO, array $validatedData): Test
    {
        return DB::transaction(function () use ($test, $testDTO, $validatedData) {
            $updatedTest = $this->testRepository->updateTest($test, $testDTO->toArray());
            $this->syncReportTemplates($updatedTest, $testDTO->report_templates);
            $this->syncTestRelationships($updatedTest, $validatedData);
            return $updatedTest;
        });
    }

    /**
     * @throws Exception
     */
    public function deleteTest(Test $test): void
    {
        if (!$test->methods()->withCount("acceptanceItems")->having("acceptance_items_count", ">", 0)->exists()) {
            if ($test->type !== TestType::PANEL)
                $test->methods()->delete();
            $this->testRepository->deleteTest($test);
        } else
            throw new Exception("There is some Method that use this Test", 400);
    }

    public function syncMethods(Test $test, array $ids): void
    {
        if ($test->type !== TestType::PANEL) {
            if ($test->methods()->whereIn("id", $ids)->count() !== count($ids))
                $test->MethodTests()->whereNotIn("method_id", $ids)->update(["status" => false]);

        } else
            $test->methods()->sync($ids);
    }

    public function loadTest(Test $test, int|array|null $referrer = null): Test
    {
        $load = [
            "methodTests.method.workflow",
            "methodTests.method.barcodeGroup",
            "methodTests.method.test.sampleTypes",
            "reportTemplates",
            "testGroups",
            "offers" => function ($q) use ($referrer) {
                $q->where("started_at", "<=", now())
                    ->where("ended_at", ">=", now())
                    ->where("active", true);
                if ($referrer)
                    $q->where(function ($q) use ($referrer) {
                        $q->whereHas("referrers", function ($q) use ($referrer) {
                            $q->where("referrers.id", $referrer);
                        })->orWhereDoesntHave("referrers");
                    });
            }
        ];
        if ($referrer) {
            $load["referrerTest"] = function ($query) use ($referrer) {
                $query->where("referrer_id", $referrer);
            };
        }
        $test->load($load);
        return $test;
    }

    private function syncTestRelationships(Test $test, array $validatedData): void
    {
        $this->handleMethodTests($test, $validatedData["method_tests"]);
        $this->syncSampleTypeTests($test, $validatedData["sample_type_tests"] ?? []);
        $this->syncTestGroupTests($test, $validatedData["test_groups"] ?? []);
    }

    private function handleMethodTests(Test $test, array $methodTests): void
    {
        match ($test->type) {
            TestType::PANEL => $this->handlePanelMethodTests($test, $methodTests),
            default => $this->handleNonPanelMethodTests($test, $methodTests),
        };
    }

    private function handleNonPanelMethodTests(Test $test, array $methodTests): void
    {
        foreach ($methodTests as $methodTest) {
            $methodDto = new MethodDTO(
                name: $methodTest["method"]["name"],
                barcodeGroupId: $methodTest["method"]["barcode_group"]["id"] ?? null,
                workflowId: $methodTest["method"]["workflow"]["id"] ?? null,
                status: $methodTest["method"]["status"] ?? true,
                price_type: MethodPriceType::from($methodTest["method"]["price_type"]),
                price: $methodTest["method"]["price"] ?? 0,
                turnaround_time: $methodTest["method"]["turnaround_time"] ?? null,
                extra: $methodTest["method"]["extra"] ?? null,
                noPatient: $methodTest["method"]["no_patient"] ?? 1,
                referrer_price_type: MethodPriceType::from($methodTest["method"]["referrer_price_type"]),
                referrer_price: $methodTest["method"]["referrer_price"] ?? 0,
                referrer_extra: $methodTest["method"]["referrer_extra"] ?? null,
                noSample: $methodTest["method"]["no_sample"] ?? 1,
            );
            $method = null;
            if ($methodTest["method"]["id"] ?? null)
                $method = $this->methodService->findMethodById($methodTest["method"]["id"]);
            if ($method)
                $this->methodService->updateMethod($method, $methodDto);
            else
                $method = $this->methodService->storeMethod($methodDto);

            $methodTestDTO = new MethodTestDTO(
                method_id: $method->id,
                test_id: $test->id,
                is_default: true,
                status: $methodTest["status"] ?? true
            );
            $oldMethodTest = null;
            if ($methodTest["id"] ?? null)
                $oldMethodTest = $this->methodTestService->findMethodTestById($methodTest["id"]);
            if ($oldMethodTest)
                $this->methodTestService->updateMethodTest($oldMethodTest, $methodTestDTO);
            else
                $this->methodTestService->storeMethodTest($methodTestDTO);
        }
    }

    private function handlePanelMethodTests(Test $test, array $methodTests): void
    {
        foreach ($methodTests as $methodTest) {
            $methodTestDTO = new MethodTestDTO(
                method_id: $methodTest["method"]["id"],
                test_id: $test->id,
                is_default: false,
                status: $methodTest["status"] ?? true
            );

            $oldMethodTest = null;
            if ($methodTest["id"] ?? null)
                $oldMethodTest = $this->methodTestService->findMethodTestById($methodTest["id"]);
            if ($oldMethodTest)
                $this->methodTestService->updateMethodTest($oldMethodTest, $methodTestDTO);
            else
                $this->methodTestService->storeMethodTest($methodTestDTO);
        }
    }

    private function syncSampleTypeTests(Test $test, array $sampleTypeTests): void
    {
        if (empty($sampleTypeTests)) return;

        $syncData = collect($sampleTypeTests)
            ->keyBy("sample_type.id")
            ->map(fn($item) => [
                "description" => $item["description"],
                "defaultType" => $item["defaultType"]
            ])
            ->toArray();

        $test->sampletypes()->sync($syncData);
    }

    private function syncTestGroupTests(Test $test, array $testGroups): void
    {
        if (empty($testGroups)) return;

        $syncData = collect($testGroups)
            ->map(fn($item) => $item["id"])
            ->toArray();

        $test->testGroups()->sync($syncData);
    }

    private function syncReportTemplates(Test $test, array $reportTemplates): void
    {
        if (count($reportTemplates))
            $test->reportTemplates()->sync(Arr::pluck($reportTemplates, "id"));
    }
}
