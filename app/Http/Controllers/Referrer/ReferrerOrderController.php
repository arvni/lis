<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Services\ReferrerOrderService;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateReferrerOrderRequest;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReferrerOrderController extends Controller
{
    public function __construct(private ReferrerOrderService $referrerOrderService)
    {
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @param Request $request
     * @return Response
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", ReferrerOrder::class);
        $requestInputs = $request->all();
        $referrerOrders = $this->referrerOrderService->listReferrerOrders($requestInputs);
        return Inertia::render('ReferrerOrder/Index', compact("referrerOrders", "requestInputs"));
    }

    /**
     * Display the specified resource.
     */
    public function show(ReferrerOrder $referrerOrder)
    {
        $this->authorize("view", $referrerOrder);
        $referrerOrder=$this->referrerOrderService->loadShowRequirementLoaded($referrerOrder);
        return Inertia::render('ReferrerOrder/Show', ["referrerOrder" => $referrerOrder]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ReferrerOrder $referrerOrder)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateReferrerOrderRequest $request, ReferrerOrder $referrerOrder)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ReferrerOrder $referrerOrder)
    {
        //
    }
}
