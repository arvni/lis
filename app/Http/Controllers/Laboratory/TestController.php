<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\MethodDTO;
use App\Domains\Laboratory\DTOs\MethodTestDTO;
use App\Domains\Laboratory\DTOs\TestDTO;
use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Requests\StoreTestRequest;
use App\Domains\Laboratory\Requests\UpdateTestRequest;
use App\Domains\Laboratory\Resources\TestResource;
use App\Domains\Laboratory\Services\MethodService;
use App\Domains\Laboratory\Services\MethodTestService;
use App\Domains\Laboratory\Services\TestService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TestController extends Controller
{
    private const DEFAULT_PRICE = 0;
    private const DEFAULT_STATUS = true;
    private const DEFAULT_NO_PATIENT = 1;

    public function __construct(private readonly TestService       $testService,
                                private readonly MethodTestService $methodTestService,
                                private readonly MethodService     $methodService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Test::class);
        $requestInputs = $request->all();
        $tests = $this->testService->listTests($requestInputs);
        return Inertia::render('Test/Index', compact("tests", "requestInputs"));
    }

    /**
     * @throws AuthorizationException
     */
    public function create(): Response
    {
        $this->authorize("create", Test::class);
        return Inertia::render('Test/Add');
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTestRequest $testRequest): RedirectResponse
    {
        try {
            DB::beginTransaction();
            $validatedData = $testRequest->validated();
            $testDto = TestDTO::fromArray($validatedData);
            $test = $this->testService->storeTest($testDto);
            $this->syncTestRelationships($test, $validatedData);
            DB::commit();
            return $this->redirectWithSuccess('tests.index', "$testDto->name Created Successfully");
        } catch (Exception $e) {
            DB::rollBack();
            return back()
                ->withInput()
                ->with(["error" => true, "status" => "Failed to create test: " . $e->getMessage()]);
        }
    }


    /**
     * show resource in storage.
     */
    public function show(Test $test, Request $request): TestResource
    {
        $isReferrer = $request->boolean('referrer');
        $loadedTest = $this->testService->loadTest($test, $isReferrer ? $request->input('referrer') : null);
        $loadedTest->withDefaultReferrerPrice = $isReferrer;

        return new TestResource($loadedTest);
    }

    /**
     * edit a created resource in storage.
     * @throws AuthorizationException
     */
    public function edit(Test $test): Response
    {
        $this->authorize("update", $test);
        $test->load([
            "methodTests" => function ($q) {
                $q->with([
                    "method.workflow:name,id",
                    "method.barcodeGroup:name,id"
                ])
                    ->withCount("acceptanceItems");
            },
            "sampleTypeTests.sampleType:name,id",
            "reportTemplates:name,id",
            "testGroups",
        ]);
        return Inertia::render('Test/Edit', compact("test"));
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTestRequest $request, Test $test): RedirectResponse
    {
        try {
            DB::beginTransaction();
            $validatedData = $request->validated();

            $testDto = TestDTO::fromArray($validatedData);

            $this->testService->updateTest($test, $testDto);

            $this->handleMethodTests($test, $validatedData["method_tests"]);

            $this->syncTestRelationships($test, $validatedData);

            DB::commit();

            return $this->redirectWithSuccess('tests.index', "$testDto->name Updated Successfully");
        } catch (Exception $e) {
            DB::rollBack();

            return back()
                ->withInput()
                ->with(["error" => true, "status" => "Failed to create test: " . $e->getMessage()]);
        }
    }

    /**`
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(Test $test): RedirectResponse
    {
        $this->authorize("delete", $test);
        $title = $test["name"];
        $this->testService->deleteTest($test);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
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
                price: $methodTest["method"]["price"],
                turnaround_time: $methodTest["method"]["turnaround_time"] ?? null,
                extra: $methodTest["method"]["extra"] ?? null,
                noPatient: $methodTest["method"]["no_patient"] ?? 1,
                referrer_price_type: MethodPriceType::from($methodTest["method"]["referrer_price_type"]),
                referrer_price: $methodTest["method"]["referrer_price"],
                referrer_extra: $methodTest["method"]["referrer_extra"] ?? null,
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

    private function syncTestRelationships(Test $test, array $validatedData): void
    {
        $this->handleMethodTests($test, $validatedData["method_tests"]);
        $this->syncSampleTypeTests($test, $validatedData["sample_type_tests"] ?? []);
        $this->syncTestGroupTests($test,$validatedData["test_groups"]??[]);
    }

    private function syncSampleTypeTests(Test $test, array $sampleTypeTests): void
    {
        if (empty($sampleTypeTests)) {
            return;
        }

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
        if (empty($testGroups)) {
            return;
        }

        $syncData = collect($testGroups)
            ->map(fn($item) => $item["id"])
            ->toArray();

        $test->testGroups()->sync($syncData);
    }

    private function redirectWithSuccess(string $route, string $message): RedirectResponse
    {
        return redirect()->route($route)
            ->with(["success" => true, "status" => $message]);
    }

}
