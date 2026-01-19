<?php

namespace App\Domains\Billing\Repositories;

use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Payment;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;
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
        $payment= Payment::query()->create($paymentData);
        UserActivityService::createUserActivity($payment,ActivityType::CREATE);
        return $payment;
    }

    public function updatePayment(Payment $payment, array $paymentData): Payment
    {
        $payment->fill($paymentData);
        if ($payment->isDirty()) {
            $payment->save();
            UserActivityService::createUserActivity($payment,ActivityType::UPDATE);
        }
        return $payment;
    }

    public function deletePayment(Payment $payment): void
    {
        $payment->delete();
        UserActivityService::createUserActivity($payment,ActivityType::DELETE);
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

        // Single date filter
        if(isset($filters["date"])){
            $date=Carbon::parse($filters["date"],"Asia/Muscat");
            $dateRange=[$date->startOfDay(),$date->copy()->endOfDay()];
            $query->whereBetween("created_at",$dateRange);
        }

        // Date range filter
        if (isset($filters["dateFrom"]) && isset($filters["dateTo"])) {
            $dateFrom = Carbon::parse($filters["dateFrom"],"Asia/Muscat")->startOfDay();
            $dateTo = Carbon::parse($filters["dateTo"],"Asia/Muscat")->endOfDay();
            $query->whereBetween("created_at", [$dateFrom, $dateTo]);
        } elseif (isset($filters["dateFrom"])) {
            $dateFrom = Carbon::parse($filters["dateFrom"],"Asia/Muscat")->startOfDay();
            $query->where("created_at", ">=", $dateFrom);
        } elseif (isset($filters["dateTo"])) {
            $dateTo = Carbon::parse($filters["dateTo"],"Asia/Muscat")->endOfDay();
            $query->where("created_at", "<=", $dateTo);
        }

        // Amount range filter
        if (isset($filters["amountFrom"]) && isset($filters["amountTo"])) {
            $query->whereBetween("price", [(float)$filters["amountFrom"], (float)$filters["amountTo"]]);
        } elseif (isset($filters["amountFrom"])) {
            $query->where("price", ">=", (float)$filters["amountFrom"]);
        } elseif (isset($filters["amountTo"])) {
            $query->where("price", "<=", (float)$filters["amountTo"]);
        }

        return $query;
    }

    private function applyOrderBy($query, array $orderBy)
    {
        $query->orderBy($orderBy["field"], $orderBy["sort"]);
        return $query;
    }


}
