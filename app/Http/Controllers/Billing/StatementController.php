<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\DTOs\StatementDTO;
use App\Domains\Billing\Models\Statement;
use App\Domains\Billing\Requests\StoreStatementRequest;
use App\Domains\Billing\Requests\UpdateStatementRequest;
use App\Domains\Billing\Services\StatementService;
use App\Http\Controllers\Controller;
use App\Http\Resources\StatementResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StatementController extends Controller
{
    public function __construct(private StatementService $statementService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Statement::class);
        $requestInputs = $request->only(['filters', 'sort', 'pageSize']);
        $statements = $this->statementService->listStatements($requestInputs);
        $canEdit=Gate::allows("update",new Statement());
        $canAdd=Gate::allows("create",new Statement());
        $canDelete=Gate::allows("delete",new Statement());
        return Inertia::render("Statement/Index", compact("requestInputs", "statements", "canEdit", "canAdd", "canDelete"));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreStatementRequest $request)
    {
        $data = array_merge($request->validated(), ['issue_date' => now()->toDateString()]);
        $this->statementService->storeStatement(StatementDTO::fromRequest($data));
        return redirect()->back()->with(["success" => true, "status" => "Statement created successfully."]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Statement $statement)
    {
        return new StatementResource($this->statementService->loadStatementForResource($statement));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateStatementRequest $request, Statement $statement)
    {
        $this->statementService->updateStatement($statement, StatementDTO::fromRequest([...$request->validated(),"referrer_id"=>$statement->referrer_id,"issue_date"=>$statement->issue_date]));
        return redirect()->back()->with(["success" => true, "status" => "Statement updated successfully."]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Statement $statement)
    {
        $this->statementService->deleteStatement($statement);
        return back()->with(["success" => true, "status" => "Statement deleted successfully!"]);
    }

}
