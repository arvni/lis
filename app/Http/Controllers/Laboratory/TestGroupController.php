<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\DTOs\TestGroupDTO;
use App\Domains\Laboratory\Models\TestGroup;
use App\Domains\Laboratory\Requests\StoreTestGroupRequest;
use App\Domains\Laboratory\Requests\UpdateTestGroupRequest;
use App\Domains\Laboratory\Services\TestGroupService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TestGroupController extends Controller
{
    public function __construct(private TestGroupService $testGroupService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", TestGroup::class);
        $requestInputs = $request->all();
        $testGroups = $this->testGroupService->listTestGroups($requestInputs);
        return Inertia::render('TestGroup/Index', compact("testGroups", "requestInputs"));
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTestGroupRequest $testGroupRequest)
    {
        $validatedData = $testGroupRequest->validated();
        $testGroupDto = new TestGroupDTO(
            $validatedData["name"],
        );
        $this->testGroupService->storeTestGroup($testGroupDto);
        return back()->with(["success" => true, "status" => "$testGroupDto->name Created Successfully"]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(TestGroup $testGroup, UpdateTestGroupRequest $request)
    {
        $validatedData = $request->validated();
        $testGroupDto = new TestGroupDTO(
            $validatedData["name"],
        );
        $this->testGroupService->updateTestGroup($testGroup, $testGroupDto);
        return back()->with(["success" => true, "status" => "$testGroupDto->name Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(TestGroup $testGroup): RedirectResponse
    {
        $this->authorize("delete", $testGroup);
        $title = $testGroup["name"];
        $this->testGroupService->deleteTestGroup($testGroup);
        return back()->with(["success" => true, "status" => "$title Successfully Deleted."]);
    }
}
