<?php

namespace App\Http\Controllers\Inventory;

use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\StoreLocation;
use App\Domains\Inventory\Requests\StoreLocationRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class StoreLocationController extends Controller
{
    public function store(StoreLocationRequest $request, Store $store): RedirectResponse
    {
        $this->authorize('update', $store);

        $data = $request->validated();

        $label = StoreLocation::generateLabel(
            $data['zone'] ?? null,
            $data['row'] ?? null,
            $data['column'] ?? null,
            $data['shelf'] ?? null,
            $data['bin'] ?? null,
        );

        if (!$label) {
            $label = 'LOC-' . ($store->locations()->count() + 1);
        }

        $store->locations()->create([...$data, 'label' => $label, 'is_active' => true]);

        return back()->with(['success' => true, 'status' => "Location {$label} added."]);
    }

    public function destroy(Store $store, StoreLocation $location): RedirectResponse
    {
        $this->authorize('update', $store);
        $label = $location->label;
        $location->delete();
        return back()->with(['success' => true, 'status' => "Location {$label} removed."]);
    }

    public function toggle(Store $store, StoreLocation $location): RedirectResponse
    {
        $this->authorize('update', $store);
        $location->update(['is_active' => !$location->is_active]);
        return back()->with(['success' => true, 'status' => "Location updated."]);
    }
}
