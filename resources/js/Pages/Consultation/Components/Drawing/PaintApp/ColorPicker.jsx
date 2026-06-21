import React from 'react';
import { Box } from '@mui/material';
import { colors } from './constants';

const ColorPicker = ({ selectedColor, onColorChange }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 320 }}>
        {colors.map((c) => (
            <Box
                key={c}
                onClick={() => onColorChange(c)}
                sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: c,
                    border: selectedColor === c ? '2px solid #1976d2' : '1px solid #ccc',
                    borderRadius: 0.5,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: 1,
                    },
                }}
            />
        ))}
        <Box
            component="input"
            type="color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            sx={{
                width: 20,
                height: 20,
                border: 'none',
                borderRadius: 0.5,
                cursor: 'pointer',
                padding: 0,
            }}
        />
    </Box>
);

export default ColorPicker;
