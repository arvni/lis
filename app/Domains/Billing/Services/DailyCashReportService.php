<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\Adapters\ReceptionAdapter;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Payment;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DailyCashReportService
{
    public function __construct(private ReceptionAdapter $receptionAdapter) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function buildReportData(Carbon $date): array
    {
        $dateRange = [$date->copy()->startOfDay(), $date->copy()->endOfDay()];

        $data = [];
        $processedIds = [];

        $this->processAcceptanceItems($dateRange, $data, $processedIds);
        $this->processPayments($dateRange, $data, $processedIds);

        return $data;
    }

    /**
     * @param  array{0: Carbon, 1: Carbon}  $dateRange
     * @param  list<array<string, mixed>>  $data
     * @param  list<int>  $processedIds
     */
    private function processAcceptanceItems(array $dateRange, array &$data, array &$processedIds): void
    {
        $acceptanceItems = $this->receptionAdapter->acceptanceItemsForCashReport($dateRange);

        foreach ($acceptanceItems->groupBy('acceptance_id') as $acceptanceId => $items) {
            $acceptance = $items->first()->acceptance;
            // No acceptance means it was deleted — the belongsTo skips soft deletes.
            if (!$acceptance || $this->isCancelled($acceptance->invoice)) {
                continue;
            }
            $processedIds[] = (int) $acceptanceId;
            $data[] = $this->buildRow($acceptance, $dateRange);
        }
    }

    /**
     * @param  array{0: Carbon, 1: Carbon}  $dateRange
     * @param  list<array<string, mixed>>  $data
     * @param  list<int>  $processedIds
     */
    private function processPayments(array $dateRange, array &$data, array &$processedIds): void
    {
        $payments = Payment::whereBetween('created_at', $dateRange)
            ->where('paymentMethod', '!=', PaymentMethod::CREDIT)
            // Money taken against an invoice that has since been cancelled is not
            // the day's takings any more — same rule the billing dashboard applies.
            ->whereHas('invoice', fn($q) => $q->where('status', '!=', InvoiceStatus::CANCELED->value))
            ->with(
                'invoice.acceptance.acceptanceItems.test',
                'invoice.acceptance.acceptanceItems.patients',
                'invoice.acceptance.patient',
                'invoice.acceptance.referrer',
                'invoice.acceptance.payments',
            )
            ->get();

        foreach ($payments as $payment) {
            $acceptance = $payment->invoice?->acceptance;
            if (!$acceptance || in_array($acceptance->id, $processedIds)) {
                continue;
            }
            $processedIds[] = $acceptance->id;
            $data[] = $this->buildRow($acceptance, $dateRange);
        }
    }

    private function isCancelled(?Invoice $invoice): bool
    {
        return $invoice?->status === InvoiceStatus::CANCELED->value;
    }

    /**
     * One row per acceptance, covering *only that day's activity*: the items booked
     * on the report date and the money collected on it. Nothing here reaches outside
     * the day, which is what makes the daily figures additive — sum `test_price`
     * across every day and you get what was billed, sum `prepayment` and you get what
     * was collected — and makes a re-export of an old day reproduce its own numbers
     * instead of drifting as later items and payments land.
     *
     * The trade-off, chosen deliberately: `remaining` is that day's balance, not the
     * patient's. A row that exists only because money came in has no items that day,
     * so it reports a price of 0 and a negative `remaining` — the day reduced what was
     * outstanding. Summed across days those negatives land on the true balance owed.
     *
     * Every item type counts towards the price, services included.
     *
     * @param  array{0: Carbon, 1: Carbon}  $dateRange
     * @return array<string, mixed>
     */
    private function buildRow(Acceptance $acceptance, array $dateRange): array
    {
        $items = $this->itemsWithin($acceptance->acceptanceItems, $dateRange);
        $total = (float) $items->sum('price');
        $totalDiscount = (float) $items->sum('discount');

        // Credit is a promise to pay, never cash in the drawer.
        $nonCredit = $acceptance->payments->where('paymentMethod', '!=', PaymentMethod::CREDIT);
        $paidOnDate = $this->paymentsWithin($nonCredit, $dateRange);
        $paidToday = (float) $paidOnDate->sum('price');

        return [
            'test_name'      => $this->extractTestNames($items),
            'patient_name'   => $this->extractPatientNames($items, $acceptance),
            'test_price'     => $total,
            'payment_method' => $paidOnDate->map(fn(Payment $p) => $p->paymentMethod->name)->unique()->join(', '),
            'discount'       => $totalDiscount,
            'prepayment'     => $paidToday,
            // Pre-split for the sheet's summary line, so it never has to parse the
            // joined `payment_method` label back into amounts.
            'paid_cash_card' => $this->sumForMethods($paidOnDate, [PaymentMethod::CASH, PaymentMethod::CARD]),
            'paid_transfer'  => $this->sumForMethods($paidOnDate, [PaymentMethod::TRANSFER]),
            'remaining'      => $total - $paidToday - $totalDiscount,
            'receipt_no'     => $paidOnDate
                ->whereIn('paymentMethod', [PaymentMethod::CARD, PaymentMethod::TRANSFER])
                ->map(fn(Payment $p) => $p->information['transferReference'] ?? $p->information['receiptReferenceCode'] ?? '')
                ->filter()
                ->unique()
                ->implode(', '),
            'referrer'       => $acceptance->referrer->fullName ?? '',
        ];
    }

    /**
     * @param  Collection<int, AcceptanceItem>  $items
     * @param  array{0: Carbon, 1: Carbon}  $dateRange
     * @return Collection<int, AcceptanceItem>
     */
    private function itemsWithin(Collection $items, array $dateRange): Collection
    {
        return $items
            ->filter(fn(AcceptanceItem $item) => $this->createdWithin($item->created_at, $dateRange))
            ->values();
    }

    /**
     * @param  Collection<int, Payment>  $payments
     * @param  array{0: Carbon, 1: Carbon}  $dateRange
     * @return Collection<int, Payment>
     */
    private function paymentsWithin(Collection $payments, array $dateRange): Collection
    {
        return $payments
            ->filter(fn(Payment $payment) => $this->createdWithin($payment->created_at, $dateRange))
            ->values();
    }

    /**
     * The one date rule both a row's items and its payments are held to — a record
     * belongs to the report only if it came into being on the report date.
     *
     * @param  array{0: Carbon, 1: Carbon}  $dateRange
     */
    private function createdWithin(?Carbon $createdAt, array $dateRange): bool
    {
        [$from, $to] = $dateRange;

        return $createdAt !== null && $createdAt >= $from && $createdAt <= $to;
    }

    /**
     * @param  Collection<int, Payment>  $payments
     * @param  list<PaymentMethod>  $methods
     */
    private function sumForMethods(Collection $payments, array $methods): float
    {
        return (float) $payments->whereIn('paymentMethod', $methods)->sum('price');
    }

    /**
     * @param  Collection<int, AcceptanceItem>  $items
     */
    private function extractTestNames(Collection $items): string
    {
        return $items->pluck('test.name')->filter()->unique()->implode(', ');
    }

    /**
     * @param  Collection<int, AcceptanceItem>  $items
     */
    private function extractPatientNames(Collection $items, Acceptance $acceptance): string
    {
        return $items
            ->reduce(fn($carry, $item) => $carry->merge($item->patients), collect())
            ->merge([$acceptance->patient])
            ->unique('id')
            ->map(fn($p) => $p->fullName ?? '')
            ->filter()
            ->implode(', ');
    }
}
