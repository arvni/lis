<?php

namespace App\Domains\Billing\Services;

use App\Domains\Billing\Adapters\ReceptionAdapter;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Payment;
use App\Domains\Reception\Models\Acceptance;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class DailyCashReportService
{
    public function __construct(private ReceptionAdapter $receptionAdapter) {}

    public function buildReportData(Carbon $date): array
    {
        $dateRange = [$date->copy()->startOfDay(), $date->copy()->endOfDay()];

        $data = [];
        $processedIds = [];

        $this->processAcceptanceItems($dateRange, $data, $processedIds);
        $this->processPayments($dateRange, $data, $processedIds);

        return $data;
    }

    private function processAcceptanceItems(array $dateRange, array &$data, array &$processedIds): void
    {
        $acceptanceItems = $this->receptionAdapter->acceptanceItemsForCashReport($dateRange);

        foreach ($acceptanceItems->groupBy('acceptance_id') as $acceptanceId => $items) {
            $acceptance = $items->first()->acceptance;
            if (!$acceptance) {
                continue;
            }
            $processedIds[] = $acceptanceId;
            $data[] = $this->buildRow(
                $acceptance,
                $this->extractTestNames($items),
                $this->extractPatientNames($items, $acceptance),
                $items->sum('price'),
                $items->sum('discount'),
            );
        }
    }

    private function processPayments(array $dateRange, array &$data, array &$processedIds): void
    {
        $payments = Payment::whereBetween('created_at', $dateRange)
            ->where('paymentMethod', '!=', PaymentMethod::CREDIT)
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
            $items = $acceptance->acceptanceItems;
            $data[] = $this->buildRow(
                $acceptance,
                $this->extractTestNames($items),
                $this->extractPatientNames($items, $acceptance),
                $items->sum('price'),
                $items->sum('discount'),
            );
        }
    }

    private function buildRow(
        Acceptance $acceptance,
        string $testName,
        string $patientName,
        float $total,
        float $totalDiscount,
    ): array {
        $paymentsExcludingCredit = $acceptance->payments->where('paymentMethod', '!=', PaymentMethod::CREDIT);
        $totalPaid = $paymentsExcludingCredit->sum('price');

        return [
            'test_name'      => $testName,
            'patient_name'   => $patientName,
            'test_price'     => $total,
            'payment_method' => $paymentsExcludingCredit->map(fn($p) => $p->paymentMethod->name)->unique()->join(', '),
            'discount'       => $totalDiscount,
            'prepayment'     => $totalPaid,
            'remaining'      => $total - $totalPaid - $totalDiscount,
            'receipt_no'     => $paymentsExcludingCredit
                ->whereIn('paymentMethod', [PaymentMethod::CARD, PaymentMethod::TRANSFER])
                ->map(fn($p) => $p->information['transferReference'] ?? $p->information['receiptReferenceCode'] ?? '')
                ->filter()
                ->unique()
                ->implode(', '),
            'referrer'       => $acceptance->referrer?->fullName ?? '',
        ];
    }

    private function extractTestNames(Collection $items): string
    {
        return $items->pluck('test.name')->filter()->unique()->implode(', ');
    }

    private function extractPatientNames(Collection $items, Acceptance $acceptance): string
    {
        return $items
            ->reduce(fn($carry, $item) => $carry->merge($item->patients), collect())
            ->merge([$acceptance->patient])
            ->unique('id')
            ->map(fn($p) => $p->fullName ?? '')
            ->implode(', ');
    }
}
