<?php

declare(strict_types=1);

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

/**
 * Sends a referred acceptance to its provider again: its referrer orders are re-sent, or one is
 * created when it has none. The same reconcile `acceptance:sync-referrer-orders` runs in bulk.
 */
class SyncAcceptanceWithProviderController extends Controller
{
    private const SKIP_REASONS = [
        'no_patient' => 'This acceptance has no patient, so there is nothing to send.',
        'no_reportable_items' => 'Every test on this acceptance is reportless, so there is nothing to send.',
        'no_sendable_items' => 'Nothing on this acceptance is ready to send yet. Collect its samples first.',
    ];

    public function __construct(private readonly AcceptanceService $acceptanceService) {}

    public function __invoke(Acceptance $acceptance): RedirectResponse
    {
        $this->authorize('syncWithProvider', $acceptance);

        $result = $this->acceptanceService->syncWithProvider($acceptance);

        if ($result['action'] === 'skipped') {
            return back()->withErrors([
                'sync' => self::SKIP_REASONS[$result['reason'] ?? ''] ?? 'Nothing was sent to the provider.',
            ]);
        }

        $status = $result['action'] === 'created'
            ? 'A new order was created and is being sent to the provider.'
            : ($result['count'] === 1
                ? 'The order is being sent to the provider again.'
                : "{$result['count']} orders are being sent to the provider again.");

        return back()->with(['success' => true, 'status' => $status]);
    }
}
