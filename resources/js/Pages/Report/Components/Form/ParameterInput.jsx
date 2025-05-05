import React, {memo} from "react";
import {
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Typography,
    Box,
    Button
} from "@mui/material";
import {CloudUpload as CloudUploadIcon} from "@mui/icons-material";

/**
 * Component to render a parameter input based on its type
 *
 * @param {Object} parameter - The parameter object containing type, title, etc.
 * @param {any} value - The current value of the parameter
 * @param {Function} onChange - Function to handle value changes
 * @param {Object} errors - Validation errors object
 */
const ParameterInput = memo(({parameter, value, onChange, errors = {}}) => {
        const {title, type, required, custom_props} = parameter;
        const options = custom_props ? custom_props.split(',').map(opt => opt.trim()) : [];
        const fieldId = `${title.toLowerCase().replace(/\s+/g, '_')}_${parameter.id}`;
        const error = errors[fieldId];

        switch (type) {
            case 'text':
                return (
                    <TextField
                        id={fieldId}
                        label={title}
                        value={value || ''}
                        onChange={(e) => onChange(fieldId, e.target.value)}
                        fullWidth
                        required={required}
                        error={!!error}
                        helperText={error || ''}
                        variant="outlined"
                        size="medium"
                        margin="normal"
                    />
                );

            case 'number':
                return (
                    <TextField
                        id={fieldId}
                        label={title}
                        type="number"
                        value={value || ''}
                        onChange={(e) => onChange(fieldId, e.target.value)}
                        fullWidth
                        required={required}
                        error={!!error}
                        helperText={error || ''}
                        slotProps={{htmlInput: {step: 'any'}}}
                        variant="outlined"
                        size="medium"
                        margin="normal"
                    />
                );

            case 'date':
                return (
                    <TextField
                        id={fieldId}
                        label={title}
                        type="date"
                        value={value || ''}
                        onChange={(e) => onChange(fieldId, e.target.value)}
                        fullWidth
                        required={required}
                        error={!!error}
                        helperText={error || ''}
                        variant="outlined"
                        size="medium"
                        margin="normal"
                        slotProps={{
                            inputLabel: {
                                shrink: true,
                            }
                        }}
                    />
                );

            case 'select':
                return (
                    <FormControl
                        fullWidth
                        required={required}
                        error={!!error}
                        variant="outlined"
                        size="medium"
                        margin="normal"
                    >
                        <InputLabel id={`${fieldId}-label`}>{title}</InputLabel>
                        <Select
                            labelId={`${fieldId}-label`}
                            id={fieldId}
                            value={value || ''}
                            label={title}
                            onChange={(e) => onChange(fieldId, e.target.value)}
                        >
                            <MenuItem value="">
                                <em>None</em>
                            </MenuItem>
                            {options.map((option, index) => (
                                <MenuItem key={index} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </Select>
                        {error && (
                            <Typography variant="caption" color="error">
                                {error}
                            </Typography>
                        )}
                    </FormControl>
                );

            case 'checkbox':
                if (options.length > 0) {
                    // Multiple checkboxes for options
                    return (
                        <FormControl
                            component="fieldset"
                            required={required}
                            error={!!error}
                            margin="normal"
                            fullWidth
                        >
                            <Typography variant="body2" component="legend" gutterBottom>
                                {title}{required && <span style={{color: 'red'}}> *</span>}
                            </Typography>
                            <FormGroup>
                                {options.map((option, index) => {
                                    // Handle array of selected values
                                    const values = !Array.isArray(value) ? (value?.split(",").map(item => item.trim())||[]) : value;
                                    const isChecked = values.includes(option);

                                    return (
                                        <FormControlLabel
                                            key={index}
                                            control={
                                                <Checkbox
                                                    checked={isChecked}
                                                    onChange={(e) => {
                                                        let newValues;
                                                        if (e.target.checked) {
                                                            newValues = [...values, option]
                                                        } else {
                                                            newValues = values.filter(val => val !== option);
                                                        }
                                                        onChange(fieldId, newValues.join(","));
                                                    }}
                                                />
                                            }
                                            label={option}
                                        />
                                    );
                                })}
                            </FormGroup>
                            {error && (
                                <Typography variant="caption" color="error">
                                    {error}
                                </Typography>
                            )}
                        </FormControl>
                    );
                } else {
                    // Single checkbox (Yes/No)
                    return (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    id={fieldId}
                                    checked={!!value}
                                    onChange={(e) => onChange(fieldId, e.target.checked)}
                                />
                            }
                            label={title}
                            required={required}
                            sx={{my: 2}}
                        />
                    );
                }

            case 'image':
                return (
                    <Box sx={{my: 2}}>
                        <Typography variant="body2" gutterBottom>
                            {title}{required && <span style={{color: 'red'}}> *</span>}
                        </Typography>
                        <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUploadIcon/>}
                            sx={{mb: 1}}
                        >
                            Upload Image
                            <input
                                id={fieldId}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        onChange(fieldId, file);
                                    }
                                }}
                                required={required}
                            />
                        </Button>

                        {value && (
                            <Box sx={{mt: 2}}>
                                <img
                                    src={typeof value === 'string' ? value : URL.createObjectURL(value)}
                                    alt={title}
                                    style={{maxWidth: '100%', maxHeight: '200px'}}
                                />
                            </Box>
                        )}

                        {error && (
                            <Typography variant="caption" color="error">
                                {error}
                            </Typography>
                        )}
                    </Box>
                );

            default:
                return (
                    <Typography color="error">
                        Unknown parameter type: {type}
                    </Typography>
                );
        }
    }, (prevProps, nextProps) =>
        prevProps.parameter.title !== nextProps.parameter.title &&
        prevProps.parameter.type !== nextProps.parameter.type &&
        prevProps.parameter.type !== nextProps.parameter.type &&
        prevProps.value !== nextProps.value
)

export default ParameterInput;
