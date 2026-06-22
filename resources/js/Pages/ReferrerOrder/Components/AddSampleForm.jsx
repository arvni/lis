import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
    Button,
    Table,
    TableBody,
    TableContainer,
    Typography,
    Chip,
    Alert,
    CircularProgress,
} from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useState, useMemo, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import { MergeType } from '@mui/icons-material';
import SampleTableHead from './AddSampleForm/SampleTableHead';
import BarcodeSampleRow from './AddSampleForm/BarcodeSampleRow';
import { buildCleanedBarcodes } from './AddSampleForm/helpers';

const Form = ({
    barcodes,
    samples,
    open,
    onClose,
    referrerOrder,
    isPooling = false,
    allAcceptanceItems = [],
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});
    const { data, setData, reset } = useForm({ barcodes });

    // Initialize barcodes with selectedItems for pooling mode
    useEffect(() => {
        if (isPooling && barcodes?.length > 0) {
            const initializedBarcodes = barcodes.map((barcode) => ({
                ...barcode,
                selectedItems: barcode.items?.map((item) => item.id) || [],
            }));
            setData({ barcodes: initializedBarcodes });
        }
    }, [isPooling, barcodes, setData]);

    // Get current datetime in local timezone format
    const now = useMemo(() => {
        const date = new Date();
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().slice(0, 16);
    }, []);

    // Validation helper
    const isFormValid = useMemo(() => {
        return data?.barcodes?.every((barcode) => {
            const baseValid =
                barcode.sample &&
                barcode.sampleType &&
                barcode.received_at &&
                (!barcode.collectionDate ||
                    new Date(barcode.collectionDate) <= new Date(barcode.received_at));

            // For pooling, also check that at least one item is selected
            if (isPooling) {
                return baseValid && barcode.selectedItems?.length > 0;
            }
            return baseValid;
        });
    }, [data?.barcodes, isPooling]);

    // Toggle row expansion for item selection
    const toggleRowExpansion = (index) => {
        setExpandedRows((prev) => ({
            ...prev,
            [index]: !prev[index],
        }));
    };

    // Handle acceptance item selection change
    const handleItemSelectionChange = (barcodeIndex, itemId) => {
        const updatedBarcodes = [...data.barcodes];
        const currentSelected = updatedBarcodes[barcodeIndex].selectedItems || [];

        if (currentSelected.includes(itemId)) {
            updatedBarcodes[barcodeIndex].selectedItems = currentSelected.filter(
                (id) => id !== itemId,
            );
        } else {
            updatedBarcodes[barcodeIndex].selectedItems = [...currentSelected, itemId];
        }

        // Also update the items array to match selected items
        updatedBarcodes[barcodeIndex].items = allAcceptanceItems.filter((item) =>
            updatedBarcodes[barcodeIndex].selectedItems.includes(item.id),
        );

        setData({ barcodes: updatedBarcodes });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isFormValid) return;

        setIsSubmitting(true);

        // Clean up data to only send what's needed
        const cleanedBarcodes = buildCleanedBarcodes(data.barcodes);

        // Use router.post directly with cleaned data
        router.post(
            route('referrerOrders.samples', referrerOrder),
            { barcodes: cleanedBarcodes },
            {
                onSuccess: () => {
                    window.open(
                        route('acceptances.barcodes', referrerOrder.acceptance_id),
                        '_blank',
                    );
                    handleClose();
                },
                onError: () => {
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
            reset();
        }
    };

    const sampleChange = (index) => (e) => {
        const selectedSampleId = e.target.value;
        const selectedSample = samples.find((item) => item.id === selectedSampleId);

        if (selectedSample) {
            const updatedBarcodes = [...data.barcodes];
            updatedBarcodes[index] = {
                ...updatedBarcodes[index],
                sample: selectedSample,
                collection_date: selectedSample.collectionDate,
                barcode: selectedSample.sampleId ?? null,
                // Reset received_at if collection date changed to avoid validation errors
                received_at: updatedBarcodes[index].received_at || '',
            };
            setData({ barcodes: updatedBarcodes });
        }
    };

    const sampleTypeChange = (index) => (e) => {
        const updatedBarcodes = [...data.barcodes];
        updatedBarcodes[index] = {
            ...updatedBarcodes[index],
            sampleType: e.target.value,
        };
        setData({ barcodes: updatedBarcodes });
    };

    const handleReceivedDateChange = (index) => (e) => {
        const updatedBarcodes = [...data.barcodes];
        updatedBarcodes[index] = {
            ...updatedBarcodes[index],
            received_at: e.target.value,
        };
        setData({ barcodes: updatedBarcodes });
    };

    if (!data?.barcodes?.length) return null;

    return (
        <Dialog
            open={open}
            fullWidth
            maxWidth="xl"
            onClose={(_, reason) => {
                if (!isSubmitting || reason !== 'escapeKeyDown') handleClose();
            }}
        >
            <DialogTitle>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    {isPooling && <MergeType color="info" />}
                    <Typography variant="h6" component="div">
                        Select Samples for Order #{referrerOrder?.id}
                    </Typography>
                    {isPooling && <Chip label="Pooling Mode" size="small" color="info" />}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {isPooling
                        ? 'Select which acceptance items each sample should be linked to'
                        : 'Please select appropriate samples and sample types for each barcode group'}
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                <Box component="form" onSubmit={handleSubmit}>
                    {!isFormValid && (
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            Please complete all required fields and ensure received dates are after
                            collection dates
                        </Alert>
                    )}

                    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Table>
                            <SampleTableHead isPooling={isPooling} />
                            <TableBody>
                                {data.barcodes.map((barcode, index) => (
                                    <BarcodeSampleRow
                                        key={`barcode-${barcode.barcodeGroup.id}`}
                                        barcode={barcode}
                                        index={index}
                                        isPooling={isPooling}
                                        expanded={expandedRows[index]}
                                        allAcceptanceItems={allAcceptanceItems}
                                        samples={samples}
                                        now={now}
                                        onToggleExpand={toggleRowExpansion}
                                        onItemSelectionChange={handleItemSelectionChange}
                                        onSampleTypeChange={sampleTypeChange}
                                        onSampleChange={sampleChange}
                                        onReceivedDateChange={handleReceivedDateChange}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: 'grey.50' }}>
                <Button onClick={handleClose} disabled={isSubmitting} sx={{ minWidth: 100 }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
                    sx={{ minWidth: 120 }}
                >
                    {isSubmitting ? 'Processing...' : 'Submit'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Form;
