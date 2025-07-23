<?php

namespace App\Domains\Reception\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcceptanceItemStateResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            "id" => $this["id"],
            "parameters" => is_string($this->parameters) ? json_decode($this->parameters, true) : $this->parameters,
            "details" => $this->details,
            "status" => $this->status,
            "isFirstSection" => $this->is_first_section,
            "startedAt" => $this->started_at ? (new Carbon($this->started_at))->diffForHumans() : "Not started",
            "finishedAt" => $this->finished_at,
            "acceptanceItemId" => $this->acceptanceItem->id,
            "timeline" => $this->acceptanceItem->timeline,
            "test" => [
                "id" => $this->acceptanceItem->test->id,
                "name" => $this->acceptanceItem->test->name,
            ],
            "patients" => $this->acceptanceItem->patients->map(function ($patient) {
                return [
                    "id" => $patient->id,
                    "age" => $patient->age,
                    "gender" => $patient->gender,
                    "fullName" => $patient->fullName,
                ];
            }),
            "sample" =>$this->sample? [
                "barcode" => $this->sample->barcode,
                "sampleType" => $this->sample->sampleType->name,
                "patient" => $this->sample->patient,
                "created_at" => (new Carbon($this->sample->created_at))->diffForHumans(),
            ] : [],
        ];
    }
}
