<?php

namespace App\Domains\Billing\Repositories;

use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Str;

class PaymentRepository
{

    public function listPayments($queryData)
    {
        $query = Payment::with(["cashier", "payer"]);
        $query = $this->applyFilters($query, $queryData["filters"] ?? []);
        $query = $this->applyOrderBy($query, $queryData["sort"]);
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatPayment(array $paymentData): Payment
    {
        return Payment::query()->create($paymentData);
    }

    public function updatePayment(Payment $payment, array $paymentData): Payment
    {
        $payment->fill($paymentData);
        if ($payment->isDirty())
            $payment->save();
        return $payment;
    }

    public function deletePayment(Payment $payment): void
    {
        $payment->delete();
    }

    public function findPaymentById($id): ?Payment
    {
        return Payment::find($id);
    }

    public function getTotalPaymentsForDateRange($dateRange): float
    {
        return Payment::whereBetween("created_at", $dateRange)->sum("price");
    }

    public function getTotalCashPaymentsForDateRange($dateRange): float
    {
        return $this->getTotalPaymentsForDateRangeOnPaymentMethod(PaymentMethod::CASH, $dateRange);
    }

    public function getTotalCardPaymentsForDateRange($dateRange): float
    {
        return $this->getTotalPaymentsForDateRangeOnPaymentMethod(PaymentMethod::CARD, $dateRange);
    }

    public function getTotalCreditPaymentsForDateRange($dateRange): float
    {
        return $this->getTotalPaymentsForDateRangeOnPaymentMethod(PaymentMethod::CREDIT, $dateRange);
    }

    public function getTotalTransferPaymentsForDateRange($dateRange): float
    {
        return $this->getTotalPaymentsForDateRangeOnPaymentMethod(PaymentMethod::TRANSFER, $dateRange);
    }

    protected function getTotalPaymentsForDateRangeOnPaymentMethod(PaymentMethod $paymentMethod, array $dateRange): float
    {
        return Payment::where("paymentMethod", $paymentMethod)
            ->whereBetween("created_at", $dateRange)
            ->sum("price");
    }

    private function applyFilters($query, array $filters)
    {
        if (isset($filters["payer_type"])) {
            $query->where("payer_type", strtolower($filters["payer_type"]));
        }
        if (isset($filters["payer_id"])) {
            $query->where(Str::lower($filters["payer_type"]) . "s.id", $filters["payer_id"]);
        }

        if (isset($filters["paymentMethod"])) {
            $query->where("paymentMethod", $filters["paymentMethod"]);
        }

        if (isset($filters["search"]))
            $query->search($filters["search"] ?? "");

        if(isset($filters["date"])){
            $date=Carbon::parse($filters["date"]);
            $dateRange=[$date->startOfDay(),$date->copy()->endOfDay()];
            $query->whereBetween("created_at",$dateRange);
        }
        return $query;
    }

    private function applyOrderBy($query, array $orderBy)
    {
        $query->orderBy($orderBy["field"], $orderBy["sort"]);
        return $query;
    }


}
