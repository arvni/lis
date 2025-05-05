<?php

namespace App\Domains\Reception\Repositories;

use App\Domains\Reception\Events\SampleCollectedEvent;
use App\Domains\Reception\Models\Sample;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;

class SampleRepository
{

    public function listSamples(array $queryData): LengthAwarePaginator
    {
        $query = Sample::with([
            "acceptanceItems.test",
            "acceptanceItems.method",
            "sampleType",
        ])
            ->withAggregate("patient", "fullName")
            ->withAggregate("patient", "idNo");
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function listSampleBarcodes($filters): Collection
    {
        return Sample::query()
            ->where(function ($q) use ($filters) {
                if (isset($filters["acceptance_id"]))
                    $q->whereHas("acceptanceItems", fn($q) => $q->where("acceptance_id", $filters["acceptance_id"]));
            })
            ->with([
                "patient",
                "acceptanceItems" => function ($q) use ($filters) {
                    $q->wherePivot("active", true);
                    if (isset($filters["acceptance_id"]))
                        $q->where("acceptance_id", $filters["acceptance_id"]);
                    $q->with("test");
                }
            ])
            ->get();
    }

    public function creatSample(array $sampleData): Sample
    {
        $sample = Sample::query()->create([
            "barcode" => $sampleData["barcode"] ?? $this->generateBarcode($sampleData["barcodeGroup"]),
            "sample_type_id" => $sampleData["sample_type_id"],
            "status" => "sampled",
            "collection_date" => isset($sampleData["collection_date"]) ? Carbon::parse($sampleData["collection_date"]) : Carbon::now(),
            "sampler_id" => auth()->user()->id,
            "patient_id" => $sampleData["patient_id"]
        ]);
        $this->syncAcceptanceItems($sample, Arr::pluck($sampleData["acceptance_items"], "id"));
        return $sample;
    }

    public function updateSample(Sample $sample, array $sampleData): Sample
    {
        $sample->fill(Arr::except($sampleData, "acceptance_items"));
        if ($sample->isDirty())
            $sample->save();
        $this->syncAcceptanceItems($sample, $sampleData["acceptance_items"]);
        return $sample;
    }

    public function deleteSample(Sample $sample): void
    {
        $sample->delete();
    }

    public function findSampleById($id): ?Sample
    {
        return Sample::find($id);
    }

    public function syncAcceptanceItems(Sample $sample, array $acceptanceItems): void
    {
        $sample->acceptanceItems()->sync($acceptanceItems);
        foreach ($acceptanceItems as $acceptanceItem) {
            SampleCollectedEvent::dispatch($acceptanceItem, $sample->barcode);
        }
    }

    public function generateBarcode(array $barcodeGroup): string
    {

        return $barcodeGroup["abbr"] . Carbon::now()->getTimestamp();
    }

    public function findActiveSamples($acceptanceItemIds, $sampleType): ?Sample
    {
        return Sample::whereHas("acceptanceItems", fn($q) => $q->whereIn("acceptance_items.id", $acceptanceItemIds)
            ->where("active", true))
            ->where("sample_type_id", $sampleType)
            ->first();
    }

    public function findDeactivatedSamples($acceptanceItemIds, $sampleType): ?Sample
    {
        return Sample::whereHas("acceptanceItems", fn($q) => $q->whereIn("acceptance_items.id", $acceptanceItemIds)
            ->where("active", false))
            ->where("sample_type_id", $sampleType)
            ->latest()
            ->first();
    }

    public function findSampleByBarcode($barcode): ?Sample
    {
        return Sample::where("barcode", $barcode)->first();
    }

    private function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search($filters["search"]);
        if (isset($filters["status"]))
            $query->where("status", $filters["status"]);
        if (isset($filters["patient_id"]))
            $query->where("patient_id", $filters["patient_id"]);
        if (isset($filters["acceptance_id"]))
            $query->whereHas("acceptanceItems", fn($q) => $q->where("acceptance_id", $filters["acceptance_id"]));
        if (isset($filters["sample_type_id"]))
            $query->where("sample_type_id", $filters["sample_type_id"]);
    }

}
