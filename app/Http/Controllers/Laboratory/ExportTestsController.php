<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\Exports\TestExport;
use App\Domains\Laboratory\Models\Test;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportTestsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $tests=Test::with([
            'testGroup',
            'methodTests.method.test.sampleTypes',
            'methodTests.method.workflow',
        ])->active()->get();
        return Excel::download(new TestExport($tests), 'tests-list.xlsx');

    }
}
