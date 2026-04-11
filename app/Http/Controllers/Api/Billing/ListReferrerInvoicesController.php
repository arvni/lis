<?php

namespace App\Http\Controllers\Api\Billing;

use App\Domains\Billing\Repositories\InvoiceRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ListReferrerInvoicesController extends Controller
{
    public function __construct(private readonly InvoiceRepository $invoiceRepository) {}

    public function __invoke(Request $request)
    {
        $referrerId = (int) $request->input('referrer_id');
        if (!$referrerId) {
            return response()->json(['data' => []]);
        }

        $month = $request->input('month') ?: null;
        $invoices = $this->invoiceRepository->listReferrerInvoicesForStatement($referrerId, $month);

        $data = $invoices->map(fn($inv) => [
            'id'             => $inv->id,
            'invoice_no'     => $inv->invoiceNo,   // same field as Invoice Index
            'created_at'     => $inv->created_at,
            'patient_name'   => $inv->acceptance?->patient?->fullName ?? '—',
            'payable_amount' => max(0, (float) $inv->acceptance_items_sum_price - (float) $inv->acceptance_items_sum_discount),
        ]);

        return response()->json(['data' => $data]);
    }
}
