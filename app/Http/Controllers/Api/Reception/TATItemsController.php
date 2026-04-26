<?php

namespace App\Http\Controllers\Api\Reception;

use App\Domains\Reception\Services\TATService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TATItemsController extends Controller
{
    public function __construct(private readonly TATService $tatService)
    {
    }

    public function __invoke(Request $request): JsonResponse
    {
        Gate::authorize('Reception.TAT.View Dashboard');

        $filters = $request->only(['priority', 'section_id', 'date_from', 'date_to']);
        $page = max(1, (int) $request->get('page', 1));
        $perPage = min(100, max(5, (int) $request->get('per_page', 20)));

        return response()->json($this->tatService->getItemsPaginated($filters, $page, $perPage));
    }
}
