export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const sumPrice = (items, field) =>
    items?.reduce((sum, item) => sum + parseFloat(item[field] || 0), 0) || 0;

// Subtotal / discount / payment / balance-due for a receipt.
export const computeTotals = (acceptance) => {
    const items = acceptance?.acceptanceItems;
    const subtotal = sumPrice(items?.panels, 'price') + sumPrice(items?.tests, 'price');
    const totalDiscount = sumPrice(items?.tests, 'discount') + sumPrice(items?.panels, 'discount');
    const totalPayment = sumPrice(acceptance?.invoice?.payments, 'price');

    return {
        subtotal,
        totalDiscount,
        totalPayment,
        finalTotal: subtotal - totalPayment - totalDiscount,
    };
};

// Longest turnaround time across tests and panel sub-items.
export const computeReportDays = (acceptance) =>
    Math.max(
        acceptance?.acceptanceItems?.tests?.reduce(
            (max, item) => Math.max(max, item?.method_test?.method?.turnaround_time || 0),
            0,
        ),
        (acceptance?.acceptanceItems?.panels || [])?.reduce((max, item) => {
            const turnaroundTime =
                item?.acceptanceItems?.reduce(
                    (pMax, acceptanceItem) =>
                        Math.max(pMax, acceptanceItem?.method_test?.method?.turnaround_time || 0),
                    0,
                ) || 0;
            return Math.max(max, turnaroundTime);
        }, 0),
    );
