import {useCallback, useState} from 'react';

export const useFormValidation = (data, maxDiscount) => {
    const [errors, setErrors] = useState({});

    const validatePanel = () => {
        let newErrors = {};
        if (!data.panel) {
            newErrors.panel = "Please Select A Panel";
        }
        if (data.panel.price * 1 < data.discount) {
            newErrors.discount = "Please Enter A lower discount";
        }
        for (let i = 0; i < data.acceptanceItems.length; i++) {
            if (data?.acceptanceItems[i]?.samples?.length<1||data?.acceptanceItems[i]?.samples?.length > data.acceptanceItems[i].method_test?.method?.no_sample)
                newErrors[`acceptanceItems.${i}.samples`] = "Please Enter Samples Data";
            for (let j = 0; j < data.acceptanceItems[i].samples.length; j++) {
                if (!data.acceptanceItems[i].samples[j]?.sampleType)
                    newErrors[`acceptanceItems.${i}.samples.${j}.sampleType`] = "Please Select A Sample Type";
                for (let k = 0; k < data.acceptanceItems[i].samples[j].patients.length; k++) {
                    if (!data.acceptanceItems[i].samples[j]?.patients[k].id)
                        newErrors[`acceptanceItems.${i}.samples.${j}.patients.${k}.id`] = "Please Select A Patient";
                }
            }
        }
        console.log(newErrors,data);
        setErrors(newErrors);
        return Object.keys(newErrors).length < 1;
    }

    // Comprehensive validation method
    const validateTest = useCallback(() => {
        const newErrors = {};

        // Test Type Validation
        if (!data.method_test?.test?.type) {
            newErrors.testType = 'Test type is required';
        }

        // Test Selection Validation
        if (!data.method_test?.test) {
            newErrors.test = 'Please select a specific test';
        }

        // Method Validation
        if (!data.method_test?.id) {
            newErrors.method = 'Please select a method for the test';
        }

        // Sample Type Validation
        if (!data.customParameters?.sampleType) {
            newErrors.sampleType = 'Sample type is required';
        }

        // Patient Validation
        if (!data.patients || data.patients.length === 0) {
            newErrors.patients = 'At least one patient is required';
        } else {
            data.patients.forEach((patient, index) => {
                if (!patient || !patient.id) {
                    newErrors[`patients.${index}`] = `Patient ${index + 1} is required`;
                }
            });
        }

        // Discount Validation
        const basePrice = data.method_test?.test?.method_tests?.[0]?.method?.price || 0;
        const maxAllowedDiscount = maxDiscount * basePrice * 0.01;

        if (data.discount !== undefined && data.discount !== null) {
            const discountValue = Number(data.discount);
            if (discountValue < 0) {
                newErrors.discount = 'Discount cannot be negative';
            } else if (discountValue > maxAllowedDiscount) {
                newErrors.discount = `Discount cannot exceed ${maxAllowedDiscount.toFixed(2)}`;
            }
        }

        // Price Validation
        if (!data.price || Number(data.price) <= 0) {
            newErrors.price = 'Price must be greater than 0';
        }

        // Specific Price Type Handling
        const priceType = data.method_test?.method?.price_type;
        if (priceType === 'Formulate' || priceType === 'Conditional') {
            if (!data.customParameters || Object.keys(data.customParameters).length === 0) {
                newErrors.customParameters = 'Additional pricing details are required';
            }
        }

        // Details Validation (optional, but can be made required if needed)
        if (data.details && data.details.trim().length > 500) {
            newErrors.details = 'Details cannot exceed 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [data, maxDiscount]);



    return {errors, validateTest, validatePanel, setErrors};
};
