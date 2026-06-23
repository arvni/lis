<?php

namespace App\Domains\Billing\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use Illuminate\Database\Eloquent\Builder;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Str;

class PaymentRepository
{
    use LogsUserActivity;


    public function listPayments(array $queryData): LengthAwarePaginator
    {
        $query = Payment::with(["cashier", "payer"]);
        $query = $this->applyFilters($query, $queryData["filters"] ?? []);
        $query = $this->applyOrderBy($query, $queryData["sort"]);
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatPayment(array $paymentData): Payment
    {
        $payment= Payment::query()->create($paymentData);
        $this->logCreated($payment);
        return $payment;
    }

    public function updatePayment(Payment $payment, array $paymentData): Payment
    {
        $payment->fill($paymentData);
        if ($payment->isDirty()) {
            $payment->save();
            $this->logUpdated($payment);
        }
        return $payment;
    }

    public function deletePayment(Payment $payment): void
    {
        $payment->delete();
        $this->logDeleted($payment);
    }

    public function findPaymentById(int|string $id): ?Payment
    {
        return Payment::find($id);
    }

    public function getTotalPaymentsForDateRange(array $dateRange): float
    {
        return Payment::whereBetween("created_at", $dateRange)->sum("price");
    }

    public function getTotalCashPaymentsForDateRange(array $dateRange): float
    {
        return $this->getTotalPaymentsForDateRangeOnPaymentMethod(PaymentMethod::CASH, $dateRange);
    }

    public function getTotalCardPaymentsForDateRange(array $dateRange): float
    {
        return $this->getTotalPaymentsForDateRangeOnPaymentMethod(PaymentMethod::CARD, $dateRange);
    }

    public function getTotalCreditPaymentsForDateRange(array $dateRange): float
    {
        return $this->getTotalPaymentsForDateRangeOnPaymentMethod(PaymentMethod::CREDIT, $dateRange);
    }

    public function getTotalTransferPaymentsForDateRange(array $dateRange): float
    {
        return $this->getTotalPaymentsForDateRangeOnPaymentMethod(PaymentMethod::TRANSFER, $dateRange);
    }

    protected function getTotalPaymentsForDateRangeOnPaymentMethod(PaymentMethod $paymentMethod, array $dateRange): float
    {
        return Payment::where("paymentMethod", $paymentMethod)
            ->whereBetween("created_at", $dateRange)
            ->sum("price");
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Billing\Models\Payment>  $query
     * @return \Illuminate\Database\Eloquent\Builder<\App\Domains\Billing\Models\Payment>
     */
    private function applyFilters(Builder $query, array $filters): Builder
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

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Billing\Models\Payment>  $query
     * @return \Illuminate\Database\Eloquent\Builder<\App\Domains\Billing\Models\Payment>
     */
    private function applyOrderBy(Builder $query, array $orderBy): Builder
    {
        $query->orderBy($orderBy["field"], $orderBy["sort"]);
        return $query;
    }


}
