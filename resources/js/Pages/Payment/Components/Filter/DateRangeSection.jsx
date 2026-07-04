import React from 'react';
import { Box, Stack, Grid, Typography, Chip } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { DATE_PRESETS } from './constants.js';

const DateRangeSection = ({ dateFrom, dateTo, dateError, onPreset, onChange }) => (
    <Grid size={{ xs: 12 }}>
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CalendarTodayIcon color="action" fontSize="small" />
                <Typography variant="subtitle2" color="text.secondary">
                    Date Range
                </Typography>
            </Box>

            {/* Quick Date Presets */}
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                {DATE_PRESETS.map(({ key, label }) => (
                    <Chip
                        key={key}
                        label={label}
                        onClick={() => onPreset(key)}
                        size="small"
                        variant="outlined"
                        clickable
                    />
                ))}
            </Stack>

            {/* Date Pickers */}
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                        label="From Date"
                        value={dateFrom}
                        onChange={(value) => onChange('dateFrom', value)}
                        clearable
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                error: !!dateError,
                            },
                        }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <DatePicker
                        label="To Date"
                        value={dateTo}
                        onChange={(value) => onChange('dateTo', value)}
                        clearable
                        slotProps={{
                            textField: {
                                fullWidth: true,
                                error: !!dateError,
                                helperText: dateError,
                            },
                        }}
                    />
                </Grid>
            </Grid>
        </Box>
    </Grid>
);

export default DateRangeSection;
