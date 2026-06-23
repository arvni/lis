import {
    Autocomplete,
    Box,
    Chip,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Grid,
    InputAdornment,
    MenuItem,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Help } from '@mui/icons-material';
import { getFieldTypeIcon, getTypeDescription } from './constants';
import FieldPreview from './FieldPreview';

const FieldConfigInputs = ({
    data,
    errors,
    disabled,
    onChange,
    onRequiredChange,
    onPlaceholderChange,
    onOptionChange,
}) => (
    <Grid container spacing={3}>
        {/* Field Label */}
        <Grid size={{ xs: 12, md: 6 }}>
            <TextField
                fullWidth
                name="label"
                value={data?.label || ''}
                onChange={onChange}
                label="Field Label"
                placeholder="Enter field label"
                required
                error={!!errors?.label}
                helperText={errors?.label || 'The label that will be displayed for this field'}
                multiline={data?.type === 'description'}
                rows={data?.type === 'description' ? 3 : 1}
                disabled={disabled}
                autoFocus
            />
        </Grid>

        {/* Field Type */}
        <Grid size={{ xs: 12, md: 6 }}>
            <TextField
                fullWidth
                select
                name="type"
                value={data?.type || ''}
                onChange={onChange}
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
                        ) : undefined,
                    },
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
        <Grid size={{ xs: 12, md: 6 }}>
            <FormControl component="fieldset">
                <FormControlLabel
                    control={
                        <Switch
                            checked={!!data?.required}
                            onChange={onRequiredChange}
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
            <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                    fullWidth
                    name="placeholder"
                    value={data.placeholder || ''}
                    onChange={onPlaceholderChange}
                    label="Placeholder Text"
                    placeholder="Enter placeholder text"
                    helperText="Text that will be shown when the field is empty"
                    disabled={disabled}
                />
            </Grid>
        )}

        {/* Options for select type */}
        {data?.type === 'select' && (
            <Grid size={{ xs: 12 }}>
                <Autocomplete
                    multiple
                    value={data.options || []}
                    onChange={onOptionChange}
                    options={[]}
                    freeSolo
                    selectOnFocus
                    clearOnBlur
                    handleHomeEndKeys
                    disabled={disabled}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                            const { key, ...tagProps } = getTagProps({ index });
                            return (
                                <Chip
                                    key={key}
                                    variant="outlined"
                                    label={option}
                                    size="medium"
                                    {...tagProps}
                                />
                            );
                        })
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Dropdown Options"
                            placeholder="Type and press Enter to add options"
                            fullWidth
                            error={!!errors.options}
                            helperText={
                                errors.options ||
                                'Add the options that will appear in the dropdown list'
                            }
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
            <Grid size={{ xs: 12 }}>
                <FieldPreview data={data} />
            </Grid>
        )}
    </Grid>
);

export default FieldConfigInputs;
