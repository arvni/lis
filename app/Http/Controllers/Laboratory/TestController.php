<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\TestDTO;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Requests\StoreTestRequest;
use App\Domains\Laboratory\Requests\UpdateTestRequest;
use App\Domains\Laboratory\Resources\TestResource;
use App\Domains\Laboratory\Services\TestService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TestController extends Controller
{
    public function __construct(private readonly TestService $testService)
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
        $testDto       = TestDTO::fromArray($validatedData);
        $this->testService->storeTest($testDto, $validatedData);
        return $this->redirectWithSuccess('tests.index', "$testDto->name Created Successfully");
    }

    /**
     * show resource in storage.
     */
    public function show(Test $test, Request $request): TestResource
    {
        $isReferrer = $request->has("referrer.id");
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
            "instruction:name,id",
            "consentForm:name,id",
            "requestForm:name,id",
        ]);
        return Inertia::render('Test/Edit', compact("test"));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTestRequest $request, Test $test): RedirectResponse
    {
        $validatedData = $request->validated();
        $testDto       = TestDTO::fromArray($validatedData);
        $this->testService->updateTest($test, $testDto, $validatedData);
        return $this->redirectWithSuccess('tests.index', "$testDto->name Updated Successfully");
    }

    /**
     * Remove the specified resource from storage.
     * @throws \Exception
     */
    public function destroy(Test $test): RedirectResponse
    {
        $this->authorize("delete", $test);
        $title = $test["name"];
        $this->testService->deleteTest($test);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }

    private function redirectWithSuccess(string $route, string $message): RedirectResponse
    {
        return redirect()->route($route)
            ->with(["success" => true, "status" => $message]);
    }
}
