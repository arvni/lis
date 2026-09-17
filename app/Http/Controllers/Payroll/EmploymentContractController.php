<?php

declare(strict_types=1);

namespace App\Http\Controllers\Payroll;

use App\Domains\Payroll\Adapters\AttendanceAdapter;
use App\Domains\Payroll\DTOs\EmploymentContractDTO;
use App\Domains\Payroll\Enums\EmploymentType;
use App\Domains\Payroll\Models\EmploymentContract;
use App\Domains\Payroll\Requests\StoreEmploymentContractRequest;
use App\Domains\Payroll\Requests\UpdateEmploymentContractRequest;
use App\Domains\Payroll\Resources\EmploymentContractResource;
use App\Domains\Payroll\Services\EmploymentContractService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class EmploymentContractController extends Controller
{
    public function __construct(
        private readonly EmploymentContractService $contractService,
        private readonly AttendanceAdapter $attendance,
    ) {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', EmploymentContract::class);
        $requestInputs = $request->all();
        $contracts = $this->contractService->listContracts($requestInputs)
            ->through(fn (EmploymentContract $contract) => (new EmploymentContractResource($contract))->resolve($request));

        return Inertia::render('Payroll/Contracts/Index', [
            'contracts' => $contracts,
            'employmentTypes' => EmploymentType::options(),
            'requestInputs' => $requestInputs,
        ]);
    }

    /**
     * @throws AuthorizationException
     */
    public function create(Request $request): Response
    {
        $this->authorize('create', EmploymentContract::class);

        return Inertia::render('Payroll/Contracts/Add', $this->formOptions($request));
    }

    /**
     * @throws AuthorizationException
     */
    public function edit(EmploymentContract $contract, Request $request): Response
    {
        $this->authorize('update', $contract);

        return Inertia::render('Payroll/Contracts/Edit', [
            ...$this->formOptions($request),
            'contract' => (new EmploymentContractResource($this->contractService->loadContract($contract)))->resolve($request),
            // The shift lives on the person's assignment, not the contract, so the picker is
            // seeded from whatever they are actually on as at the contract's start.
            'shiftId' => $this->attendance->assignedShiftId($contract->user_id, $contract->start_date->format('Y-m-d')),
        ]);
    }

    public function store(StoreEmploymentContractRequest $request): RedirectResponse
    {
        $dto = EmploymentContractDTO::fromArray($request->validated());

        try {
            $this->contractService->storeContract($dto);
        } catch (RuntimeException $e) {
            return back()->withInput()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return redirect()->route('payroll.contracts.index')
            ->with(['success' => true, 'status' => 'Contract created successfully']);
    }

    public function update(EmploymentContract $contract, UpdateEmploymentContractRequest $request): RedirectResponse
    {
        $dto = EmploymentContractDTO::fromArray($request->validated());

        try {
            $this->contractService->updateContract($contract, $dto);
        } catch (RuntimeException $e) {
            return back()->withInput()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return redirect()->route('payroll.contracts.index')
            ->with(['success' => true, 'status' => 'Contract updated successfully']);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(EmploymentContract $contract): RedirectResponse
    {
        $this->authorize('delete', $contract);
        $this->contractService->deleteContract($contract);

        return back()->with(['success' => true, 'status' => 'Contract deleted successfully']);
    }

    /**
     * What both the create and edit forms need to offer.
     *
     * @return array<string, mixed>
     */
    private function formOptions(Request $request): array
    {
        return [
            'employmentTypes' => EmploymentType::options(),
            'shifts' => $this->attendance->activeShifts()
                ->map(fn ($shift) => ['id' => $shift->id, 'name' => $shift->name])->values()->all(),
            // Allowances and deductions are not part of a contract — they belong to the person and
            // are managed under Staff Allowances.
            'leaveKinds' => $this->attendance->activeLeaveKinds()
                ->map(fn ($kind) => ['id' => $kind->id, 'name' => $kind->name])->values()->all(),
        ];
    }
}
