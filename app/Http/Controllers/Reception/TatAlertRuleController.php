<?php

declare(strict_types=1);

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\DTOs\TatAlertRuleDTO;
use App\Domains\Reception\Models\TatAlertRule;
use App\Domains\Reception\Requests\StoreTatAlertRuleRequest;
use App\Domains\Reception\Requests\UpdateTatAlertRuleRequest;
use App\Domains\Reception\Resources\TatAlertRuleResource;
use App\Domains\Reception\Services\TatAlertRuleService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TatAlertRuleController extends Controller
{
    public function __construct(private readonly TatAlertRuleService $ruleService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', TatAlertRule::class);
        $requestInputs = $request->all();
        // Shape each row with the resource but keep the paginator's own top-level `total` and
        // `current_page`: TableLayout reads them there, not from a resource collection's `meta`.
        $rules = $this->ruleService->listRules($requestInputs)
            ->through(fn (TatAlertRule $rule) => (new TatAlertRuleResource($rule))->resolve($request));

        return Inertia::render('TatAlertRule/Index', [
            'rules' => $rules,
            'requestInputs' => $requestInputs,
        ]);
    }

    public function store(StoreTatAlertRuleRequest $request): RedirectResponse
    {
        $dto = TatAlertRuleDTO::fromArray($request->validated());
        $this->ruleService->storeRule($dto);

        return back()->with(['success' => true, 'status' => "$dto->name created successfully"]);
    }

    public function update(TatAlertRule $tatAlertRule, UpdateTatAlertRuleRequest $request): RedirectResponse
    {
        $dto = TatAlertRuleDTO::fromArray($request->validated());
        $this->ruleService->updateRule($tatAlertRule, $dto);

        return back()->with(['success' => true, 'status' => "$dto->name updated successfully"]);
    }

    /**
     * @throws AuthorizationException
     */
    public function destroy(TatAlertRule $tatAlertRule): RedirectResponse
    {
        $this->authorize('delete', $tatAlertRule);
        $name = $tatAlertRule->name;
        $this->ruleService->deleteRule($tatAlertRule);

        return back()->with(['success' => true, 'status' => "$name deleted successfully"]);
    }
}
