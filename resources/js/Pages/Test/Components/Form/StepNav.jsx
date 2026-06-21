import React from 'react';
import { Box, Button } from '@mui/material';
import { ArrowBack, ArrowForward, Save } from '@mui/icons-material';

export default function StepNav({ prev, next, step, setStep, edit, cancel, meta, onSubmit }) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pt: 3,
                mt: 3,
                borderTop: 1,
                borderColor: 'divider',
            }}
        >
            <Button
                variant="outlined"
                color="inherit"
                startIcon={<ArrowBack />}
                onClick={prev ? () => setStep(step - 1) : cancel}
            >
                {prev ? prev.label : 'Cancel'}
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
                {edit && (
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<Save />}
                        onClick={onSubmit}
                    >
                        Save Changes
                    </Button>
                )}
                {next ? (
                    <Button
                        variant="contained"
                        endIcon={<ArrowForward />}
                        onClick={() => setStep(step + 1)}
                    >
                        {next.label}
                    </Button>
                ) : !edit ? (
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<Save />}
                        onClick={onSubmit}
                    >
                        Create {meta.label}
                    </Button>
                ) : null}
            </Box>
        </Box>
    );
}
