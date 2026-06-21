// Pure validation summary for the sample-collection form.
export function computeValidation(barcodes, collectRequest, isReferredOutpatient) {
    const list = barcodes || [];
    const hasIncompleteDates = list.some((b) => !b.collection_date || !b.received_at);
    const hasInvalidDates = list.some(
        (b) =>
            b.collection_date &&
            b.received_at &&
            new Date(b.collection_date) > new Date(b.received_at),
    );
    const missingCollectRequest = isReferredOutpatient && !collectRequest;
    const missingRequiredBarcodes =
        isReferredOutpatient &&
        list.some((b) => b.sampleType?.required_barcode && !b.material?.barcode);
    return {
        isValid:
            !hasIncompleteDates &&
            !hasInvalidDates &&
            !missingCollectRequest &&
            !missingRequiredBarcodes,
        hasIncompleteDates,
        hasInvalidDates,
        missingCollectRequest,
        missingRequiredBarcodes,
        totalSamples: list.length,
        completedSamples: list.filter((b) => b.collection_date && b.received_at).length,
    };
}

export function getStatusColor(barcode) {
    if (!barcode.collection_date || !barcode.received_at) return 'error';
    if (new Date(barcode.collection_date) > new Date(barcode.received_at)) return 'warning';
    return 'success';
}
