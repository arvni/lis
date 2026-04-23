<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\ReorderAlert;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Repositories\ReorderAlertRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReorderAlertController extends Controller
{
    public function __construct(private ReorderAlertRepository $alertRepository)
    {
        $this->middleware('indexProvider');
    }

    public function __invoke(Request $request): Response
    {
        $requestInputs = $request->all();
        $alerts = $this->alertRepository->listAlerts($requestInputs);
        $stores = Store::active()->get(['id', 'name']);
        return Inertia::render('Inventory/ReorderAlerts/Index', compact('alerts', 'stores', 'requestInputs'));
    }

    public function resolve(ReorderAlert $reorderAlert): RedirectResponse
    {
        $this->alertRepository->resolveAlert($reorderAlert);
        return back()->with(['success' => true, 'status' => "Alert resolved."]);
    }
}
