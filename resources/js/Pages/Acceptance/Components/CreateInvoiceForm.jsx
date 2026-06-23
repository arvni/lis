import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    FormLabel,
    RadioGroup,
    Button,
    Typography,
    Box,
    Paper,
    Divider,
    alpha,
    IconButton,
    Alert,
    CircularProgress,
    useTheme,
} from '@mui/material';
import { Close, Save, ReceiptLong, Person, Business, Info, ArrowForward } from '@mui/icons-material';
import { router, usePage } from '@inertiajs/react';
import OwnerCard from './CreateInvoiceForm/OwnerCard';
import InvoiceSummary from './CreateInvoiceForm/InvoiceSummary';

/**
 * Enhanced CreateInvoiceForm component with improved UI/UX
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object} props.initialData - Initial form data
 * @param {Function} props.onClose - Function to close the dialog
 * @returns {JSX.Element}
 */
const CreateInvoiceForm = ({ open, initialData, onClose, onCreated }) => {
    const theme = useTheme();
    const page = usePage();

    // State for form data, errors, and processing status
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    // Handle form submission
    const handleSubmit = () => {
        setProcessing(true);

        // Validate the form
        const newErrors = {};

        if (!formData.owner_type) {
            newErrors.owner_type = 'Please select an invoice owner';
        }

        if (!formData.owner_id) {
            newErrors.owner_id = 'Owner ID is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setProcessing(false);
            return;
        }

        // Submit the form
        router.post(route('invoices.store'), formData, {
            onSuccess: () => {
                setProcessing(false);
                const newId = page.props.created_invoice_id;
                if (onCreated && newId) {
                    onCreated(newId);
                } else {
                    onClose();
                }
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
        });
    };

    // Handle owner type change
    const handleOwnerChange = (e) => {
        const { value } = e.target;
        const ownerId = formData[value]?.id;

        setFormData((prevState) => ({
            ...prevState,
            owner_type: value,
            owner_id: ownerId,
        }));

        // Clear error if valid selection is made
        if (errors.owner_type && value) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.owner_type;
                return newErrors;
            });
        }
    };

    return (
        <Dialog
            open={open}
            onClose={processing ? undefined : onClose}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 2,
                        overflow: 'hidden',
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    p: 3,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReceiptLong
                        sx={{
                            mr: 1.5,
                            color: 'primary.main',
                            fontSize: 28,
                        }}
                    />
                    <Box>
                        <Typography variant="h6" component="span">
                            Create New Invoice
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5 }}
                        >
                            Choose the owner for this invoice
                        </Typography>
                    </Box>
                </Box>

                <IconButton
                    onClick={onClose}
                    disabled={processing}
                    aria-label="Close dialog"
                    sx={{
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' },
                    }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 3 }}>
                {processing ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            py: 6,
                        }}
                    >
                        <CircularProgress size={60} thickness={4} />
                        <Typography variant="h6" sx={{ mt: 3 }}>
                            Creating invoice...
                        </Typography>
                    </Box>
                ) : (
                    <>
                        <Alert
                            severity="info"
                            icon={<Info />}
                            variant="outlined"
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                            }}
                        >
                            <Typography variant="body2">
                                The invoice owner will be responsible for payment. Select the
                                patient or referrer as the owner.
                            </Typography>
                        </Alert>

                        <FormControl
                            fullWidth
                            error={!!errors.owner_type}
                            component={Paper}
                            variant="outlined"
                            sx={{
                                p: 3,
                                borderRadius: 2,
                            }}
                        >
                            <FormLabel
                                id="owner-radio-buttons-group"
                                sx={{
                                    mb: 2,
                                    fontSize: '1rem',
                                    fontWeight: 'medium',
                                    color: 'text.primary',
                                }}
                            >
                                Select Invoice Owner
                            </FormLabel>

                            <RadioGroup
                                aria-labelledby="owner-radio-buttons-group"
                                name="owner_type"
                                value={formData.owner_type}
                                onChange={handleOwnerChange}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: { xs: 'column', sm: 'row' },
                                        gap: 2,
                                    }}
                                >
                                    <OwnerCard
                                        theme={theme}
                                        type="patient"
                                        color="primary"
                                        selected={formData.owner_type === 'patient'}
                                        owner={formData.patient}
                                        title={formData.patient?.fullName || 'Patient'}
                                        label="Patient"
                                        labelIcon={
                                            <Person
                                                fontSize="small"
                                                sx={{ mr: 0.5, color: 'primary.light' }}
                                            />
                                        }
                                        extra={
                                            formData.patient?.idNo && (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ ml: 2 }}
                                                >
                                                    ID: {formData.patient.idNo}
                                                </Typography>
                                            )
                                        }
                                    />

                                    {formData.referrer && (
                                        <OwnerCard
                                            theme={theme}
                                            type="referrer"
                                            color="secondary"
                                            selected={formData.owner_type === 'referrer'}
                                            owner={formData.referrer}
                                            title={
                                                formData.referrer?.fullName ||
                                                formData.referrer?.name ||
                                                'Referrer'
                                            }
                                            label="Referrer"
                                            labelIcon={
                                                <Business
                                                    fontSize="small"
                                                    sx={{ mr: 0.5, color: 'secondary.light' }}
                                                />
                                            }
                                        />
                                    )}
                                </Box>
                            </RadioGroup>

                            {errors.owner_type && (
                                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                    {errors.owner_type}
                                </Typography>
                            )}
                        </FormControl>

                        {formData.owner_type && (
                            <InvoiceSummary theme={theme} formData={formData} />
                        )}
                    </>
                )}
            </DialogContent>

            <Divider />

            <DialogActions
                sx={{ p: 2.5, backgroundColor: alpha(theme.palette.background.default, 0.5) }}
            >
                <Button
                    onClick={onClose}
                    color="inherit"
                    disabled={processing}
                    variant="outlined"
                    startIcon={<Close />}
                    sx={{ borderRadius: 2 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={processing || !formData.owner_type}
                    startIcon={<Save />}
                    endIcon={<ArrowForward />}
                    sx={{ borderRadius: 2, px: 3 }}
                >
                    Create Invoice
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateInvoiceForm;
