<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\DTOs\SampleCollectorDTO;
use App\Domains\Referrer\Models\SampleCollector;
use App\Domains\Referrer\Requests\StoreSampleCollectorRequest;
use App\Domains\Referrer\Requests\UpdateSampleCollectorRequest;
use App\Domains\Referrer\Services\SampleCollectorService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SampleCollectorController extends Controller
{
    public function __construct(private SampleCollectorService $sampleCollectorService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", SampleCollector::class);
        $requestInputs = $request->all();
        $sampleCollectors = $this->sampleCollectorService->listSampleCollectors($requestInputs);
        return Inertia::render('SampleCollector/Index', compact("sampleCollectors", "requestInputs"));
    }

    /**
     * @throws AuthorizationException
     */
    public function create(Request $request): Response
    {
        $this->authorize("create", SampleCollector::class);

        return Inertia::render('SampleCollector/Add');
    }

    public function store(StoreSampleCollectorRequest $request): RedirectResponse
    {
        $sampleCollectorDTO = new SampleCollectorDTO(
            $request->validated('name'),
            $request->validated('email')
        );

        $sampleCollector = $this->sampleCollectorService->createSampleCollector($sampleCollectorDTO);
        return redirect()->route("sample-collectors.show", $sampleCollector->id);
    }

    /**
     * @throws AuthorizationException
     */
    public function show(SampleCollector $sampleCollector): Response
    {
        $this->authorize("view", $sampleCollector);
        $data = $this->sampleCollectorService->getSampleCollectorDetails($sampleCollector);
        return Inertia::render('SampleCollector/Show', [
            ...$data,
            "canEdit" => Gate::allows("update", $sampleCollector),
        ]);
    }

    public function edit(SampleCollector $sampleCollector): Response
    {
        $this->authorize("update", $sampleCollector);
        return Inertia::render('SampleCollector/Edit', ["sampleCollector" => $sampleCollector]);
    }

    public function update(UpdateSampleCollectorRequest $request, SampleCollector $sampleCollector): RedirectResponse
    {
        $sampleCollectorDTO = new SampleCollectorDTO(
            $request->validated('name'),
            $request->validated('email')
        );

        $this->sampleCollectorService->updateSampleCollector($sampleCollector, $sampleCollectorDTO);
        return redirect()->route("sample-collectors.show", $sampleCollector->id)
            ->with(['status' => "$sampleCollector->name Successfully Updated", "success" => true]);
    }

    /**
     * @throws AuthorizationException
     * @throws Exception
     */
    public function destroy(SampleCollector $sampleCollector): RedirectResponse
    {
        $this->authorize("delete", $sampleCollector);
        $this->sampleCollectorService->deleteSampleCollector($sampleCollector);
        return redirect()->back()->with(["success" => true, "status" => "$sampleCollector->name successfully deleted"]);
    }
}
