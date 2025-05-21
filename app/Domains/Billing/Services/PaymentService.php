<?php

namespace App\Domains\Billing\Services;

use App\Domains\Billing\DTOs\PaymentDTO;
use App\Domains\Billing\Events\PaymentsAddedEvent;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Payment;
use App\Domains\Billing\Repositories\PaymentRepository;
use App\Domains\Setting\Services\SettingService;

readonly class PaymentService
{
    public function __construct(
        private PaymentRepository $paymentRepository,
        private InvoiceService    $invoiceService,
        private SettingService    $settingService
    )
    {
    }

    /**
     * Stores a new payment and processes related invoice updates.
     */
    public function storePayment(PaymentDTO $paymentDTO): Payment
    {
        $payment = $this->paymentRepository->creatPayment($paymentDTO->toArray());
        $payment->loadMissing('invoice');

        if ($payment->invoice) {
            $this->processInvoiceMonetaryChange($payment->invoice);
        }

        return $payment;
    }

    /**
     * Updates an existing payment and processes related invoice updates.
     */
    public function updatePayment(Payment $payment, PaymentDTO $paymentDTO): Payment
    {
        $payment->loadMissing('invoice');
        $invoice = $payment->invoice;
        $updatedPayment = $this->paymentRepository->updatePayment($payment, $paymentDTO->toArray());

        if ($invoice) {
            $this->processInvoiceMonetaryChange($invoice);
        }

        return $updatedPayment;
    }

    /**
     * Finds a payment by its ID.
     */
    public function findPaymentById(int $id): ?Payment // Added type hint for $id
    {
        return $this->paymentRepository->findPaymentById($id);
    }

    /**
     * Deletes a payment and updates the status of its associated invoice.
     */
    public function deletePayment(Payment $payment): void
    {
        $payment->loadMissing('invoice');
        $invoice = $payment->invoice;

        $this->paymentRepository->deletePayment($payment);

        if ($invoice) {
            $this->invoiceService->updateStatus($invoice);
        }
    }

    /**
     * Handles invoice updates after a payment is created or modified.
     * This includes checking if the invoice is fully paid to dispatch events,
     * and then updating the overall invoice status.
     */
    private function processInvoiceMonetaryChange(Invoice $invoice): void
    {
        $invoice->loadMissing(['acceptanceItems', 'payments']);

        $payableAmount = $invoice->acceptanceItems->sum('price') - $invoice->acceptanceItems->sum('discount');
        $totalPaid = $invoice->payments->sum('price');
        $minAllowablePaymentPercentage = $this->settingService->getSettingByKey("Payment", "minPayment");

        if ($payableAmount > 0 && ($totalPaid * $minAllowablePaymentPercentage / 100) >= $payableAmount) {
            $invoice->acceptanceItems
                ->groupBy('acceptance_id')
                ->keys()
                ->each(function ($acceptance_id) {
                    if ($acceptance_id) {
                        PaymentsAddedEvent::dispatch($acceptance_id);
                    }
                });
        }

        $this->invoiceService->updateStatus($invoice);
    }
}
