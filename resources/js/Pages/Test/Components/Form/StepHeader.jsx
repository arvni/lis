import React from 'react';
import { Box, Typography } from '@mui/material';

export default function StepHeader({ meta, current, step, steps }) {
    return (
        <Box
            sx={{
                mb: 3,
                pb: 2,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
            }}
        >
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: `${meta.color}.main`,
                    color: 'white',
                }}
            >
                {current?.icon && React.cloneElement(current.icon, { style: { fontSize: 18 } })}
            </Box>
            <Box>
                <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                    {current?.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Step {step + 1} of {steps.length}
                </Typography>
            </Box>
        </Box>
    );
}
