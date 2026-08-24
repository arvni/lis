<?php

declare(strict_types=1);

namespace App\Domains\Reception\Adapters;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Billing\Repositories\InvoiceRepository;
use App\Domains\Billing\Services\CardDiscountSyncService;
use App\Domains\Billing\Services\DiscountCardResolver;
use App\Domains\Billing\Services\InvoiceComposer;
use App\Domains\Billing\Services\InvoiceService;

class BillingAdapter
{
    public function __construct(
        private InvoiceRepository $invoiceRepository,
        private InvoiceService $invoiceService,
        private InvoiceComposer $invoiceComposer,
        private DiscountCardResolver $cardResolver,
        private CardDiscountSyncService $cardDiscountSyncService,
    ) {}

    public function getInvoiceNo(Invoice $invoice): string
    {
        return $this->invoiceRepository->getInvoiceNo($invoice);
    }

    public function findInvoiceById(int|string $id): ?Invoice
    {
        return $this->invoiceService->findInvoiceById($id);
    }

    public function recomposeInvoice(Invoice $invoice, bool $force = false): int
    {
        return $this->invoiceComposer->recompose($invoice, $force);
    }

    /**
     * Look up a scanned or typed discount card and say whether it may be used.
     * Returns a plain array so Reception never handles a Billing model.
     *
     * @return array{valid: bool, reason: string|null, card: array<string, mixed>|null}
     */
    public function resolveDiscountCard(string $code, ?string $signature = null): array
    {
        $verdict = $this->cardResolver->resolve($code, $signature);
        $card = $verdict->card;

        return [
            'valid' => $verdict->valid,
            'reason' => $verdict->reason,
            'card' => $verdict->valid && $card ? [
                'id' => $card->id,
                'number' => $card->number,
                'partner' => $card->partner?->name,
                'expires_at' => $card->expires_at?->format('Y-m-d'),
                'usage_limit' => $card->usage_limit,
                'used_count' => $card->used_count,
            ] : null,
        ];
    }

    /**
     * Recalculate the card-sourced discounts on an acceptance from scratch.
     */
    public function syncCardDiscounts(Acceptance $acceptance, ?int $actorId = null): void
    {
        $this->cardDiscountSyncService->sync($acceptance, $actorId);
    }
}
