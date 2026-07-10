// Pure state-shapers for the panel-configure step. Each takes the current
// acceptanceItems (and inputs) and returns the updates object passed to
// onChange — no mutation.

/** Toggling sampleless: on = single default sample per item + reportless. */
export function applySampleless(acceptanceItems, checked, patient) {
    const updates = { sampleless: checked };
    if (checked && patient) {
        updates.acceptanceItems = acceptanceItems.map((item) => ({
            ...item,
            sampleless: true,
            samples: [{ patients: [{ id: patient.id, name: patient.fullName }], sampleType: '' }],
        }));
        updates.reportless = true;
    } else if (!checked) {
        updates.acceptanceItems = acceptanceItems.map((item) => ({
            ...item,
            sampleless: false,
        }));
    }
    return updates;
}

export function applyReportless(acceptanceItems, checked) {
    return {
        reportless: checked,
        acceptanceItems: acceptanceItems.map((item) => ({ ...item, reportless: checked })),
    };
}

/** Updates one sample's sampleType or one of its patients on one item. */
export function updateItemSample(acceptanceItems, itemId, sampleIndex, field, value, patientIndex) {
    return {
        acceptanceItems: acceptanceItems.map((item) => {
            if (item.id !== itemId) return item;
            const newSamples = (item.samples || []).map((s, idx) => {
                if (idx !== sampleIndex) return s;
                if (field === 'sampleType') return { ...s, sampleType: value };
                if (field === 'patient') {
                    const pts = [...(s.patients || [])];
                    pts[patientIndex] = value;
                    return { ...s, patients: pts };
                }
                return s;
            });
            return { ...item, samples: newSamples };
        }),
    };
}

/** Adds a sample (up to the method's no_sample cap) seeded with the patient. */
export function addSampleToItem(acceptanceItems, itemId, patient) {
    return {
        acceptanceItems: acceptanceItems.map((item) => {
            if (item.id !== itemId) return item;
            const maxS = item.method_test?.method?.no_sample || 1;
            const curr = item.samples || [];
            if (curr.length >= maxS) return item;
            const pCount = item.method_test?.method?.no_patient || 1;
            const def = patient ? { id: patient.id, name: patient.fullName } : null;
            return {
                ...item,
                samples: [
                    ...curr,
                    { patients: Array(pCount).fill(def).filter(Boolean), sampleType: '' },
                ],
                no_sample: curr.length + 1,
            };
        }),
    };
}

/** Removes a sample from an item (always keeps at least one). */
export function removeSampleFromItem(acceptanceItems, itemId, sampleIndex) {
    return {
        acceptanceItems: acceptanceItems.map((item) => {
            if (item.id !== itemId) return item;
            const curr = item.samples || [];
            if (curr.length <= 1) return item;
            return {
                ...item,
                samples: curr.filter((_, i) => i !== sampleIndex),
                no_sample: curr.length - 1,
            };
        }),
    };
}

/** Spreads a panel-level price evenly across the items. */
export function spreadPanelPrice(acceptanceItems, priceData) {
    const priceEach = (priceData.price || 0) / (acceptanceItems.length || 1);
    return {
        ...priceData,
        acceptanceItems: acceptanceItems.map((item) => ({
            ...item,
            price: priceEach,
            customParameters: {
                ...item.customParameters,
                ...(priceData.customParameters || {}),
            },
        })),
    };
}

/** Spreads a panel-level discount evenly across the items. */
export function spreadPanelDiscount(acceptanceItems, discountData) {
    const discountEach = (discountData.discount || 0) / (acceptanceItems.length || 1);
    return {
        ...discountData,
        discount: discountData.discount || 0,
        acceptanceItems: acceptanceItems.map((item) => ({
            ...item,
            discount: discountEach,
            customParameters: {
                ...item.customParameters,
                ...(discountData.customParameters || {}),
            },
        })),
    };
}

export function computePanelTotals(acceptanceItems) {
    return {
        totalPrice: acceptanceItems.reduce((s, i) => s + (Number(i.price) || 0), 0),
        totalDiscount: acceptanceItems.reduce((s, i) => s + (Number(i.discount) || 0), 0),
    };
}
