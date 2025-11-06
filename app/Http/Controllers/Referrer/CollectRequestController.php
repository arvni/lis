<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\DTOs\CollectRequestDTO;
use App\Domains\Referrer\Enums\CollectRequestStatus;
use App\Domains\Referrer\Models\CollectRequest;
use App\Domains\Referrer\Models\SampleCollector;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Services\CollectRequestService;
use App\Http\Controllers\Controller;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CollectRequestController extends Controller
{
    public function __construct(private CollectRequestService $collectRequestService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", CollectRequest::class);
        $requestInputs = $request->all();
        $collectRequests = $this->collectRequestService->listCollectRequests($requestInputs);
        return Inertia::render('CollectRequest/Index', compact("collectRequests", "requestInputs"));
    }

    /**
     * @throws AuthorizationException
     */
    public function create(Request $request): Response
    {
        $this->authorize("create", CollectRequest::class);

        $sampleCollectors = SampleCollector::all();
        $referrers = Referrer::all();

        return Inertia::render('CollectRequest/Add', compact('sampleCollectors', 'referrers'));
    }

    public function store(Request $request): RedirectResponse
    {
        $validatedData = $request->validate([
            'sample_collector_id' => 'required|exists:sample_collectors,id',
            'referrer_id' => 'required|exists:referrers,id',
            'logistic_information' => 'nullable|array',
            'status' => ['nullable', 'string', Rule::in(CollectRequestStatus::values())],
        ]);

        $collectRequestDTO = new CollectRequestDTO(
            $validatedData['sample_collector_id'],
            $validatedData['referrer_id'],
            $validatedData['logistic_information'] ?? [],
            $validatedData['status'] ?? null
        );

        $collectRequest = $this->collectRequestService->createCollectRequest($collectRequestDTO);
        return redirect()->route("collect-requests.show", $collectRequest->id);
    }

    /**
     * @throws AuthorizationException
     */
    public function show(CollectRequest $collectRequest): Response
    {
        $this->authorize("view", $collectRequest);
        $data = $this->collectRequestService->getCollectRequestDetails($collectRequest);
        return Inertia::render('CollectRequest/Show', [
            ...$data,
            "canEdit" => Gate::allows("update", $collectRequest),
        ]);
    }

    public function edit(CollectRequest $collectRequest): Response
    {
        $this->authorize("update", $collectRequest);

        $sampleCollectors = SampleCollector::all();
        $referrers = Referrer::all();

        return Inertia::render('CollectRequest/Edit', [
            "collectRequest" => $collectRequest,
            "sampleCollectors" => $sampleCollectors,
            "referrers" => $referrers
        ]);
    }

    public function update(Request $request, CollectRequest $collectRequest): RedirectResponse
    {
        $validatedData = $request->validate([
            'sample_collector_id' => 'required|exists:sample_collectors,id',
            'referrer_id' => 'required|exists:referrers,id',
            'logistic_information' => 'nullable|array',
            'status' => ['nullable', 'string', Rule::in(CollectRequestStatus::values())],
        ]);

        $collectRequestDTO = new CollectRequestDTO(
            $validatedData['sample_collector_id'],
            $validatedData['referrer_id'],
            $validatedData['logistic_information'] ?? [],
            $validatedData['status'] ?? null
        );

        $this->collectRequestService->updateCollectRequest($collectRequest, $collectRequestDTO);
        return redirect()->route("collect-requests.show", $collectRequest->id)
            ->with(['status' => "Collect Request Successfully Updated", "success" => true]);
    }

    /**
     * @throws AuthorizationException
     * @throws Exception
     */
    public function destroy(CollectRequest $collectRequest): RedirectResponse
    {
        $this->authorize("delete", $collectRequest);
        $this->collectRequestService->deleteCollectRequest($collectRequest);
        return redirect()->back()->with(["success" => true, "status" => "Collect Request successfully deleted"]);
    }
}
