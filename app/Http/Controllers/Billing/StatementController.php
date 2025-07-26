<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\DTOs\StatementDTO;
use App\Domains\Billing\Models\Statement;
use App\Domains\Billing\Requests\StoreStatementRequest;
use App\Domains\Billing\Requests\UpdateStatementRequest;
use App\Domains\Billing\Services\StatementService;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\StatementResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $requestInputs = $request->all();
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
        $this->statementService->storeStatement(StatementDTO::fromRequest($request->validated()));
        return redirect()->back()->with(["success" => true, "status" => "Statement created successfully."]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Statement $statement)
    {
        $reportDateSubquery = DB::table('acceptance_items')
            ->join('method_tests', 'method_tests.id', '=', 'acceptance_items.method_test_id')
            ->join('methods', 'methods.id', '=', 'method_tests.method_id')
            ->selectRaw('MAX(DATE_ADD(acceptance_items.created_at, INTERVAL methods.turnaround_time DAY))')
            ->whereColumn('acceptance_items.acceptance_id', 'acceptances.id');

        $statement->load([
            "acceptances"=>fn ($query) =>
            $query->with([
                'acceptanceItems.test',
                'samples:samples.id,barcode',
                'invoice' => function ($query) {
                    $query->addSelect([
                            'id',
                            'created_at',
                            DB::raw('CONCAT(
                    DATE_FORMAT(created_at, "%Y-%m"),
                    "/",
                    (SELECT COUNT(*)
                     FROM invoices i2
                     WHERE i2.id <= invoices.id
                     AND YEAR(i2.created_at) = YEAR(invoices.created_at)
                    )
                ) AS invoice_no')
                        ]
                    );
                }
            ])
                ->withAggregate('patient', 'fullName')
                ->withAggregate('patient', 'idNo')
                ->selectRaw("({$this->getPayableAmountSql()}) as payable_amount")
                ->addSelect(['report_date' => $reportDateSubquery]),
            "referrer:id,fullName"
        ]);
        return new StatementResource($statement);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateStatementRequest $request, Statement $statement)
    {
        $this->statementService->updateStatement($statement, StatementDTO::fromRequest([...$request->validated(),"referrer_id"=>$statement->referrer_id]));
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

    private function getPayableAmountSql(): string
    {
        return 'COALESCE((SELECT SUM(acceptance_items.price) FROM acceptance_items WHERE acceptances.id = acceptance_items.acceptance_id), 0) -
                COALESCE((SELECT SUM(acceptance_items.discount) FROM acceptance_items WHERE acceptances.id = acceptance_items.acceptance_id), 0)';
    }

}
