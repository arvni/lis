<?php

namespace App\Domains\Billing\Repositories;

use App\Domains\Billing\Models\Payment;

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

}
