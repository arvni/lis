import React, { useState, useEffect } from "react";
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Grid2 as Grid,
    IconButton,
    InputAdornment,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
    alpha,
    Slide
} from "@mui/material";
import {
    Save,
    Cancel,
    CheckBox,
    TextFields,
    Numbers,
    List as ListIcon,
    CalendarMonth,
    Help,
    Title,
    Close,
} from "@mui/icons-material";

/**
 * Slide transition for dialog
 */
const SlideTransition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

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
const AddRequirementForm = ({
                                data,
                                setData,
                                open,
                                onClose,
                                onSubmit,
                                disabled = false
                            }) => {
    // State for validation errors
    const [errors, setErrors] = useState({});

    // Get field type icon
    const getFieldTypeIcon = (type) => {
        switch (type) {
            case 'text':
                return <TextFields color="primary" />;
            case 'checkbox':
                return <CheckBox color="secondary" />;
            case 'number':
                return <Numbers color="warning" />;
            case 'select':
                return <ListIcon color="success" />;
            case 'date':
                return <CalendarMonth color="info" />;
            case 'description':
                return <Title color="error" />;
            default:
                return <TextFields color="primary" />;
        }
    };

    // Get field type description
    const getTypeDescription = (type) => {
        switch (type) {
            case 'text':
                return 'Single line text input field';
            case 'checkbox':
                return 'Yes/No field that can be checked';
            case 'number':
                return 'Numeric input field with validation';
            case 'select':
                return 'Dropdown with selectable options';
            case 'date':
                return 'Date picker field';
            case 'description':
                return 'Section title or label (not an input field)';
            default:
                return '';
        }
    };

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
            setErrors(prev => {
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
            setErrors(prev => {
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
                paper:{
                    elevation: 5,
                    sx: {borderRadius: 2}
                }
            }}
            slots={{transition: SlideTransition}}
        >
            {/* Dialog title */}
            <DialogTitle sx={{
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {data?.type && getFieldTypeIcon(data?.type)}
                    <Typography variant="h6">
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
                <Grid container spacing={3}>
                    {/* Field Label */}
                    <Grid size={{xs:12, md:6}}>
                        <TextField
                            fullWidth
                            name="label"
                            value={data?.label || ''}
                            onChange={handleChange}
                            label="Field Label"
                            placeholder="Enter field label"
                            required
                            error={!!errors?.label}
                            helperText={errors?.label || "The label that will be displayed for this field"}
                            multiline={data?.type === "description"}
                            rows={data?.type === "description" ? 3 : 1}
                            disabled={disabled}
                            autoFocus
                        />
                    </Grid>

                    {/* Field Type */}
                    <Grid size={{xs:12, md:6}}>
                        <TextField
                            fullWidth
                            select
                            name="type"
                            value={data?.type || ''}
                            onChange={handleChange}
                            label="Field Type"
                            required
                            error={!!errors?.type}
                            helperText={errors?.type || getTypeDescription(data?.type)}
                            disabled={disabled}
                            slotProps={{
                                input: {
                                    startAdornment: data?.type ? (
                                        <InputAdornment position="start">
                                            {getFieldTypeIcon(data?.type)}
                                        </InputAdornment>
                                    ) : undefined
                                }
                            }}
                        >
                            <MenuItem value="text">Text Field</MenuItem>
                            <MenuItem value="number">Number Field</MenuItem>
                            <MenuItem value="date">Date Field</MenuItem>
                            <MenuItem value="checkbox">Checkbox</MenuItem>
                            <MenuItem value="select">Dropdown</MenuItem>
                            <MenuItem value="description">Section Title</MenuItem>
                        </TextField>
                    </Grid>

                    {/* Required switch */}
                    <Grid size={{xs:12, md:6}}>
                        <FormControl component="fieldset">
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={!!data?.required}
                                        onChange={handleRequiredChange}
                                        disabled={disabled || data?.type === 'description'}
                                        color="primary"
                                    />
                                }
                                label="Required Field"
                                labelPlacement="end"
                            />
                            <FormHelperText>
                                {data?.type === 'description'
                                    ? 'Section titles cannot be required fields'
                                    : 'Toggle on to make this field mandatory'}
                            </FormHelperText>
                        </FormControl>
                    </Grid>

                    {/* Placeholder field */}
                    {(data?.type === 'text' || data?.type === 'number') && (
                        <Grid size={{xs:12, md:6}}>
                            <TextField
                                fullWidth
                                name="placeholder"
                                value={data.placeholder || ''}
                                onChange={handlePlaceholderChange}
                                label="Placeholder Text"
                                placeholder="Enter placeholder text"
                                helperText="Text that will be shown when the field is empty"
                                disabled={disabled}
                            />
                        </Grid>
                    )}

                    {/* Options for select type */}
                    {data?.type === 'select' && (
                        <Grid size={{xs:12}}>
                            <Autocomplete
                                multiple
                                value={data.options || []}
                                onChange={handleOptionChange}
                                options={[]}
                                freeSolo
                                selectOnFocus
                                clearOnBlur
                                handleHomeEndKeys
                                disabled={disabled}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            variant="outlined"
                                            label={option}
                                            size="medium"
                                            {...getTagProps({ index })}
                                        />
                                    ))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Dropdown Options"
                                        placeholder="Type and press Enter to add options"
                                        fullWidth
                                        error={!!errors.options}
                                        helperText={errors.options || "Add the options that will appear in the dropdown list"}
                                    />
                                )}
                            />

                            {!errors.options && data.options && data.options.length > 0 && (
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Tip: Users will be able to select from these options
                                    </Typography>
                                    <Tooltip title="Add at least 2-3 options for a good user experience">
                                        <Help fontSize="small" color="action" />
                                    </Tooltip>
                                </Box>
                            )}
                        </Grid>
                    )}

                    {/* Field preview */}
                    {data?.label && data?.type && (
                        <Grid size={{xs:12}}>
                            <Typography variant="subtitle2" gutterBottom>
                                Field Preview
                            </Typography>

                            <Box
                                sx={{
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    bgcolor: alpha('#f5f5f5', 0.5)
                                }}
                            >
                                {data?.type === 'description' ? (
                                    <Typography variant="subtitle1" fontWeight={500} color="primary">
                                        {data?.label || 'Section Title'}
                                    </Typography>
                                ) : (
                                    <Stack spacing={1}>
                                        <Typography variant="body2">
                                            {data?.label || 'Field Label'}
                                            {data?.required && (
                                                <Typography
                                                    component="span"
                                                    color="error.main"
                                                    sx={{ ml: 0.5 }}
                                                >
                                                    *
                                                </Typography>
                                            )}
                                        </Typography>

                                        {data?.type === 'text' && (
                                            <TextField
                                                size="small"
                                                disabled
                                                placeholder={data.placeholder || 'Text input'}
                                                fullWidth
                                            />
                                        )}

                                        {data?.type === 'number' && (
                                            <TextField
                                                type="number"
                                                size="small"
                                                disabled
                                                placeholder={data.placeholder || 'Number input'}
                                                fullWidth
                                            />
                                        )}

                                        {data?.type === 'date' && (
                                            <TextField
                                                type="date"
                                                size="small"
                                                disabled
                                                fullWidth
                                                InputLabelProps={{
                                                    shrink: true,
                                                }}
                                            />
                                        )}

                                        {data?.type === 'checkbox' && (
                                            <FormControlLabel
                                                control={<Switch disabled />}
                                                label="Yes/No"
                                            />
                                        )}

                                        {data?.type === 'select' && (
                                            <TextField
                                                select
                                                size="small"
                                                disabled
                                                fullWidth
                                                placeholder="Select an option"
                                                value=""
                                            >
                                                {(data.options || []).map((option, index) => (
                                                    <MenuItem key={index} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        )}
                                    </Stack>
                                )}
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </DialogContent>

            <Divider />

            {/* Dialog actions */}
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                    onClick={handleClose}
                    startIcon={<Cancel />}
                    disabled={disabled}
                >
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
