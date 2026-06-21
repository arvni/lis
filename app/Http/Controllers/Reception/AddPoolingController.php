<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Requests\AddPoolingRequest;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class AddPoolingController extends Controller
{
    public function __construct(
        private AcceptanceItemService $acceptanceItemService,
        private ReferrerOrderService  $referrerOrderService,
    ) {}

    public function __invoke(AddPoolingRequest $request, Acceptance $acceptance): RedirectResponse
    {
        if ($acceptance->status !== AcceptanceStatus::POOLING) {
            return back()->withErrors(['error' => 'Acceptance is not in pooling status.']);
        }

        $createdItems = $this->acceptanceItemService->addPoolingItems(
            $acceptance,
            $request->validated('acceptanceItems'),
        );

        if ($createdItems->isNotEmpty() && $acceptance->referrer_id) {
            // Don't create a new referrer order for pooling — refresh the
            // acceptance's existing order so the provider sees the update.
            $this->referrerOrderService->updateExistingOrderForPooling($acceptance);
        }

        return back()->with(['success' => true, 'status' => 'Pooling items added successfully.']);
    }
}
