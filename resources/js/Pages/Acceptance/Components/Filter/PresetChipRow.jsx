import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const PresetChipRow = ({ title, presets, color, onSelect }) => (
    <>
        <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
            {title}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {presets.map((preset) => (
                <Chip
                    key={preset.key}
                    label={preset.label}
                    onClick={() => onSelect(preset.key)}
                    size="small"
                    clickable
                    color={color}
                    variant="outlined"
                />
            ))}
        </Box>
    </>
);

export default PresetChipRow;
