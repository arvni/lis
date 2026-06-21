<?php

declare(strict_types=1);

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Services\ExpiryDashboardService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpiryDashboardController extends Controller
{
    public function __construct(
        private readonly ExpiryDashboardService $service,
    ) {}

    public function __invoke(Request $request): Response
    {
        $this->authorize('viewAny', StockTransaction::class);

        $storeId = $request->integer('store_id') ?: null;
        $window = $request->integer('days', 90);

        return Inertia::render(
            'Inventory/Expiry/Index',
            $this->service->build($storeId, $window),
        );
    }
}
