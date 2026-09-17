<?php

declare(strict_types=1);

namespace App\Http\Controllers\Payroll;

use App\Domains\Payroll\DTOs\PayrollItemDTO;
use App\Domains\Payroll\Enums\PayrollCalculation;
use App\Domains\Payroll\Models\PayrollItem;
use App\Domains\Payroll\Requests\StorePayrollItemRequest;
use App\Domains\Payroll\Requests\UpdatePayrollItemRequest;
use App\Domains\Payroll\Resources\PayrollItemResource;
use App\Domains\Payroll\Services\PayrollItemService;
use App\Domains\Payroll\Services\PayrollItemTypeService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A person's recurring allowances and deductions. Kept apart from contracts on purpose: a loan is
 * still owed when the contract it began under is replaced.
 */
class PayrollItemController extends Controller
{
    public function __construct(
        private readonly PayrollItemService $itemService,
        private readonly PayrollItemTypeService $typeService,
    ) {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', PayrollItem::class);
        $requestInputs = $request->all();
        // Keep the paginator's top-level `total`/`current_page`, which TableLayout reads.
        $items = $this->itemService->listItems($requestInputs)
            ->through(fn (PayrollItem $item) => (new PayrollItemResource($item))->resolve($request));

        return Inertia::render('Payroll/StaffAllowances/Index', [
            'items' => $items,
            'calculations' => PayrollCalculation::options(),
            'itemTypes' => $this->typeService->activeTypes()
                ->map(fn ($type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'kind' => $type->kind->value,
                    'kind_label' => $type->kind->label(),
                    // Only ever a starting value for the amount field.
                    'default_amount' => $type->default_amount,
                ])->values()->all(),
            'requestInputs' => $requestInputs,
        ]);
    }

    public function store(StorePayrollItemRequest $request): RedirectResponse
    {
        $this->itemService->storeItem(PayrollItemDTO::fromArray($request->validated()));

        return back()->with(['success' => true, 'status' => 'Added successfully']);
    }

    public function update(PayrollItem $staffAllowance, UpdatePayrollItemRequest $request): RedirectResponse
    {
        $this->itemService->updateItem($staffAllowance, PayrollItemDTO::fromArray($request->validated()));

        return back()->with(['success' => true, 'status' => 'Updated successfully']);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(PayrollItem $staffAllowance): RedirectResponse
    {
        $this->authorize('delete', $staffAllowance);
        $this->itemService->deleteItem($staffAllowance);

        return back()->with(['success' => true, 'status' => 'Removed successfully']);
    }
}
