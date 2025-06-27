<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\Exports\TestExport;
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
        return Excel::download(new TestExport, 'tests-list.xlsx');

    }
}
