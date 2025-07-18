import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    FormControl,
    FormLabel,
    Radio,
    RadioGroup,
    FormControlLabel,
    Button,
    Typography,
    Box,
    Paper,
    Divider,
    alpha,
    Stack,
    Avatar,
    IconButton,
    Chip,
    Alert,
    CircularProgress,
    useTheme
} from "@mui/material";
import {
    Close,
    Save,
    ReceiptLong,
    Person,
    Business,
    CheckCircle,
    Info,
    ArrowForward
} from "@mui/icons-material";
import { router } from "@inertiajs/react";

/**
 * Enhanced CreateInvoiceForm component with improved UI/UX
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Object} props.initialData - Initial form data
 * @param {Function} props.onClose - Function to close the dialog
 * @returns {JSX.Element}
 */
const CreateInvoiceForm = ({ open, initialData, onClose }) => {
    const theme = useTheme();

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
            newErrors.owner_type = "Please select an invoice owner";
        }

        if (!formData.owner_id) {
            newErrors.owner_id = "Owner ID is required";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setProcessing(false);
            return;
        }

        // Submit the form
        router.post(route("invoices.store"), formData, {
            onSuccess: () => {
                setProcessing(false);
                onClose();
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            }
        });
    };

    // Handle owner type change
    const handleOwnerChange = (e) => {
        const { value } = e.target;
        const ownerId = formData[value]?.id;

        setFormData((prevState) => ({
            ...prevState,
            owner_type: value,
            owner_id: ownerId
        }));

        // Clear error if valid selection is made
        if (errors.owner_type && value) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.owner_type;
                return newErrors;
            });
        }
    };

    // Get avatar based on owner type
    const getOwnerAvatar = (type, data) => {
        if (!data) return null;

        if (data.avatar) {
            return (
                <Avatar
                    src={data.avatar}
                    alt={data.fullName}
                    sx={{
                        width: 40,
                        height: 40,
                        border: '2px solid',
                        borderColor: type === 'patient' ? 'primary.main' : 'secondary.main'
                    }}
                />
            );
        }

        return (
            <Avatar
                sx={{
                    bgcolor: type === 'patient' ? 'primary.main' : 'secondary.main',
                    width: 40,
                    height: 40
                }}
            >
                {type === 'patient' ? <Person /> : <Business />}
            </Avatar>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={processing ? undefined : onClose}
            maxWidth="md"
            fullWidth
            slotProps={{
                paper:{sx: {
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            }}
        >
            <DialogTitle
                sx={{
                    p: 3,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ReceiptLong
                        sx={{
                            mr: 1.5,
                            color: 'primary.main',
                            fontSize: 28
                        }}
                    />
                    <Box>
                        <Typography variant="h6">
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
                        '&:hover': { color: 'primary.main' }
                    }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ p: 3 }}>
                {processing ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
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
                                borderRadius: 2
                            }}
                        >
                            <Typography variant="body2">
                                The invoice owner will be responsible for payment.
                                Select the patient or referrer as the owner.
                            </Typography>
                        </Alert>

                        <FormControl
                            fullWidth
                            error={!!errors.owner_type}
                            component={Paper}
                            variant="outlined"
                            sx={{
                                p: 3,
                                borderRadius: 2
                            }}
                        >
                            <FormLabel
                                id="owner-radio-buttons-group"
                                sx={{
                                    mb: 2,
                                    fontSize: '1rem',
                                    fontWeight: 'medium',
                                    color: 'text.primary'
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
                                        gap: 2
                                    }}
                                >
                                    <Paper
                                        variant={formData.owner_type === 'patient' ? "elevation" : "outlined"}
                                        elevation={formData.owner_type === 'patient' ? 3 : 0}
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            flex: 1,
                                            borderColor: formData.owner_type === 'patient' ? 'primary.main' : 'divider',
                                            backgroundColor: formData.owner_type === 'patient'
                                                ? alpha(theme.palette.primary.main, 0.05)
                                                : 'background.paper',
                                            transition: 'all 0.2s',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {formData.owner_type === 'patient' && (
                                            <Chip
                                                icon={<CheckCircle fontSize="small" />}
                                                label="Selected"
                                                color="primary"
                                                size="small"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8
                                                }}
                                            />
                                        )}

                                        <FormControlLabel
                                            value="patient"
                                            control={
                                                <Radio
                                                    color="primary"
                                                    sx={{ mr: 1 }}
                                                />
                                            }
                                            label=""
                                            sx={{
                                                m: 0,
                                                width: '100%',
                                                alignItems: 'flex-start'
                                            }}
                                        />

                                        <Box
                                            sx={{
                                                mt: 1,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {getOwnerAvatar('patient', formData.patient)}

                                            <Box sx={{ ml: 2 }}>
                                                <Typography variant="subtitle1" fontWeight="medium">
                                                    {formData.patient?.fullName || 'Patient'}
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        mt: 0.5
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Person
                                                            fontSize="small"
                                                            sx={{
                                                                mr: 0.5,
                                                                color: 'primary.light'
                                                            }}
                                                        />
                                                        Patient
                                                    </Typography>

                                                    {formData.patient?.idNo && (
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ ml: 2 }}
                                                        >
                                                            ID: {formData.patient.idNo}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Paper>

                                    {formData.referrer && (
                                        <Paper
                                            variant={formData.owner_type === 'referrer' ? "elevation" : "outlined"}
                                            elevation={formData.owner_type === 'referrer' ? 3 : 0}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                flex: 1,
                                                borderColor: formData.owner_type === 'referrer' ? 'secondary.main' : 'divider',
                                                backgroundColor: formData.owner_type === 'referrer'
                                                    ? alpha(theme.palette.secondary.main, 0.05)
                                                    : 'background.paper',
                                                transition: 'all 0.2s',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                        >
                                            {formData.owner_type === 'referrer' && (
                                                <Chip
                                                    icon={<CheckCircle fontSize="small" />}
                                                    label="Selected"
                                                    color="secondary"
                                                    size="small"
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8
                                                    }}
                                                />
                                            )}

                                            <FormControlLabel
                                                value="referrer"
                                                control={
                                                    <Radio
                                                        color="secondary"
                                                        sx={{ mr: 1 }}
                                                    />
                                                }
                                                label=""
                                                sx={{
                                                    m: 0,
                                                    width: '100%',
                                                    alignItems: 'flex-start'
                                                }}
                                            />

                                            <Box
                                                sx={{
                                                    mt: 1,
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {getOwnerAvatar('referrer', formData.referrer)}

                                                <Box sx={{ ml: 2 }}>
                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                        {formData.referrer?.fullName || formData.referrer?.name || 'Referrer'}
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            mt: 0.5
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center'
                                                            }}
                                                        >
                                                            <Business
                                                                fontSize="small"
                                                                sx={{
                                                                    mr: 0.5,
                                                                    color: 'secondary.light'
                                                                }}
                                                            />
                                                            Referrer
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    )}
                                </Box>
                            </RadioGroup>

                            {errors.owner_type && (
                                <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{ mt: 1 }}
                                >
                                    {errors.owner_type}
                                </Typography>
                            )}
                        </FormControl>

                        {formData.owner_type && (
                            <Box
                                sx={{
                                    mt: 3,
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    backgroundColor: alpha(theme.palette.background.default, 0.5)
                                }}
                            >
                                <Typography variant="subtitle2" gutterBottom>
                                    Invoice Summary
                                </Typography>

                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Acceptance ID
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            #{formData.acceptance_id}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Owner
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            {formData.owner_type === 'patient'
                                                ? formData.patient?.fullName
                                                : formData.referrer?.fullName || formData.referrer?.name}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Type
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {formData.owner_type === 'patient' ? (
                                                <>
                                                    <Person
                                                        fontSize="small"
                                                        sx={{
                                                            mr: 0.5,
                                                            color: 'primary.main'
                                                        }}
                                                    />
                                                    Patient Invoice
                                                </>
                                            ) : (
                                                <>
                                                    <Business
                                                        fontSize="small"
                                                        sx={{
                                                            mr: 0.5,
                                                            color: 'secondary.main'
                                                        }}
                                                    />
                                                    Referrer Invoice
                                                </>
                                            )}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2.5, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
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
