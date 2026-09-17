<?php

declare(strict_types=1);

namespace App\Http\Controllers\Payroll;

use App\Domains\Payroll\Enums\SalarySlipStatus;
use App\Domains\Payroll\Models\SalarySlip;
use App\Domains\Payroll\Requests\GenerateSalarySlipRequest;
use App\Domains\Payroll\Requests\UpdateSalarySlipRequest;
use App\Domains\Payroll\Resources\SalarySlipResource;
use App\Domains\Payroll\Services\SalarySlipService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

/**
 * Slips are prepared under permission and then issued. Anyone can reach this page, but without the
 * permission to see everyone's they get only their own, and only the ones actually issued to them.
 */
class SalarySlipController extends Controller
{
    public function __construct(private readonly SalarySlipService $slipService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', SalarySlip::class);
        $requestInputs = $request->all();
        $canViewAll = Gate::allows('viewAll', SalarySlip::class);

        $slips = $this->slipService
            ->listSlips($requestInputs, $canViewAll ? null : (int) $request->user()?->id)
            ->through(fn (SalarySlip $slip) => (new SalarySlipResource($slip))->resolve($request));

        return Inertia::render('Payroll/SalarySlips/Index', [
            'slips' => $slips,
            'statuses' => SalarySlipStatus::options(),
            'canViewAll' => $canViewAll,
            'canManage' => Gate::allows('create', SalarySlip::class),
            'requestInputs' => $requestInputs,
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function show(SalarySlip $salarySlip, Request $request): Response
    {
        $this->authorize('view', $salarySlip);

        return Inertia::render('Payroll/SalarySlips/Show', [
            'slip' => (new SalarySlipResource($this->slipService->loadForViewing($salarySlip)))->resolve($request),
            // The page is the same one either way; what it lets you do is not.
            'canEdit' => Gate::allows('update', $salarySlip),
            'canIssue' => Gate::allows('issue', $salarySlip),
            'canDelete' => Gate::allows('delete', $salarySlip),
            // Set by the generate that redirected here, if it had anything to flag.
            'warnings' => $request->session()->get('slipWarnings', []),
        ]);
    }

    public function store(GenerateSalarySlipRequest $request): RedirectResponse
    {
        try {
            $generated = $this->slipService->generate(
                $request->personId(),
                $request->month(),
                (int) $request->user()?->id,
            );
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return redirect()->route('payroll.salary-slips.show', $generated->slip->id)
            ->with([
                'success' => true,
                'status' => 'Salary slip drafted',
                // Read once by the page we are redirecting to; a loan behind the calendar is worth
                // saying, but it is not a reason to refuse the slip.
                'slipWarnings' => $generated->warnings,
            ]);
    }

    public function update(SalarySlip $salarySlip, UpdateSalarySlipRequest $request): RedirectResponse
    {
        /** @var list<array<string, mixed>> $lines */
        $lines = $request->validated('lines');
        $this->slipService->updateLines($salarySlip, $lines, $request->validated('notes'));

        return back()->with(['success' => true, 'status' => 'Saved']);
    }

    /**
     * @throws AuthorizationException
     */
    public function issue(SalarySlip $salarySlip, Request $request): RedirectResponse
    {
        $this->authorize('issue', $salarySlip);

        try {
            $slip = $this->slipService->issue($salarySlip, (int) $request->user()?->id);
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => "Issued as $slip->number"]);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(SalarySlip $salarySlip): RedirectResponse
    {
        $this->authorize('delete', $salarySlip);
        $this->slipService->deleteSlip($salarySlip);

        return redirect()->route('payroll.salary-slips.index')
            ->with(['success' => true, 'status' => 'Draft removed']);
    }
}
