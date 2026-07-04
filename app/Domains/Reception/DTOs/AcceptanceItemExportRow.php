<?php

declare(strict_types=1);

namespace App\Domains\Reception\DTOs;

use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Tag;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * Normalized, typed row for {@see \App\Domains\Reception\Exports\AcceptanceItemsExport}.
 *
 * Export rows arrive in two shapes — a queried {@see AcceptanceItem} carrying
 * withAggregate patient/test/method aliases, and a synthetic "merged" panel row
 * aggregated from several items sharing an acceptance + panel. This DTO gives the
 * export a single typed shape to map over instead of an `AcceptanceItem|\stdClass`
 * union. `invoice` is left loosely typed on purpose: it is a Billing model reached
 * only to hand back to the BillingAdapter, so the Reception layer must not import it.
 */
class AcceptanceItemExportRow
{
    /**
     * @param  Collection<int, mixed>  $activeSamples
     * @param  array<int, Tag>  $tags
     */
    public function __construct(
        public readonly int              $id,
        public readonly int|float|string $price,
        public readonly int|float|string $discount,
        public readonly ?string          $patientFullname,
        public readonly ?string          $patientIdno,
        public readonly ?string          $patientDateofbirth,
        public readonly ?string          $testTestsname,
        public readonly ?string          $methodName,
        public readonly int|string|null  $methodTurnaroundTime,
        public readonly string           $status,
        public readonly ?Carbon          $createdAt,
        public readonly ?Carbon          $updatedAt,
        public readonly Collection       $activeSamples,
        public readonly array            $tags,
        public readonly mixed            $invoice,
        public readonly mixed            $acceptance,
    )
    {
    }

    /**
     * Build a row from a single (non-merged) acceptance item.
     */
    public static function fromAcceptanceItem(AcceptanceItem $item): self
    {
        return new self(
            id: $item->id,
            price: $item->price,
            discount: $item->discount,
            patientFullname: $item->patient_fullname,
            patientIdno: $item->patient_idno,
            patientDateofbirth: $item->patient_dateofbirth,
            testTestsname: $item->test_testsname,
            methodName: $item->method_name,
            methodTurnaroundTime: $item->method_turnaround_time,
            status: $item->status,
            createdAt: $item->created_at,
            updatedAt: $item->updated_at,
            activeSamples: $item->activeSamples,
            tags: $item->tags->all(),
            invoice: $item->invoice,
            acceptance: $item->acceptance,
        );
    }

    /**
     * Build a single row from a group of items sharing an acceptance + panel:
     * price/discount are summed and tags are unioned, mirroring the pre-refactor
     * (object) merge shape.
     *
     * @param  Collection<int, AcceptanceItem>  $group
     */
    public static function fromMergedGroup(Collection $group): self
    {
        /** @var AcceptanceItem $first */
        $first = $group->first();

        return new self(
            id: $first->id,
            price: $group->sum('price'),
            discount: $group->sum('discount'),
            patientFullname: $first->patient_fullname,
            patientIdno: $first->patient_idno,
            patientDateofbirth: $first->patient_dateofbirth,
            testTestsname: $first->test_testsname,
            methodName: $first->method_name,
            methodTurnaroundTime: $first->method_turnaround_time,
            status: $first->status,
            createdAt: $first->created_at,
            updatedAt: $first->updated_at,
            activeSamples: $first->activeSamples,
            tags: $group->flatMap(fn (AcceptanceItem $item) => $item->tags)->unique('id')->values()->all(),
            invoice: $first->invoice,
            acceptance: $first->acceptance,
        );
    }
}
