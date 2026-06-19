import React, { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    InputAdornment,
    Stack,
    TextField,
} from '@mui/material';
import { QrCode as QrCodeIcon } from '@mui/icons-material';

const EditSampleModal = ({ open, sample, onClose }) => {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        barcode: '',
    });

    useEffect(() => {
        if (sample) {
            setData('barcode', sample.barcode ?? '');
            clearErrors();
        }
    }, [sample, setData, clearErrors]);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('samples.update', sample.id), {
            onSuccess: handleClose,
        });
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>Edit Sample Barcode</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField
                            label="Barcode"
                            value={data.barcode}
                            onChange={(e) => setData('barcode', e.target.value)}
                            error={Boolean(errors.barcode)}
                            helperText={errors.barcode}
                            fullWidth
                            autoFocus
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <QrCodeIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={processing}>
                        Save
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default EditSampleModal;
