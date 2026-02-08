<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Exports\DailyCashReportExport;
use App\Domains\Billing\Models\Payment;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Facades\Excel;

class DailyCashReportController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $date = Carbon::parse($request->get("date"));
        $dateRange = [$date->copy()->startOfDay(), $date->copy()->endOfDay()];

        $data = [];
        $processedAcceptanceIds = [];

        // Get acceptance items created on the specified date, excluding SERVICE type tests
        $acceptanceItems = AcceptanceItem::whereBetween("created_at", $dateRange)
            ->whereHas("test", function ($q) {
                $q->whereNot("type", TestType::SERVICE);
            })
            ->with("test", "patients", "acceptance.patient", "acceptance.payments", "acceptance.referrer")
            ->get();

        // Group by acceptance_id
        $itemsByAcceptance = $acceptanceItems->groupBy('acceptance_id');

        // Process acceptance items created on the specified date
        foreach ($itemsByAcceptance as $acceptanceId => $items) {
            $acceptance = $items->first()->acceptance;
            if (!$acceptance) {
                continue;
            }

            $processedAcceptanceIds[] = $acceptanceId;

            // Only count payments excluding credit
            $paymentsExcludingCredit = $acceptance->payments->where("paymentMethod", '!=', PaymentMethod::CREDIT);
            $totalPaid = $paymentsExcludingCredit->sum('price');

            // Calculate totals only for items created on this date
            $total = $items->sum('price');
            $totalDiscount = $items->sum('discount');

            $data[] = [
                "test_name" => $this->extractTestsFromItems($items),
                "patient_name" => $this->extractPatientsFromItems($items, $acceptance),
                "test_price" => $total,
                "payment_method" => $paymentsExcludingCredit->map(fn($item) => $item->paymentMethod->name)->unique()->join(", "),
                "discount" => $totalDiscount,
                "prepayment" => $totalPaid,
                "remaining" => $total - $totalPaid - $totalDiscount,
                "receipt_no" => $paymentsExcludingCredit
                    ->whereIn("paymentMethod", [PaymentMethod::CARD, PaymentMethod::TRANSFER])
                    ->map(fn($item) => $item->information["transferReference"] ?? $item->information["receiptReferenceCode"] ?? "")
                    ->filter()
                    ->unique()
                    ->implode(", "),
                "referrer" => $acceptance?->referrer?->fullName ?? "",
            ];
        }

        // Get payments made on the specified date for acceptances not already processed
        $todaysPayments = Payment::whereBetween("created_at", $dateRange)
            ->where("paymentMethod", '!=', PaymentMethod::CREDIT)
            ->with(
                "invoice.acceptance.acceptanceItems.test",
                "invoice.acceptance.acceptanceItems.patients",
                "invoice.acceptance.patient",
                "invoice.acceptance.referrer",
                "invoice.acceptance.payments",
            )
            ->get();

        // Process payments for acceptances not yet included
        foreach ($todaysPayments as $payment) {
            $acceptance = $payment->invoice?->acceptance;

            if (!$acceptance || in_array($acceptance->id, $processedAcceptanceIds)) {
                continue;
            }

            $processedAcceptanceIds[] = $acceptance->id;

            // Get all payments excluding credit
            $paymentsExcludingCredit = $acceptance->payments->where("paymentMethod", '!=', PaymentMethod::CREDIT);
            $totalPaid = $paymentsExcludingCredit->sum('price');
            $total = $acceptance->acceptanceItems->sum('price');
            $totalDiscount = $acceptance->acceptanceItems->sum('discount');

            $data[] = [
                "test_name" => $this->extractTests($acceptance->acceptanceItems),
                "patient_name" => $this->extractPatients($acceptance),
                "test_price" => $total,
                "payment_method" => $paymentsExcludingCredit->map(fn($item) => $item->paymentMethod->name)->unique()->join(", "),
                "discount" => $totalDiscount,
                "prepayment" => $totalPaid,
                "remaining" => $total - $totalPaid - $totalDiscount,
                "receipt_no" => $paymentsExcludingCredit
                    ->whereIn("paymentMethod", [PaymentMethod::CARD, PaymentMethod::TRANSFER])
                    ->map(fn($item) => $item->information["transferReference"] ?? $item->information["receiptReferenceCode"] ?? "")
                    ->filter()
                    ->unique()
                    ->implode(", "),
                "referrer" => $acceptance?->referrer?->fullName ?? "",
            ];
        }

        $fileName = 'Daily_report_' . Carbon::parse($date)->format('Ymd') . '.xlsx';

        return Excel::download(new DailyCashReportExport(collect($data), $date), $fileName);

    }


    private function extractTests(Collection $acceptanceItems): string
    {
        return $acceptanceItems
            ->pluck("test.name")
            ->filter()
            ->unique()
            ->implode(', ');
    }

    private function extractTestsFromItems(Collection $items): string
    {
        return $items
            ->pluck("test.name")
            ->filter()
            ->unique()
            ->implode(', ');
    }

    private function extractPatients(Acceptance $acceptance)
    {
        return $acceptance->acceptanceItems->reduce(fn($a, $b) => $a->merge($b->patients), collect([]))->merge([$acceptance->patient])->unique("id")->map(fn($item) => $item->fullName ?? "")->implode(", ");
    }

    private function extractPatientsFromItems(Collection $items, Acceptance $acceptance)
    {
        return $items->reduce(fn($a, $b) => $a->merge($b->patients), collect([]))->merge([$acceptance->patient])->unique("id")->map(fn($item) => $item->fullName ?? "")->implode(", ");
    }
}
