// Get unique sample types accepted across a barcode's items
export const getAvailableSampleTypes = (barcode) => {
    const sampleTypes = new Map();
    barcode.items.forEach((item) => {
        item.method.test.sample_types?.forEach((sampleType) => {
            sampleTypes.set(sampleType.id, sampleType);
        });
    });
    return Array.from(sampleTypes.values());
};

// Filter the available samples by the selected sample type
export const getFilteredSamples = (samples, selectedSampleType) => {
    if (!selectedSampleType) return samples;
    return samples.filter((sample) => sample.sample_type?.server_id === selectedSampleType);
};

// Reduce form barcodes to the minimal payload the API expects
export const buildCleanedBarcodes = (barcodes) =>
    barcodes.map((barcode) => ({
        patient: { id: barcode.patient?.id },
        sampleType: barcode.sampleType,
        sampleLocation: barcode.sampleLocation || 'In Lab',
        collection_date: barcode.collection_date,
        items: (barcode.selectedItems || barcode.items?.map((i) => i.id) || []).map((id) =>
            typeof id === 'object' ? { id: id.id } : { id },
        ),
        barcodeGroup: {
            id: barcode.barcodeGroup?.id,
            name: barcode.barcodeGroup?.name,
            abbr: barcode.barcodeGroup?.abbr,
        },
        barcode: barcode.barcode,
        material: barcode.sample?.material ? { id: barcode.sample.material.id } : null,
        received_at: barcode.received_at,
    }));
