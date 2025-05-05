<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Laboratory\Enums\MethodPriceType;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Referrer\DTOs\ReferrerTestDTO;
use App\Domains\Referrer\Models\ReferrerTest;
use App\Domains\Referrer\Requests\StoreReferrerTestRequest;
use App\Domains\Referrer\Requests\UpdateReferrerTestRequest;
use App\Domains\Referrer\Resources\ReferrerTestResource;
use App\Domains\Referrer\Services\ReferrerTestService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReferrerTestController extends Controller
{
    public function __construct(private readonly ReferrerTestService $referrerTestService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * @throws Exception
     */
    public function index(Request $request): JsonResponse
    {
        $requestInputs = $request->all();
        $referrerTests = $this->referrerTestService->index($request->all());
        return response()->json(compact("referrerTests", "requestInputs"));
    }

    /**
     * @throws Exception
     */
    public function store(StoreReferrerTestRequest $request): RedirectResponse
    {
        // Validate the request
        $validated = $request->validated();

        // check test if it wasn't panel set price zero
        if ($request->input('test.type') === TestType::PANEL->value) {
            $validated['price'] = 0;
        }

        // Create DTO from validated data
        $dto = ReferrerTestDTO::fromRequest($validated);

        // Store method test
        $this->referrerTestService->store($dto);

        return back()->with(["success" => true, "status" => "Test Created Successfully"]);
    }


    public function show(ReferrerTest $referrerTest): ReferrerTestResource
    {
        $referrerTest->load("test.methodTests.method");
        return new ReferrerTestResource($referrerTest);

    }

    public function update(UpdateReferrerTestRequest $request, ReferrerTest $referrerTest): RedirectResponse
    {
        // Validate the request
        $validated = $request->validated();

        // Create DTO from validated data
        $dto = ReferrerTestDTO::fromRequest($validated);

        // Update method test
        $referrerTest = $this->referrerTestService->update($referrerTest, $dto);

        return back()->with(["success" => true, "status" => "Test Updated Successfully"]);
    }

    /**
     * @throws Exception
     */
    public function destroy(ReferrerTest $referrerTest): RedirectResponse
    {

        $this->referrerTestService->delete($referrerTest);

        return back()->with(["success" => true, "status" => "Method Test Deleted Successfully"]);
    }
}
