import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Typography,
} from '@mui/material';
import { Save, Cancel, Close } from '@mui/icons-material';
import { SlideTransition, getFieldTypeIcon } from './AddRequirementForm/constants';
import FieldConfigInputs from './AddRequirementForm/FieldConfigInputs';

/**
 * AddRequirementForm component
 * Dialog for adding or editing form fields
 *
 * @param {Object} props Component props
 * @param {Object} props.data Field data
 * @param {Function} props.setData Update field data
 * @param {boolean} props.open Dialog open state
 * @param {Function} props.onClose Close dialog handler
 * @param {Function} props.onSubmit Submit form handler
 * @param {boolean} props.disabled Whether form is disabled
 * @returns {JSX.Element} Rendered component
 */
const AddRequirementForm = ({ data, setData, open, onClose, onSubmit, disabled = false }) => {
    // State for validation errors
    const [errors, setErrors] = useState({});

    /**
     * Handle form submission with validation
     */
    const handleSubmit = () => {
        if (validateForm()) {
            onSubmit();
        }
    };

    /**
     * Validate form fields
     *
     * @returns {boolean} True if form is valid
     */
    const validateForm = () => {
        clearErrors();
        let formValid = true;
        let newErrors = {};

        // Validate label
        if (!data?.label || data?.label.trim() === '') {
            newErrors.label = 'Field label is required';
            formValid = false;
        }

        // Validate field type
        if (!data?.type) {
            newErrors.type = 'Field type is required';
            formValid = false;
        }

        // Validate options for select type
        if (data?.type === 'select' && (!data.options || data.options.length === 0)) {
            newErrors.options = 'At least one option is required for dropdown fields';
            formValid = false;
        }

        setErrors(newErrors);
        return formValid;
    };

    /**
     * Clear all validation errors
     */
    const clearErrors = () => {
        setErrors({});
    };

    /**
     * Handle input change
     *
     * @param {Event} e Change event
     */
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Clear error when field changes
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // Update field value
        setData(name, value);

        // Reset options when type changes
        if (name === 'type' && value !== 'select') {
            setData('options', []);
        }
    };

    /**
     * Handle options change for select type
     *
     * @param {Event} _ Event object (unused)
     * @param {Array} value New options array
     */
    const handleOptionChange = (_, value) => {
        // Clear error when options change
        if (errors.options) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.options;
                return newErrors;
            });
        }

        setData('options', value);
    };

    /**
     * Handle required field toggle
     *
     * @param {Event} _ Event object (unused)
     * @param {boolean} value New required value
     */
    const handleRequiredChange = (_, value) => {
        setData('required', value);
    };

    /**
     * Handle placeholder change
     *
     * @param {Event} e Change event
     */
    const handlePlaceholderChange = (e) => {
        setData('placeholder', e.target.value);
    };

    /**
     * Close dialog and reset errors
     */
    const handleClose = () => {
        clearErrors();
        onClose();
    };

    // Effect to clear errors when dialog opens/closes
    useEffect(() => {
        if (open) {
            clearErrors();
        }
    }, [open]);

    return (
        <Dialog
            open={open}
            onClose={disabled ? undefined : handleClose}
            fullWidth
            maxWidth="md"
            slotProps={{
                paper: {
                    elevation: 5,
                    sx: { borderRadius: 2 },
                },
            }}
            slots={{ transition: SlideTransition }}
        >
            {/* Dialog title */}
            <DialogTitle
                sx={{
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {data?.type && getFieldTypeIcon(data?.type)}
                    <Typography variant="h6" component="span">
                        {data?.id && data?.label ? 'Edit Field' : 'Add New Field'}
                    </Typography>
                </Box>

                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleClose}
                    disabled={disabled}
                    aria-label="close"
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <Divider />

            {/* Dialog content */}
            <DialogContent sx={{ py: 3 }}>
                <FieldConfigInputs
                    data={data}
                    errors={errors}
                    disabled={disabled}
                    onChange={handleChange}
                    onRequiredChange={handleRequiredChange}
                    onPlaceholderChange={handlePlaceholderChange}
                    onOptionChange={handleOptionChange}
                />
            </DialogContent>

            <Divider />

            {/* Dialog actions */}
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={handleClose} startIcon={<Cancel />} disabled={disabled}>
                    Cancel
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    onClick={handleSubmit}
                    disabled={disabled}
                >
                    {data?.id && data?.label ? 'Update Field' : 'Add Field'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddRequirementForm;
