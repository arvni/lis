import { Box, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography, alpha } from '@mui/material';

// Live preview of the configured field.
const FieldPreview = ({ data }) => (
    <>
        <Typography variant="subtitle2" gutterBottom>
            Field Preview
        </Typography>

        <Box
            sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: alpha('#f5f5f5', 0.5),
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
                            <Typography component="span" color="error.main" sx={{ ml: 0.5 }}>
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
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    )}

                    {data?.type === 'checkbox' && (
                        <FormControlLabel control={<Switch disabled />} label="Yes/No" />
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
    </>
);

export default FieldPreview;
