<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\TestDTO;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Repositories\TestRepository;
use Carbon\Carbon;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;

readonly class TestService
{
    public function __construct(private TestRepository $testRepository)
    {
    }

    public function listTests($queryData): LengthAwarePaginator
    {
        return $this->testRepository->ListTests($queryData);
    }

    public function allTests($queryData): Collection
    {
        return $this->testRepository->allTests($queryData);
    }

    public function storeTest(TestDTO $testDTO): Test
    {
        $test = $this->testRepository->creatTest(Arr::except($testDTO->toArray(), "report_templates"));
        $this->syncReportTemplates($test, $testDTO->report_templates);
        return $test;
    }

    public function updateTest(Test $test, TestDTO $testDTO): Test
    {
        $updatedTest = $this->testRepository->updateTest($test, $testDTO->toArray());
        $this->syncReportTemplates($updatedTest, $testDTO->report_templates);
        return $updatedTest;
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

    private function syncReportTemplates(Test $test, array $reportTemplates): void
    {
        if (count($reportTemplates))
            $test->reportTemplates()->sync(Arr::pluck($reportTemplates, "id"));
    }


    public function loadTest(Test $test, int|array $referrer = null): Test
    {
        $load = [
            "methodTests.method.workflow",
            "methodTests.method.barcodeGroup",
            "methodTests.method.test.sampleTypes",
            "reportTemplates",
            "testGroups",
            "offers" => function ($q) use ($referrer) {
                $q->where("started_at", "<=", Carbon::now("Asia/Muscat"))
                    ->where("ended_at", ">=", Carbon::now("Asia/Muscat"))
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

}
