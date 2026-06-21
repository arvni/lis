<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\Exports\ReferrerTestExport;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Services\ReferrerTestService;
use App\Http\Controllers\Controller;
use Maatwebsite\Excel\Facades\Excel;

class ExportReferrerTestsController extends Controller
{
    public function __construct(private readonly ReferrerTestService $referrerTestService) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(Referrer $referrer)
    {
        $tests = $this->referrerTestService->getActiveTestsForReferrer($referrer->id);

        return Excel::download(new ReferrerTestExport($tests), $referrer->fullName.'-tests-list.xlsx');
    }
}
