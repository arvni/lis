<?php

declare(strict_types=1);

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Requests\UpdateTestPreOrderSettingsRequest;
use App\Domains\Laboratory\Services\TestService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class UpdateTestPreOrderSettingsController extends Controller
{
    public function __construct(private readonly TestService $testService) {}

    public function __invoke(UpdateTestPreOrderSettingsRequest $request, Test $test): RedirectResponse
    {
        $flowId = $request->validated('flow_id');
        $this->testService->updatePreOrderSettings($test, $flowId === null ? null : (int) $flowId, (bool) $request->validated('can_be_main'));

        return back()->with([
            'success' => true,
            'status' => $flowId === null ? "{$test->name} uses direct ordering." : "{$test->name} now takes pre-orders.",
        ]);
    }
}
