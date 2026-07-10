import React from 'react';
import {
    Box,
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    TextField,
    useTheme,
} from '@mui/material';
import Upload from '@/Components/Upload';

/**
 * Renders one workflow parameter input by type: file upload, options radio
 * group, or a plain text field.
 */
const ParameterField = ({ item, errors, patientId, onParameterChange, onFileParameter }) => {
    const theme = useTheme();

    switch (item.type) {
        case 'file':
            return (
                <Box sx={{ mb: 2 }}>
                    <Upload
                        value={item?.value}
                        label={item.name}
                        name={item.name}
                        url={route('documents.store', {
                            ownerClass: 'Patient',
                            id: patientId,
                        })}
                        onChange={onFileParameter}
                        error={Object.prototype.hasOwnProperty.call(errors, item.name)}
                        helperText={errors[item.name] ?? null}
                        required={item.required}
                    />
                </Box>
            );
        case 'options':
            return (
                <FormControl
                    required={item.required}
                    fullWidth
                    sx={{
                        mb: 2,
                        p: 2,
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: 1,
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <FormLabel
                        sx={{
                            fontWeight: 'medium',
                            color: theme.palette.primary.main,
                            mb: 1,
                        }}
                    >
                        {item.name}
                        {item.required && (
                            <span style={{ color: theme.palette.error.main }}> *</span>
                        )}
                    </FormLabel>
                    <RadioGroup
                        row
                        name={item.name}
                        value={item.value}
                        onChange={onParameterChange}
                        required={item.required}
                    >
                        {Array.from(new Set(item.options.split(';').map((op) => op.trim()))).map(
                            (op, idx) => (
                                <FormControlLabel
                                    key={idx}
                                    value={op}
                                    control={
                                        <Radio
                                            color="primary"
                                            sx={{ '& .MuiSvgIcon-root': { fontSize: 20 } }}
                                        />
                                    }
                                    label={op}
                                    sx={{ mr: 3 }}
                                />
                            ),
                        )}
                    </RadioGroup>
                </FormControl>
            );
        default:
            return (
                <TextField
                    rows={4}
                    fullWidth
                    multiline={item.type === 'text'}
                    name={item.name}
                    label={item.name}
                    type={item.type}
                    value={item?.value ?? ''}
                    onChange={onParameterChange}
                    error={Object.prototype.hasOwnProperty.call(errors, item.name)}
                    helperText={errors[item.name] ?? null}
                    required={item.required}
                    variant="outlined"
                    sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                            },
                            borderRadius: 1,
                        },
                    }}
                />
            );
    }
};

export default ParameterField;
