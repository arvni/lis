import React from 'react';
import { Box, Button, Paper, Tooltip, Typography } from '@mui/material';
import { numberTools } from './constants';

const NumberToolbox = ({ tool, onSelectTool }) => (
    <Paper
        elevation={2}
        sx={{
            width: 140,
            m: 1,
            mr: 0.5,
            p: 1,
            bgcolor: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
        }}
    >
        <Typography variant="subtitle2" sx={{ fontWeight: 600, textAlign: 'center', mb: 1 }}>
            Numbers
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
            {numberTools.map(({ name, label }) => (
                <Tooltip key={name} title={`Number ${label}`}>
                    <Button
                        variant={tool === name ? 'contained' : 'outlined'}
                        onClick={() => onSelectTool(name)}
                        sx={{
                            minWidth: 36,
                            height: 36,
                            fontSize: '16px',
                            fontWeight: 'bold',
                        }}
                    >
                        {label}
                    </Button>
                </Tooltip>
            ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
            Click to place numbers on canvas
        </Typography>
    </Paper>
);

export default NumberToolbox;
