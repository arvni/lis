// ─── Validation ────────────────────────────────────────────────────────────────
export const validateTest = (data, maxDiscount) => {
    const errs = {};
    if (!data.method_test?.test?.id) errs.test = 'Please select a test';
    if (!data.method_test?.id) errs.method = 'Please select a method';
    if (!data.price || Number(data.price) <= 0) errs.price = 'Price must be greater than 0';
    const isService = data.method_test?.test?.type === 'SERVICE';
    if (!isService && !data.sampleless) {
        if (!data.samples?.length) {
            errs.samples = 'At least one sample is required';
        } else {
            data.samples.forEach((s, si) => {
                if (!s.sampleType) errs[`s${si}.sampleType`] = 'Select a sample type';
                (s.patients || []).forEach((p, pi) => {
                    if (!p?.id) errs[`s${si}.p${pi}`] = 'Select a patient';
                });
            });
        }
    }
    if (maxDiscount && data.price > 0 && data.discount > maxDiscount * data.price * 0.01)
        errs.discount = `Discount cannot exceed ${maxDiscount}%`;
    return errs;
};

export const validatePanel = (data, maxDiscount) => {
    const errs = {};
    if (!data.panel?.id) {
        errs.panel = 'Please select a panel';
        return errs;
    }
    if (maxDiscount && data.price > 0 && data.discount > (maxDiscount * data.price) / 100)
        errs.discount = 'Discount exceeds the maximum allowed';
    if (!data.sampleless) {
        (data.acceptanceItems || []).forEach((item, i) => {
            if (!item.sampleless && !item.samples?.length)
                errs[`item${i}.samples`] = 'At least one sample required';
            (item.samples || []).forEach((s, si) => {
                if (!s.sampleType) errs[`item${i}.s${si}.sampleType`] = 'Select a sample type';
                (s.patients || []).forEach((p, pi) => {
                    if (!p?.id) errs[`item${i}.s${si}.p${pi}`] = 'Select a patient';
                });
            });
        });
    }
    return errs;
};
