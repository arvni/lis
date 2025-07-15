<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\Services\TestService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShowTestListController extends Controller
{
    public function __construct(private TestService $testService)
    {
        $this->middleware('indexProvider');
    }

    /**
     * Display a paginated list of active laboratory tests.
     *
     * @param Request $request
     * @return Response
     */
    public function __invoke(Request $request)
    {
        $requestData = $request->all();

        // Prepare service parameters with proper structure
        $serviceParams = [
            ...$requestData,
            'filters' => [
                ...($requestData['filters'] ?? []),
                'active' => true
            ],
            'with' => [
                'sampleTypes',
                'methodTests' => function ($query) {
                    $query->whereHas("method", function ($query) {
                        $query->active();
                    });
                    $query->active();
                    $query->with(["method"]);
                },
                "testGroups:name,id"
            ]
        ];

        $tests = $this->testService->listTests($serviceParams);

        return Inertia::render('TestList', [
            'tests' => $tests,
            'requestInputs' => $requestData
        ]);
    }
}
