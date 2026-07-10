import React from 'react';
import {
    Box,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    useTheme,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

/**
 * Rejection-specific inputs: the "Return to Section" select and the required
 * rejection-details text field.
 */
const RejectionFields = ({ acceptanceItemState, options, errors, onChange }) => {
    const theme = useTheme();
    const hasNextError = Object.prototype.hasOwnProperty.call(errors, 'next');
    const hasDetailsError = Object.prototype.hasOwnProperty.call(errors, 'details');

    return (
        <Box sx={{ mb: 3 }}>
            <FormControl
                fullWidth
                error={hasNextError}
                sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                        },
                    },
                }}
            >
                <InputLabel
                    error={hasNextError}
                    id="next-section-label"
                    sx={{
                        fontWeight: 'medium',
                    }}
                >
                    Return to Section *
                </InputLabel>
                <Select
                    error={hasNextError}
                    onChange={onChange}
                    name="next"
                    value={acceptanceItemState.next}
                    labelId="next-section-label"
                    label="Return to Section *"
                    startAdornment={
                        <ArrowBack
                            fontSize="small"
                            sx={{ ml: 1, mr: 0.5, color: theme.palette.action.active }}
                        />
                    }
                >
                    <MenuItem value={''}>Sample Collection</MenuItem>
                    {options.map((item, index) => (
                        <MenuItem key={index} value={item.id}>
                            {`${item.order + 1}- ${item.name}`}
                        </MenuItem>
                    ))}
                </Select>
                {hasNextError && <FormHelperText error>{errors.next}</FormHelperText>}
            </FormControl>

            <TextField
                multiline
                name="details"
                fullWidth
                onChange={onChange}
                label="Rejection Details *"
                rows={4}
                required
                error={hasDetailsError}
                value={acceptanceItemState.details || ''}
                helperText={
                    hasDetailsError
                        ? errors.details
                        : 'Please provide detailed reasons for rejecting this section'
                }
                variant="outlined"
                sx={{
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 1,
                        '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                        },
                    },
                }}
            />
        </Box>
    );
};

export default RejectionFields;
