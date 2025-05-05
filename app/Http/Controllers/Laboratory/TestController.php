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
use App\Domains\Setting\Services\SettingService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TestController extends Controller
{
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
        $validatedData = $testRequest->validated();

        $testDto = new TestDTO(
            $validatedData["test_group"]["id"],
            $validatedData["name"],
            TestType::from($validatedData["type"]),
            $validatedData["code"],
            $validatedData["fullName"],
            $validatedData["description"],
            $validatedData["status"] ?? true,
            $validatedData["report_templates"] ?? [],
            $validatedData["price"] ?? 0
        );

        $test = $this->testService->storeTest($testDto);

        $this->handleMethodTests($test, $validatedData["method_tests"]);
        if (count($validatedData["sample_type_tests"] ?? []))
            $test->sampletypes()
                ->sync(collect($validatedData["sample_type_tests"])
                    ->keyBy("sample_type.id")
                    ->map(fn($item) => [
                        "description" => $item["description"],
                        "defaultType" => $item["defaultType"]
                    ])
                    ->toArray()
                );

        return redirect()->route("tests.index")
            ->with(["success" => true, "status" => "$testDto->name Created Successfully"]);
    }


    /**
     * show resource in storage.
     */
    public function show(Test $test, Request $request): TestResource
    {
        $loadedTest = $this->testService->loadTest($test, $request->has("referrer") ? $request->input("referrer") : null);
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
            "testGroup",
        ]);
        return Inertia::render('Test/Edit', compact("test"));
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTestRequest $request, Test $test): RedirectResponse
    {
        $validatedData = $request->validated();

        $testDto = new TestDTO(
            $validatedData["test_group"]["id"],
            $validatedData["name"],
            $test->type,
            $validatedData["code"],
            $validatedData["fullName"],
            $validatedData["description"],
            $validatedData["status"] ?? true,
            $validatedData["report_templates"] ?? [],
            $validatedData["price"] ?? 0
        );

        $this->testService->updateTest($test, $testDto);

        $this->handleMethodTests($test, $validatedData["method_tests"]);

        if (count($validatedData["sample_type_tests"] ?? []))
            $test->sampletypes()
                ->sync(collect($validatedData["sample_type_tests"])
                    ->keyBy("sample_type.id")
                    ->map(fn($item) => [
                        "description" => $item["description"],
                        "defaultType" => $item["defaultType"]
                    ])
                    ->toArray()
                );

        return redirect()->route("tests.index")
            ->with(["success" => true, "status" => "$testDto->name Updated Successfully"]);
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
        if ($test->type !== TestType::PANEL) {
            $this->handleNonPanelMethodTests($test, $methodTests);
        } else {
            $this->handlePanelMethodTests($test, $methodTests);
        }
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
                requirements: $methodTest["method"]["requirements"] ?? null,
                extra: $methodTest["method"]["extra"] ?? null,
                noPatient: $methodTest["method"]["no_patient"] ?? 1
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
                status: true
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

}
