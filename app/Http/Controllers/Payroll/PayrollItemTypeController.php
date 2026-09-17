<?php

declare(strict_types=1);

namespace App\Http\Controllers\Payroll;

use App\Domains\Payroll\DTOs\PayrollItemTypeDTO;
use App\Domains\Payroll\Enums\AllowanceKind;
use App\Domains\Payroll\Models\PayrollItemType;
use App\Domains\Payroll\Requests\StorePayrollItemTypeRequest;
use App\Domains\Payroll\Requests\UpdatePayrollItemTypeRequest;
use App\Domains\Payroll\Resources\PayrollItemTypeResource;
use App\Domains\Payroll\Services\PayrollItemTypeService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class PayrollItemTypeController extends Controller
{
    public function __construct(private readonly PayrollItemTypeService $typeService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', PayrollItemType::class);
        $requestInputs = $request->all();
        // Keep the paginator's top-level `total`/`current_page`, which TableLayout reads.
        $types = $this->typeService->listTypes($requestInputs)
            ->through(fn (PayrollItemType $type) => (new PayrollItemTypeResource($type))->resolve($request));

        return Inertia::render('Payroll/ItemTypes/Index', [
            'types' => $types,
            'kinds' => AllowanceKind::options(),
            'requestInputs' => $requestInputs,
        ]);
    }

    public function store(StorePayrollItemTypeRequest $request): RedirectResponse
    {
        $dto = PayrollItemTypeDTO::fromArray($request->validated());
        $this->typeService->storeType($dto);

        return back()->with(['success' => true, 'status' => "$dto->name created successfully"]);
    }

    public function update(PayrollItemType $itemType, UpdatePayrollItemTypeRequest $request): RedirectResponse
    {
        $dto = PayrollItemTypeDTO::fromArray($request->validated());
        $this->typeService->updateType($itemType, $dto);

        return back()->with(['success' => true, 'status' => "$dto->name updated successfully"]);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(PayrollItemType $itemType): RedirectResponse
    {
        $this->authorize('delete', $itemType);
        $name = $itemType->name;

        try {
            $this->typeService->deleteType($itemType);
        } catch (RuntimeException $e) {
            return back()->with(['success' => false, 'status' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => "$name deleted successfully"]);
    }
}
