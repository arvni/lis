<?php

namespace App\Http\Controllers\Referrer;

use App\Domains\Referrer\DTOs\OrderMaterialDTO;
use App\Domains\Referrer\Enums\OrderMaterialStatus;
use App\Domains\Referrer\Events\OrderMaterialUpdated;
use App\Domains\Referrer\Models\OrderMaterial;
use App\Domains\Referrer\Requests\UpdateMaterialRequest;
use App\Domains\Referrer\Requests\UpdateOrderMaterialRequest;
use App\Domains\Referrer\Services\OrderMaterialService;
use App\Http\Controllers\Controller;
use App\Http\Resources\OrderMaterialResource;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderMaterialController extends Controller
{
    public function __construct(private readonly OrderMaterialService $orderMaterialService)
    {
        $this->middleware("indexProvider:id,desc")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", OrderMaterial::class);
        $requestInputs = $request->all();
        $orderMaterials = $this->orderMaterialService->listOrderMaterials($requestInputs);
        return Inertia::render('OrderMaterials/Index', compact("orderMaterials", "requestInputs"));
    }


    /**
     * show the specified resource in storage.
     */
    public function show(OrderMaterial $orderMaterial)
    {
        $loadedOrderMaterial = $this->orderMaterialService->loadForEdit($orderMaterial);
        return new OrderMaterialResource($loadedOrderMaterial);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(OrderMaterial $orderMaterial, UpdateOrderMaterialRequest $request): RedirectResponse
    {
        if ($orderMaterial->status===OrderMaterialStatus::PROCESSED)
            abort(400,"This Order Material has already been processed");
        $validatedData = $request->validated();
        $orderMaterialDto = OrderMaterialDTO::fromArray(array_merge($orderMaterial->toArray(), $validatedData));
        $orderMaterialDto->status = OrderMaterialStatus::PROCESSED->value;
        $this->orderMaterialService->updateOrderMaterial($orderMaterial, $orderMaterialDto);
        OrderMaterialUpdated::dispatch($orderMaterial);
        return back()->with(["success" => true, "status" => "Updated Successfully"]);
    }

    /**
     * Remove the specified resource from storage.
     * @throws Exception
     */
    public function destroy(OrderMaterial $orderMaterial): RedirectResponse
    {
        $this->authorize("delete", $orderMaterial);
        $this->orderMaterialService->deleteOrderMaterial($orderMaterial);
        return back()->with(["success" => true, "status" => "Successfully Deleted."]);
    }
}
