<?php

namespace App\Domains\Billing\Services;

use App\Domains\Billing\DTOs\PaymentDTO;
use App\Domains\Billing\Enums\PaymentMethod;
use App\Domains\Billing\Events\PaymentsAddedEvent;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Models\Payment;
use App\Domains\Billing\Adapters\SettingAdapter;
use App\Domains\Billing\Repositories\PaymentRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

readonly class PaymentService
{
    public function __construct(
        private PaymentRepository $paymentRepository,
        private InvoiceService    $invoiceService,
        private SettingAdapter    $settingAdapter
    )
    {
    }

    public function listPayments(array $queryData): LengthAwarePaginator
    {
        return $this->paymentRepository->listPayments($queryData);
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

        if ($this->payableAmount($invoice) > 0 && $this->hasReachedMinimumPayment($invoice)) {
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

    /**
     * Whether the payments on an invoice have cleared the minimum-payment
     * setting — the bar that releases its acceptances from WAITING_FOR_PAYMENT.
     * An invoice with nothing to pay has nothing to wait for.
     */
    public function hasReachedMinimumPayment(Invoice $invoice): bool
    {
        $invoice->loadMissing(['acceptanceItems', 'payments']);

        $payableAmount = $this->payableAmount($invoice);
        if ($payableAmount <= 0) {
            return true;
        }

        $totalPaid = $invoice->payments->sum('price');
        $minAllowablePaymentPercentage = $this->settingAdapter->getSettingByKey("Payment", "minPayment");

        return ($totalPaid * $minAllowablePaymentPercentage / 100) >= $payableAmount;
    }

    private function payableAmount(Invoice $invoice): float|int
    {
        return $invoice->acceptanceItems->sum('price') - $invoice->acceptanceItems->sum('discount');
    }

    public function updatePayments(Invoice $invoice, array $paymentsData): void
    {
        $invoice->loadMissing('payments');
        $existingPayments = $invoice->payments->keyBy('id');

        $ids = [];
        foreach ($paymentsData as $paymentData) {
            if (isset($paymentData['id']) && $paymentData['id']) {
                $payment = $existingPayments->get($paymentData['id']);
                $this->paymentRepository->updatePayment($payment,$paymentData);
            } else {
                $payment = $this->storePayment(new PaymentDTO(
                    $invoice->id,
                    auth()->id(),
                    $paymentData["payer_type"],
                    $paymentData["payer_id"],
                    $paymentData["price"],
                    PaymentMethod::find($paymentData["paymentMethod"]),
                    $paymentData["information"],
                ));
            }
            $ids[] = $payment->id;
        }
        $invoice->payments()->whereNotIn("id", $ids)->delete();
    }
}
