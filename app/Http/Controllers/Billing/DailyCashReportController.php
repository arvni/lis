<?php

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Exports\DailyCashReportExport;
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
        $acceptances = Acceptance::where("created_at", ">=", $date->copy()->startOfDay())
            ->where("created_at", "<=", $date->endOfDay())
            ->with("acceptanceItems.test", "acceptanceItems.patients", "patient", "payments", "referrer")
            ->get();
        $data = [];
        foreach ($acceptances as $acceptance) {

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
