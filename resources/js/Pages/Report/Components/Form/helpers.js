// Determine active step based on available documents
export const getActiveStep = (data) => {
    if (data.published_document) return 2;
    if (data.approveded_document) return 1;
    return 0;
};

// Compute validation errors for the active template parameters (pure)
export const computeParameterErrors = (data) => {
    if (!data.report_template?.parameters?.length) return { errors: {}, isValid: true };

    const errors = {};
    let isValid = true;

    const activeParameters = data.report_template.parameters.filter((param) => param.active);

    activeParameters.forEach((param) => {
        const { title, required, type } = param;
        const fieldId = `${title.toLowerCase().replace(/\s+/g, '_')}_${param?.id}`;
        const value = data.parameters?.[fieldId];

        if (required) {
            if (value === undefined || value === null || value === '') {
                errors[fieldId] = 'This field is required';
                isValid = false;
            } else if (type === 'checkbox' && Array.isArray(value) && value.length === 0) {
                errors[fieldId] = 'Please select at least one option';
                isValid = false;
            }
        }
    });

    return { errors, isValid };
};
