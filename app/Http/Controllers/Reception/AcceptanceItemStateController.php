<?php

namespace App\Http\Controllers\Reception;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Events\PatientDocumentUpdateEvent;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Domains\Reception\Requests\UpdateAcceptanceItemStateRequest;
use App\Domains\Reception\Resources\AcceptanceItemStateResource;
use App\Domains\Reception\Services\AcceptanceItemStateService;
use App\Http\Controllers\Controller;

class AcceptanceItemStateController extends Controller
{
    public function __construct(private readonly AcceptanceItemStateService $acceptanceItemStateService)
    {
    }

    /**
     * Display the specified resource.
     */
    public function show(AcceptanceItemState $acceptanceItemState)
    {
        $acceptanceItemState = $this->acceptanceItemStateService->showAcceptanceItemState($acceptanceItemState);
        return AcceptanceItemStateResource::make($acceptanceItemState);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAcceptanceItemStateRequest $request, AcceptanceItemState $acceptanceItemState)
    {
        $userId = auth()->id();

        foreach ($request["parameters"] as $parameter) {
            if ($parameter["type"] == "file" && isset($parameter["value"])) {
                $acceptanceItemState->loadMissing("sample");
                PatientDocumentUpdateEvent::dispatch(
                    $parameter["value"]["id"],
                    $acceptanceItemState->sample->patient_id,
                    DocumentTag::ACCEPTANCE_ITEM_STATES->value,
                    "acceptance_item_state",
                    $acceptanceItemState->id
                );
            }
        }


        if ($request->actionType === "Update") {
            $this->acceptanceItemStateService->updateParameters(
                $acceptanceItemState,
                $request->parameters,
                $request->details ?? "",
                $userId
            );
        } else {
            if ($acceptanceItemState->status !== AcceptanceItemStateStatus::PROCESSING)
                return back()
                    ->withErrors(["actionType" => "It is not possible to change the status because the current status is " . $acceptanceItemState->status->value]);
            $status = AcceptanceItemStateStatus::from($request->actionType);
            $this->acceptanceItemStateService->changeStatus(
                $acceptanceItemState,
                $status,
                $request->parameters,
                $request->details ?? "",
                $userId,
                $request->next ?? null
            );
        }

        return back()->with([
            "success" => true,
            "status" => "Acceptance Item State updated successfully."
        ]);
    }

}
