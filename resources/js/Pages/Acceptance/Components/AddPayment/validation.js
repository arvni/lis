import { PAYMENT_METHOD_VALUES } from './constants';

/**
 * Validate the payment form.
 * @returns {Object} map of field → error message (empty when valid)
 */
export function validatePaymentForm(data, max) {
    const errors = {};

    // Validate price
    if (!(data.price > 0)) {
        errors.price = 'Amount must be greater than 0';
    } else if (data.price > max) {
        errors.price = `Amount exceeds the maximum allowed (${max.toFixed(2)} OMR)`;
    }

    // Validate payment method
    if (!PAYMENT_METHOD_VALUES.includes(data.paymentMethod)) {
        errors.paymentMethod = 'Please select a payment method';
    }

    // Validate payer
    if (!data.payer || !data.payer.id) {
        errors.payer = 'Please select a payer';
    }

    // Card payment validation
    if (data.paymentMethod === 'card' && !data.information?.receiptReferenceCode) {
        errors['information.receiptReferenceCode'] =
            'Receipt reference code is required for card payments';
    }

    // Transfer payment validation
    if (data.paymentMethod === 'transfer' && !data.information?.transferReference) {
        errors['information.transferReference'] =
            'Transaction reference is required for bank transfers';
    }

    return errors;
}
