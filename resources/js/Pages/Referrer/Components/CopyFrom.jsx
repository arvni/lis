import React, {useState, useCallback} from 'react';
import {
    DialogActions,
    Dialog,
    DialogTitle,
    Button, DialogContent
} from '@mui/material';
import {router} from '@inertiajs/react';

import SelectSearch from '@/Components/SelectSearch';
import Grid from "@mui/material/Grid2";

const CopyForm = ({
                      open,
                      referrer,
                      onClose
                  }) => {
    // State management with improved typing
    const [data, setData] = useState({source: ""});
    const [errors, setErrors] = useState({});

    // Close handler with data reset
    const handleClose = useCallback(() => {
        setData({source: ""});
        onClose();
    }, [onClose]);


    // Submit handler
    const submit = () => {

        router.post( route("referrer.copy-from-other", referrer), data, {
            onSuccess: onClose,
            onError: (errors) => {
                console.error('Submission errors:', errors);
                setErrors(errors);
            }
        });
    };

    const handleChange = (e) => setData(prevData => ({...prevData, [e.target.name]: e.target.value}))
    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth="md" // Increased width to accommodate multiple methods
            sx={{p: '5em'}}
        >
            <DialogTitle>
                Copy Test Price List From Other Referrer
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2} mt={2}>
                    {/* Referrer Selection */}
                    <Grid size={6}>
                        <SelectSearch
                            fullWidth
                            value={data?.source || ""}
                            label="Referrer"
                            url={route('api.referrers.list')}
                            onChange={handleChange}
                            name="source"
                            error={!!errors.source}
                            helperText={errors.source}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            {/* Dialog Actions */}
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    onClick={submit}
                    variant="contained"
                >
                    Submit
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CopyForm;
