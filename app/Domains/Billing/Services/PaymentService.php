<?php

namespace App\Domains\Billing\Services;


use App\Domains\Billing\DTOs\PaymentDTO;
use App\Domains\Billing\Events\PaymentsAddedEvent;
use App\Domains\Billing\Models\Payment;
use App\Domains\Billing\Repositories\PaymentRepository;

readonly class PaymentService
{
    public function __construct(
        private PaymentRepository $paymentRepository,
        private InvoiceService    $invoiceService,
    )
    {
    }

    public function storePayment(PaymentDTO $paymentDTO): Payment
    {
        $payment = $this->paymentRepository->creatPayment($paymentDTO->toArray());
        $payment->load("invoice");
        if ($payment->invoice->acceptanceItems->sum("price") - $payment->invoice->acceptanceItems->sum("discount") <= $payment->invoice->payments->sum("price")) {
            $payment->invoice
                ->acceptanceItems
                ->groupBy("acceptance_id")
                ->each(function ($acceptanceItems, $acceptance_id) use ($payment) {
                    PaymentsAddedEvent::dispatch($acceptance_id);
                });
        }
        $this->invoiceService->updateStatus($payment->invoice);
        return $payment;

    }

    public function updatePayment(Payment $payment, PaymentDTO $paymentDTO): Payment
    {
        $updatedPayment = $this->paymentRepository->updatePayment($payment, $paymentDTO->toArray());
        $payment->load("invoice");
        $this->invoiceService->updateStatus($payment->invoice);
        return $updatedPayment;
    }

    public function findPaymentById($id): ?Payment
    {
        return $this->paymentRepository->findPaymentById($id);
    }

    public function deletePayment(Payment $payment): void
    {
        $payment->load("invoice");
        $invoice = $payment->invoice;
        $this->paymentRepository->deletePayment($payment);
        $this->invoiceService->updateStatus($invoice);
    }

}
