<?php

namespace App\Domains\Billing\Repositories;

use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Models\Payment;
use Carbon\Carbon;

class PaymentRepository
{

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
        return Payment::where("paymentMethod", PaymentMethod::CASH)
            ->whereBetween("created_at", $dateRange)
            ->sum("price");
    }

    public function getTotalCardPaymentsForDateRange($dateRange): float
    {
        return Payment::where("paymentMethod", PaymentMethod::CARD)
            ->whereBetween("created_at", $dateRange)
            ->sum("price");
    }

}
