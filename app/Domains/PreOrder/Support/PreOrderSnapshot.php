<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Support;

use App\Domains\Document\Models\Document;
use App\Domains\PreOrder\Adapters\ReferrerAdapter;
use App\Domains\PreOrder\Enums\FinanceReason;
use App\Domains\PreOrder\Enums\ItemStatus;
use App\Domains\PreOrder\Enums\PreOrderStage;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderHistory;
use App\Domains\PreOrder\Models\PreOrderItem;
use App\Domains\PreOrder\Models\PreOrderQuotation;
use App\Domains\PreOrder\Models\PreOrderRequest;
use App\Domains\PreOrder\Repositories\PreOrderRepository;

/**
 * Everything the center may see about a pre-order, as one document. The provider panel replaces
 * its whole mirror with it, so a missed webhook heals on the next one.
 *
 * Internal notes and BION user names on internal rows never leave the LIS. Prices leave only on
 * a quotation sent to the center.
 */
class PreOrderSnapshot
{
    public function __construct(
        private readonly PreOrderRepository $preOrders,
        private readonly ReferrerAdapter $referrerOrders,
    ) {}

    /** @return array<string, mixed> */
    public function build(PreOrder $preOrder): array
    {
        $preOrder = $this->preOrders->loadDetail($preOrder->fresh() ?? $preOrder);
        $used = FlowStages::used($preOrder);

        return [
            'id' => $preOrder->id,
            'code' => $preOrder->code,
            'version' => $preOrder->version,
            'referrer_id' => $preOrder->referrer_id,
            'stage' => [
                'code' => $preOrder->stage->value,
                'label' => FlowStages::label($preOrder, $preOrder->stage),
                // A pre-order sent without tests waits in review until BION picks them.
                'next_action' => $preOrder->main_test_id === null && $preOrder->stage->isReview()
                    ? 'BION is choosing the right test'
                    : $preOrder->stage->nextAction(),
                'owner' => $preOrder->action_owner->value,
                'entered_at' => $preOrder->stage_entered_at?->toIso8601String(),
            ],
            'exception' => $preOrder->exception,
            'progress' => array_map(fn (PreOrderStage $s) => [
                'code' => $s->value,
                'label' => FlowStages::label($preOrder, $s),
                'done' => $s->rank() < $preOrder->stage->rank(),
                'current' => $s === $preOrder->stage,
            ], $used),
            'start_mode' => $preOrder->start_mode->value,
            'start_hint' => $preOrder->start_hint,
            'referral_reason' => $preOrder->referral_reason,
            'patients' => $preOrder->patients,
            'main_patient_ref' => $preOrder->main_patient_ref,
            'scope' => $preOrder->scope,
            'clinical' => $preOrder->clinical,
            'main_test' => $preOrder->mainTest?->only(['id', 'name', 'code']),
            'flow' => $preOrder->flow?->only(['id', 'name', 'family']),
            'counsellor' => $preOrder->assignee?->name,
            'items' => $preOrder->items
                ->reject(fn (PreOrderItem $i) => $i->status === ItemStatus::DROPPED)
                ->map(fn (PreOrderItem $i) => [
                    'id' => $i->id,
                    'test_id' => $i->test_id,
                    'test_code' => $i->test->code,
                    'test_name' => $i->test->name,
                    'patient_ref' => $i->patient_ref,
                    'qty' => $i->qty,
                    'status' => $i->status->value,
                    'added_by' => $i->added_by->value,
                    'release_key' => $i->release_key,
                    'request' => $i->request_id ? $preOrder->requests->firstWhere('id', $i->request_id)?->number : null,
                    'quotation' => $i->quotation_id ? $preOrder->quotations->firstWhere('id', $i->quotation_id)?->number : null,
                ])->values()->all(),
            'quotations' => $preOrder->quotations->map(fn (PreOrderQuotation $q) => [
                'number' => $q->number,
                'request' => $q->request_id ? $preOrder->requests->firstWhere('id', $q->request_id)?->number : null,
                'reasons' => array_map(fn (string $r) => FinanceReason::tryFrom($r)?->label() ?? $r, $q->reasons),
                'reason' => $q->reason,
                'status' => $q->status->value,
                'status_label' => $q->status->label(),
                'subtotal' => (string) $q->subtotal,
                'discount' => (string) $q->discount,
                'total' => (string) $q->total,
                'approved_amount' => $q->approved_amount === null ? null : (string) $q->approved_amount,
                'expires_at' => $q->expires_at?->toIso8601String(),
                'decided_by' => $q->decided_by,
                'decided_at' => $q->decided_at?->toIso8601String(),
                'note' => $q->note,
                'center_reference' => $q->center_reference,
                'created_at' => $q->created_at?->toIso8601String(),
                // The PDF, once rendered; downloaded like any other file on the pre-order.
                'pdf' => $preOrder->documents->first(fn (Document $d) => $d->related_type === 'pre_order_quotation' && (int) $d->related_id === $q->id)?->hash,
                'lines' => $q->items->map(fn (PreOrderItem $i) => [
                    'id' => $i->id,
                    'test_code' => $i->test->code,
                    'test_name' => $i->test->name,
                    'patient_ref' => $i->patient_ref,
                    'qty' => $i->qty,
                    'unit_price' => $i->unit_price === null ? null : (string) $i->unit_price,
                    'line_total' => $i->lineTotal(),
                    'status' => $i->status->value,
                ])->values()->all(),
            ])->values()->all(),
            'requests' => $preOrder->requests->sortBy('number')->map(fn (PreOrderRequest $r) => [
                'number' => $r->number,
                'label' => $r->label(),
                'types' => $r->types,
                'reason' => $r->reason,
                'message' => $r->message,
                'needs' => $r->needs,
                'blocking' => $r->blocking,
                'due_at' => $r->due_at?->toIso8601String(),
                'status' => $r->status->value,
                'answer' => $r->answer,
                'answered_at' => $r->answered_at?->toIso8601String(),
                'closed_at' => $r->closed_at?->toIso8601String(),
            ])->values()->all(),
            'orders_to_place' => $this->ordersToPlace($preOrder),
            'linked_orders' => array_map(fn (LinkedOrder $o) => $o->toArray(), $this->referrerOrders->linkedOrders($preOrder->id)),
            'documents' => $preOrder->documents->map(fn (Document $d) => [
                'hash' => $d->hash,
                'name' => $d->originalName,
                'tag' => $d->tag,
                'ext' => $d->ext,
                'created_at' => $d->created_at?->toIso8601String(),
            ])->values()->all(),
            'history' => $preOrder->histories
                ->reject(fn (PreOrderHistory $h) => $h->internal)
                ->map(fn (PreOrderHistory $h) => [
                    'type' => $h->type->value,
                    'from_stage' => $h->from_stage,
                    'to_stage' => $h->to_stage,
                    'body' => $h->body,
                    'side' => $h->side->value,
                    'actor_name' => $h->actor_name,
                    'request' => $h->meta['request'] ?? null,
                    'quotation' => $h->meta['quotation'] ?? null,
                    'created_at' => $h->created_at?->toIso8601String(),
                ])->values()->all(),
            'submitted_at' => $preOrder->submitted_at?->toIso8601String(),
            'closed_at' => $preOrder->closed_at?->toIso8601String(),
            'created_at' => $preOrder->created_at?->toIso8601String(),
        ];
    }

    /**
     * Released lines grouped per order. The provider panel turns each group into a pending order
     * with the patients and tests filled in; the center adds sample details and submits it the
     * usual way, and the order comes back carrying pre_order_id and the release key.
     *
     * @return list<array<string, mixed>>
     */
    private function ordersToPlace(PreOrder $preOrder): array
    {
        return $preOrder->items
            ->filter(fn (PreOrderItem $i) => $i->status === ItemStatus::RELEASED && $i->release_key !== null)
            ->groupBy('release_key')
            ->map(fn ($items, $key) => [
                'release_key' => (string) $key,
                'purpose' => $items->first()?->release_purpose?->value,
                'items' => $items->map(fn (PreOrderItem $i) => [
                    'test_id' => $i->test_id,
                    'patient_ref' => $i->patient_ref,
                    'qty' => $i->qty,
                ])->values()->all(),
            ])->values()->all();
    }
}
