import React from 'react';
import { Box, Chip } from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

export default function MobileNav({ steps, step, setStep, stepHasError }) {
    return (
        <Box
            sx={{
                display: 'flex',
                gap: 1,
                overflowX: 'auto',
                pb: 1,
                mb: 2,
                '&::-webkit-scrollbar': { display: 'none' },
            }}
        >
            {steps.map((s, idx) => {
                const hasError = stepHasError(s);
                const isActive = idx === step;
                const isDone = idx < step && !hasError;
                return (
                    <Chip
                        key={s.key}
                        icon={hasError ? <ErrorIcon /> : isDone ? <CheckCircle /> : s.icon}
                        label={s.label}
                        onClick={() => setStep(idx)}
                        color={
                            isActive
                                ? 'primary'
                                : hasError
                                  ? 'error'
                                  : isDone
                                    ? 'success'
                                    : 'default'
                        }
                        variant={isActive ? 'filled' : 'outlined'}
                        sx={{ flexShrink: 0, fontWeight: isActive ? 600 : 400 }}
                    />
                );
            })}
        </Box>
    );
}
