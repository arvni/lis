import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import {
    Button,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Chip,
    Alert,
    CircularProgress,
} from "@mui/material";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import React, { useState, useMemo } from "react";
import { useForm } from "@inertiajs/react";

const Form = ({ barcodes, samples, open, onClose, referrerOrder }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { data, setData, errors, post, reset } = useForm({ barcodes });

    // Get current datetime in local timezone format
    const now = useMemo(() => {
        const date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    }, []);

    // Validation helper
    const isFormValid = useMemo(() => {
        return data?.barcodes?.every(barcode =>
            barcode.sample &&
            barcode.sampleType &&
            barcode.received_at &&
            (!barcode.collectionDate || new Date(barcode.collectionDate) <= new Date(barcode.received_at))
        );
    }, [data?.barcodes]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsSubmitting(true);

        post(route('referrerOrders.samples', referrerOrder), {
            onSuccess: () => {
                window.open(route("acceptances.barcodes", referrerOrder.acceptance_id), "_blank");
                handleClose();
            },
            onError: () => {
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            reset();
        }
    };

    const sampleChange = (index) => (e) => {
        const selectedSampleId = e.target.value;
        const selectedSample = samples.find(item => item.id === selectedSampleId);

        if (selectedSample) {
            const updatedBarcodes = [...data.barcodes];
            updatedBarcodes[index] = {
                ...updatedBarcodes[index],
                sample: selectedSample,
                collection_date: selectedSample.collectionDate,
                barcode: selectedSample.sampleId ?? null,
                // Reset received_at if collection date changed to avoid validation errors
                received_at: updatedBarcodes[index].received_at || ""
            };
            setData({ barcodes: updatedBarcodes });
        }
    };

    const sampleTypeChange = (index) => (e) => {
        const updatedBarcodes = [...data.barcodes];
        updatedBarcodes[index] = {
            ...updatedBarcodes[index],
            sampleType: e.target.value
        };
        setData({ barcodes: updatedBarcodes });
    };

    const handleReceivedDateChange = (index) => (e) => {
        const updatedBarcodes = [...data.barcodes];
        updatedBarcodes[index] = {
            ...updatedBarcodes[index],
            received_at: e.target.value
        };
        setData({ barcodes: updatedBarcodes });
    };

    // Get unique sample types for a barcode
    const getAvailableSampleTypes = (barcode) => {
        const sampleTypes = new Map();
        barcode.items.forEach(item => {
            item.method.test.sample_types?.forEach(sampleType => {
                sampleTypes.set(sampleType.id, sampleType);
            });
        });
        return Array.from(sampleTypes.values());
    };

    // Filter samples based on selected sample type
    const getFilteredSamples = (selectedSampleType) => {
        if (!selectedSampleType) return samples;
        return samples.filter(sample => sample.sample_type?.server_id === selectedSampleType);
    };

    if (!data?.barcodes?.length) return null;

    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth="xl"
            disableEscapeKeyDown={isSubmitting}
        >
            <DialogTitle>
                <Typography variant="h6" component="div">
                    Select Samples for Order #{referrerOrder?.id}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Please select appropriate samples and sample types for each barcode group
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    {!isFormValid && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            Please complete all required fields and ensure received dates are after collection dates
                        </Alert>
                    )}

                    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell rowSpan={2} align="center" sx={{ fontWeight: 'bold', minWidth: 120 }}>
                                        Barcode Group
                                    </TableCell>
                                    <TableCell colSpan={2} align="center" sx={{ fontWeight: 'bold', borderBottom: 1 }}>
                                        Test Information
                                    </TableCell>
                                    <TableCell colSpan={4} align="center" sx={{ fontWeight: 'bold', borderBottom: 1 }}>
                                        Sample Details
                                    </TableCell>
                                </TableRow>
                                <TableRow sx={{ bgcolor: 'grey.50' }}>
                                    <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 200 }}>
                                        Test Name
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 180 }}>
                                        Accepted Sample Types
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 150 }}>
                                        Selected Sample Type *
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 200 }}>
                                        Selected Sample *
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 200 }}>
                                        Sample Information
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'medium', minWidth: 200 }}>
                                        Received Date & Time *
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.barcodes.map((barcode, index) => (
                                    <TableRow key={`barcode-${barcode.barcodeGroup.id}`}>
                                        <TableCell
                                            rowSpan={barcode?.items?.length || 1}
                                            sx={{
                                                verticalAlign: 'top',
                                                bgcolor: 'primary.50',
                                                fontWeight: 'medium'
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                                {barcode.barcodeGroup.name}
                                            </Typography>
                                        </TableCell>

                                        <TableCell sx={{ verticalAlign: 'top' }}>
                                            <Stack spacing={1}>
                                                {barcode.items.map((item) => (
                                                    <Box key={`test-${item.method.id}`}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                                            {item.method.test.name}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Method: {item.method.name}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </TableCell>

                                        <TableCell sx={{ verticalAlign: 'top' }}>
                                            <Stack spacing={1}>
                                                {barcode.items.map((item) => (
                                                    <Box key={`sample-types-${item.method.id}`}>
                                                        {item.method.test.sample_types.map((sampleType) => (
                                                            <Chip
                                                                key={sampleType.id}
                                                                label={`${sampleType.name}${sampleType.pivot.description ? ` (${sampleType.pivot.description})` : ''}`}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ mr: 0.5, mb: 0.5 }}
                                                            />
                                                        ))}
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </TableCell>

                                        <TableCell sx={{ verticalAlign: 'top' }}>
                                            <Select
                                                fullWidth
                                                size="small"
                                                onChange={sampleTypeChange(index)}
                                                value={barcode.sampleType || ""}
                                                displayEmpty
                                                error={!barcode.sampleType}
                                            >
                                                <MenuItem value="">
                                                    <em>Select sample type</em>
                                                </MenuItem>
                                                {getAvailableSampleTypes(barcode).map((sampleType) => (
                                                    <MenuItem
                                                        key={`sample-type-${sampleType.id}`}
                                                        value={sampleType.id}
                                                    >
                                                        {sampleType.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </TableCell>

                                        <TableCell sx={{ verticalAlign: 'top' }}>
                                            <Select
                                                fullWidth
                                                size="small"
                                                onChange={sampleChange(index)}
                                                value={barcode?.sample?.id || ""}
                                                displayEmpty
                                                disabled={!barcode.sampleType}
                                                error={!barcode.sample}
                                            >
                                                <MenuItem value="">
                                                    <em>Select sample</em>
                                                </MenuItem>
                                                {getFilteredSamples(barcode.sampleType)?.map((sample) => (
                                                    <MenuItem
                                                        key={`sample-${sample.id}`}
                                                        value={sample.id}
                                                    >
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {sample.sample_type?.name}
                                                                {sample.sampleId && ` | ${sample.sampleId}`}
                                                            </Typography>
                                                            {sample.collection_date && (
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Collected: {new Date(sample.collection_date).toLocaleDateString()}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                            {barcode.sampleType && !getFilteredSamples(barcode.sampleType)?.length && (
                                                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                                                    No samples available for this type
                                                </Typography>
                                            )}
                                        </TableCell>

                                        <TableCell sx={{ verticalAlign: 'top' }}>
                                            {barcode.sample && (
                                                <Box sx={{ p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                                                    <Stack spacing={0.5}>
                                                        <Box display="flex" alignItems="center">
                                                            <Typography variant="caption" sx={{ fontWeight: 'medium', minWidth: 80 }}>
                                                                Type:
                                                            </Typography>
                                                            <Typography variant="caption">
                                                                {barcode.sample.sample_type?.name}
                                                            </Typography>
                                                        </Box>
                                                        {barcode.collectionDate && (
                                                            <Box display="flex" alignItems="center">
                                                                <Typography variant="caption" sx={{ fontWeight: 'medium', minWidth: 80 }}>
                                                                    Collected:
                                                                </Typography>
                                                                <Typography variant="caption">
                                                                    {new Date(barcode.collectionDate).toLocaleString()}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {barcode.sample.sampleId && (
                                                            <Box display="flex" alignItems="center">
                                                                <Typography variant="caption" sx={{ fontWeight: 'medium', minWidth: 80 }}>
                                                                    Barcode:
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                                                    {barcode.sample.sampleId}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </TableCell>

                                        <TableCell sx={{ verticalAlign: 'top' }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                type="datetime-local"
                                                label="Received Date & Time"
                                                value={barcode.received_at || ""}
                                                onChange={handleReceivedDateChange(index)}
                                                slotProps={{
                                                    htmlInput: {
                                                        max: now,
                                                        min: barcode.collectionDate ?
                                                            new Date(barcode.collectionDate).toISOString().slice(0, 16) :
                                                            undefined
                                                    },
                                                    inputLabel: { shrink: true }
                                                }}
                                                error={
                                                    !barcode.received_at ||
                                                    (barcode.collectionDate &&
                                                        new Date(barcode.collectionDate) > new Date(barcode.received_at))
                                                }
                                                helperText={
                                                    !barcode.received_at
                                                        ? "Required field"
                                                        : barcode.collectionDate &&
                                                        new Date(barcode.collectionDate) > new Date(barcode.received_at)
                                                            ? "Must be after collection date"
                                                            : ""
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50' }}>
                <Button
                    onClick={handleClose}
                    disabled={isSubmitting}
                    sx={{ minWidth: 100 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
                    sx={{ minWidth: 120 }}
                >
                    {isSubmitting ? "Processing..." : "Submit"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Form;
