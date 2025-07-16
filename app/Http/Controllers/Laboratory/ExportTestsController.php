<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\Exports\TestExport;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Services\TestService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ExportTestsController extends Controller
{
    public function __construct(private TestService $testService)
    {
        $this->middleware("indexProvider:code");
    }


    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $request->merge([
            "filters" => [
                "active" => true,
                ...$request->get("filters", [])
            ],
            "with" => [
                'testGroups',
                'methodTests.method.test.sampleTypes',
                'methodTests.method.workflow'
            ]
        ]);
        $tests = $this->testService->allTests($request->all());
        return Excel::download(new TestExport($tests), 'tests-list.xlsx');

    }
}
