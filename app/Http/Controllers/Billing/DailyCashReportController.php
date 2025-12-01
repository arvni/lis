<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Exports\DailyCashReportExport;
use App\Domains\Billing\Models\Payment;
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

        // Get acceptances created on the specified date
        $acceptances = Acceptance::where("created_at", ">=", $date->copy()->startOfDay())
            ->where("created_at", "<=", $date->endOfDay())
            ->with("acceptanceItems.test", "acceptanceItems.patients", "patient", "payments", "referrer")
            ->get();

        $data = [];
        $processedAcceptanceIds = [];

        // Process acceptances created on the specified date
        foreach ($acceptances as $acceptance) {
            $processedAcceptanceIds[] = $acceptance->id;

            $totalPaid = $acceptance->payments->where("paymentMethod", '!=', PaymentMethod::CREDIT)->sum('price');
            $total = $acceptance->acceptanceItems->map(fn($item) => $item->price)->sum();
            $totalDiscount = $acceptance->acceptanceItems->map(fn($item) => $item->discount)->sum();
            $data[] = [
                "test_name" => $this->extractTests($acceptance->acceptanceItems),
                "patient_name" => $this->extractPatients($acceptance),
                "test_price" => $total,
                "payment_method" => $acceptance->payments->map(fn($item) => $item->paymentMethod->name)->join(", "),
                "discount" => $totalDiscount,
                "prepayment" => $totalPaid,
                "remaining" => $total - $totalPaid - $totalDiscount,
                "receipt_no" => $acceptance->payments
                    ->whereIn("paymentMethod", [PaymentMethod::CARD, PaymentMethod::TRANSFER])
                    ->map(fn($item) => $item->information["transferReference"] ?? $item->information["receiptReferenceCode"] ?? "")
                    ->filter()
                    ->unique()
                    ->implode(", "),
                "referrer" => $acceptance?->referrer?->fullName ?? "",
            ];
        }

        // Get payments made on the specified date for acceptances from other dates
        $todaysPayments = Payment::where("created_at", ">=", $date->copy()->startOfDay())
            ->where("created_at", "<=", $date->endOfDay())
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

            // Get all payments for this acceptance
            $allPayments = $acceptance->payments;
            $totalPaid = $allPayments->where("paymentMethod", '!=', PaymentMethod::CREDIT)->sum('price');
            $total = $acceptance->acceptanceItems->map(fn($item) => $item->price)->sum();
            $totalDiscount = $acceptance->acceptanceItems->map(fn($item) => $item->discount)->sum();

            $data[] = [
                "test_name" => $this->extractTests($acceptance->acceptanceItems),
                "patient_name" => $this->extractPatients($acceptance),
                "test_price" => $total,
                "payment_method" => $allPayments->map(fn($item) => $item->paymentMethod->name)->join(", "),
                "discount" => $totalDiscount,
                "prepayment" => $totalPaid,
                "remaining" => $total - $totalPaid - $totalDiscount,
                "receipt_no" => $allPayments
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

    private function extractPatients(Acceptance $acceptance)
    {
        return $acceptance->acceptanceItems->reduce(fn($a, $b) => $a->merge($b->patients), collect([]))->merge([$acceptance->patient])->unique("id")->map(fn($item) => $item->fullName ?? "")->implode(", ");
    }
}
