<?php

declare(strict_types=1);

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Exceptions\AcceptanceNotFinanciallyApprovableException;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Requests\ApproveFinancialRequest;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class ApproveFinancialController extends Controller
{
    public function __construct(
        private readonly AcceptanceService $acceptanceService
    )
    {
    }

    /**
     * Approve financial check for acceptance
     */
    public function __invoke(Acceptance $acceptance, ApproveFinancialRequest $request): RedirectResponse
    {
        $user = auth()->user();

        // The confirmation dialog shows the reviewer whether an invoice exists;
        // approving an uninvoiced acceptance takes an explicit acknowledgement.
        $approveWithoutInvoice = $request->boolean("approve_without_invoice");

        try {
            $this->acceptanceService->approveFinancial($acceptance, (int) $user->id, $approveWithoutInvoice);
        } catch (AcceptanceNotFinanciallyApprovableException $e) {
            // An unacknowledged uninvoiced acceptance, or one a second reviewer
            // just approved.
            return back()->withErrors(["message" => $e->getMessage()]);
        }

        return back()->with([
            "success" => true,
            "status" => $acceptance->invoice_id
                ? "Financial check approved for acceptance #{$acceptance->id}"
                : "Financial check approved for acceptance #{$acceptance->id} without an invoice"
        ]);
    }
}
