<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Reception\Exports\AcceptancesExport;
use App\Domains\Reception\Services\AcceptanceService;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use App\Domains\Reception\Models\Acceptance;
use Maatwebsite\Excel\Facades\Excel;

class ExportAcceptancesController extends Controller
{
    public function __construct(private readonly AcceptanceService $acceptanceService) {}

    /**
     * @throws AuthorizationException
     */
    public function __invoke(Request $request)
    {
        $this->authorize('viewAny', Acceptance::class);

        $queryData = $request->all();
        $filters   = $queryData['filters'] ?? [];

        // Default to last 3 months when no date filter is set
        if (empty($filters['date']) && empty($filters['from_date']) && empty($filters['to_date'])) {
            $queryData['filters'] = array_merge($filters, [
                'from_date' => Carbon::now('Asia/Muscat')->subMonths(3)->startOfDay()->toDateString(),
                'to_date'   => Carbon::now('Asia/Muscat')->toDateString(),
            ]);
        }

        $acceptances = $this->acceptanceService->exportAcceptances($queryData);

        $filename = 'acceptances-' . Carbon::now('Asia/Muscat')->format('Y-m-d') . '.xlsx';

        return Excel::download(new AcceptancesExport($acceptances), $filename);
    }
}
