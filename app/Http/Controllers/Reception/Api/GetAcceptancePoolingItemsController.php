<?php

namespace App\Http\Controllers\Reception\Api;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class GetAcceptancePoolingItemsController extends Controller
{
    public function __construct(private AcceptanceItemService $acceptanceItemService) {}

    public function __invoke(Acceptance $acceptance): JsonResponse
    {
        $this->authorize("view", $acceptance);

        return response()->json([
            'items' => $this->acceptanceItemService->buildPoolingItems($acceptance),
        ]);
    }
}
