<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Laboratory\Exports\TestExport;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Referrer\Exports\ReferrerTestExport;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerTest;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportReferrerTestsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Referrer $referrer)
    {
        $tests = ReferrerTest::query()
            ->with(["test.testGroup","test.methodTests.method"])
            ->whereHas("test", function ($query) {
                $query->active();
            })
            ->where("referrer_id", $referrer->id)
            ->get();
        return Excel::download(new ReferrerTestExport($tests), $referrer->fullName . '-tests-list.xlsx');

    }
}
