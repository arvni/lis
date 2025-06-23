import React, {useState, useEffect} from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid2 as Grid,
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
    useTheme,
    Select,
    MenuItem,
    InputLabel,
    TextField,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from "@mui/material";
import {
    Close,
    Save,
    Edit,
    Person,
    Business,
    CheckCircle,
    Info,
    ArrowForward,
    PaymentRounded,
    ExpandMore,
    AccountBalance,
    SwapHoriz
} from "@mui/icons-material";
import {router} from "@inertiajs/react";

/**
 * Enhanced EditInvoiceForm component with improved UI/UX
 *
 * @param {Object} props - Component props
 * @param {Object} props.invoice - Invoice data to edit
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Function to close the dialog
 * @param {Function} props.onSubmit - Function to handle form submission
 * @param {Function} props.onChange - Function to handle field changes
 * @returns {JSX.Element}
 */
const EditInvoiceForm = ({invoice, open, onClose, onSubmit, onChange}) => {
    const theme = useTheme();

    // State for form data, errors, and processing status
    const [formData, setFormData] = useState(invoice || {});
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [expandedSection, setExpandedSection] = useState('status');

    // Update form data when invoice prop changes
    useEffect(() => {
        if (invoice) {
            setFormData(invoice);
        }
    }, [invoice]);

    // Handle form field changes
    const handleChange = (field, value) => {
        setFormData(prevState => ({
            ...prevState,
            [field]: value
        }));

        // Call parent onChange if provided
        if (onChange) {
            onChange(field, value);
        }

        // Clear error if field is valid
        if (errors[field] && value) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    // Handle form submission
    const handleSubmit = () => {
        setProcessing(true);

        // Validate the form
        const newErrors = {};

        if (!formData.status) {
            newErrors.status = "Please select a status";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setProcessing(false);
            return;
        }

        // Submit the form
        if (onSubmit) {
            onSubmit(formData);
        } else {
            // Default submission via Inertia
            router.put(route("invoices.update", invoice.id), formData, {
                onSuccess: () => {
                    setProcessing(false);
                    onClose();
                },
                onError: (errors) => {
                    setErrors(errors);
                    setProcessing(false);
                }
            });
        }
    };

    // Handle owner type change
    const handleOwnerChange = (e) => {
        const {value} = e.target;
        const ownerId = formData[value]?.id;

        handleChange('owner_type', value);
        handleChange('owner_id', ownerId);
    };

    // Get avatar based on owner type
    const getOwnerAvatar = (type, data) => {
        if (!data) return null;

        if (data.avatar) {
            return (
                <Avatar
                    src={data.avatar}
                    alt={data.fullName || data.name}
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
                {type === 'patient' ? <Person/> : <Business/>}
            </Avatar>
        );
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid':
                return 'success';
            case 'Partially Paid':
                return 'warning';
            case 'Canceled':
                return 'error';
            case 'waiting for payment':
            default:
                return 'info';
        }
    };

    // Get status icon
    const getStatusIcon = (status) => {
        switch (status) {
            case 'Paid':
                return <CheckCircle/>;
            case 'Partially Paid':
                return <PaymentRounded/>;
            case 'Canceled':
                return <Close/>;
            case 'Waiting':
            default:
                return <AccountBalance/>;
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
                        overflow: 'hidden'
                    }
                }
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
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <Edit
                        sx={{
                            mr: 1.5,
                            color: 'primary.main',
                            fontSize: 28
                        }}
                    />
                    <Box>
                        <Typography variant="h6">
                            Edit Invoice #{formData.id}
                        </Typography>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{display: 'block', mt: 0.5}}
                        >
                            Update invoice details and status
                        </Typography>
                    </Box>
                </Box>

                <IconButton
                    onClick={onClose}
                    disabled={processing}
                    aria-label="Close dialog"
                    sx={{
                        color: 'text.secondary',
                        '&:hover': {color: 'primary.main'}
                    }}
                >
                    <Close/>
                </IconButton>
            </DialogTitle>

            <Divider/>

            <DialogContent sx={{p: 3}}>
                {processing ? (
                    <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6}}>
                        <CircularProgress size={60} thickness={4}/>
                        <Typography variant="h6" sx={{mt: 3}}>
                            Updating invoice...
                        </Typography>
                    </Box>
                ) : (
                    <>
                        {/* Current Status Display */}
                        <Alert
                            severity={getStatusColor(formData.status)}
                            icon={getStatusIcon(formData.status)}
                            variant="outlined"
                            sx={{
                                mb: 3,
                                borderRadius: 2
                            }}
                        >
                            <Typography variant="body2">
                                Current Status: <strong>{formData.status || 'Not Set'}</strong>
                                {formData.acceptance && (
                                    <span> • Acceptance ID: #{formData.acceptance.id}</span>
                                )}
                            </Typography>
                        </Alert>

                        {/* Status Update Section */}
                        <Accordion
                            expanded={expandedSection === 'status'}
                            onChange={() => setExpandedSection(expandedSection === 'status' ? '' : 'status')}
                            sx={{mb: 2, borderRadius: 2, '&:before': {display: 'none'}}}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMore/>}
                                sx={{
                                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                    borderRadius: '8px 8px 0 0',
                                    '&.Mui-expanded': {
                                        borderRadius: '8px 8px 0 0'
                                    }
                                }}
                            >
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <PaymentRounded sx={{mr: 1, color: 'primary.main'}}/>
                                    <Typography variant="subtitle1" fontWeight="medium">
                                        Payment Status
                                    </Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{p: 3}}>
                                <Grid container spacing={3}>
                                    <Grid size={{xs: 12, sm: 6}}>
                                        <FormControl
                                            fullWidth
                                            error={!!errors.status}
                                        >
                                            <InputLabel id="status-select-label">Status</InputLabel>
                                            <Select
                                                labelId="status-select-label"
                                                value={formData.status || ''}
                                                label="Status"
                                                onChange={(e) => handleChange('status', e.target.value)}
                                                sx={{borderRadius: 2}}
                                            >
                                                <MenuItem value="waiting for payment">
                                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                        <AccountBalance sx={{mr: 1, fontSize: 20}}/>
                                                        Waiting for Payment
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="Paid">
                                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                        <CheckCircle sx={{mr: 1, fontSize: 20, color: 'success.main'}}/>
                                                        Paid
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="Partially Paid">
                                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                        <PaymentRounded
                                                            sx={{mr: 1, fontSize: 20, color: 'warning.main'}}/>
                                                        Partially Paid
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="Canceled">
                                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                        <Close sx={{mr: 1, fontSize: 20, color: 'error.main'}}/>
                                                        Canceled
                                                    </Box>
                                                </MenuItem>
                                            </Select>
                                            {errors.status && (
                                                <Typography
                                                    variant="caption"
                                                    color="error"
                                                    sx={{mt: 1}}
                                                >
                                                    {errors.status}
                                                </Typography>
                                            )}
                                        </FormControl>
                                    </Grid>
                                    <Grid size={{xs: 12, sm: 6}}>
                                        <TextField
                                            fullWidth
                                            label="Notes (Optional)"
                                            multiline
                                            rows={2}
                                            value={formData.notes || ''}
                                            onChange={(e) => handleChange('notes', e.target.value)}
                                            placeholder="Add any notes about this status change..."
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 2
                                                }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </AccordionDetails>
                        </Accordion>

                        {/* Owner Change Section (if applicable) */}
                        {(formData.patient || formData.referrer) && (
                            <Accordion
                                expanded={expandedSection === 'owner'}
                                onChange={() => setExpandedSection(expandedSection === 'owner' ? '' : 'owner')}
                                sx={{mb: 2, borderRadius: 2, '&:before': {display: 'none'}}}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMore/>}
                                    sx={{
                                        backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                                        borderRadius: '8px 8px 0 0',
                                        '&.Mui-expanded': {
                                            borderRadius: '8px 8px 0 0'
                                        }
                                    }}
                                >
                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                        <SwapHoriz sx={{mr: 1, color: 'secondary.main'}}/>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            Change Invoice Owner
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{p: 3}}>
                                    <Alert
                                        severity="warning"
                                        icon={<Info/>}
                                        variant="outlined"
                                        sx={{mb: 3, borderRadius: 2}}
                                    >
                                        <Typography variant="body2">
                                            Changing the invoice owner will transfer payment responsibility.
                                            This action should be done carefully.
                                        </Typography>
                                    </Alert>

                                    <FormControl
                                        fullWidth
                                        error={!!errors.owner_type}
                                        component={Paper}
                                        variant="outlined"
                                        sx={{p: 3, borderRadius: 2}}
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
                                            value={formData.owner_type || ''}
                                            onChange={handleOwnerChange}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: {xs: 'column', sm: 'row'},
                                                    gap: 2
                                                }}
                                            >
                                                {/* Patient Option */}
                                                {formData.patient && (
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
                                                                icon={<CheckCircle fontSize="small"/>}
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
                                                            control={<Radio color="primary" sx={{mr: 1}}/>}
                                                            label=""
                                                            sx={{
                                                                m: 0,
                                                                width: '100%',
                                                                alignItems: 'flex-start'
                                                            }}
                                                        />

                                                        <Box sx={{mt: 1, display: 'flex', alignItems: 'center'}}>
                                                            {getOwnerAvatar('patient', formData.patient)}
                                                            <Box sx={{ml: 2}}>
                                                                <Typography variant="subtitle1" fontWeight="medium">
                                                                    {formData.patient?.fullName || 'Patient'}
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{display: 'flex', alignItems: 'center'}}
                                                                >
                                                                    <Person fontSize="small"
                                                                            sx={{mr: 0.5, color: 'primary.light'}}/>
                                                                    Patient
                                                                    {formData.patient?.idNo && (
                                                                        <span style={{marginLeft: 16}}>
                                                                            ID: {formData.patient.idNo}
                                                                        </span>
                                                                    )}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Paper>
                                                )}

                                                {/* Referrer Option */}
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
                                                                icon={<CheckCircle fontSize="small"/>}
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
                                                            control={<Radio color="secondary" sx={{mr: 1}}/>}
                                                            label=""
                                                            sx={{
                                                                m: 0,
                                                                width: '100%',
                                                                alignItems: 'flex-start'
                                                            }}
                                                        />

                                                        <Box sx={{mt: 1, display: 'flex', alignItems: 'center'}}>
                                                            {getOwnerAvatar('referrer', formData.referrer)}
                                                            <Box sx={{ml: 2}}>
                                                                <Typography variant="subtitle1" fontWeight="medium">
                                                                    {formData.referrer?.fullName || formData.referrer?.name || 'Referrer'}
                                                                </Typography>
                                                                <Typography
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{display: 'flex', alignItems: 'center'}}
                                                                >
                                                                    <Business fontSize="small"
                                                                              sx={{mr: 0.5, color: 'secondary.light'}}/>
                                                                    Referrer
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Paper>
                                                )}
                                            </Box>
                                        </RadioGroup>
                                    </FormControl>
                                </AccordionDetails>
                            </Accordion>
                        )}

                        {/* Invoice Summary */}
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
                                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Typography variant="body2" color="text.secondary">
                                        Invoice ID
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        #{formData.id}
                                    </Typography>
                                </Box>

                                {formData.acceptance?.id && (
                                    <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                        <Typography variant="body2" color="text.secondary">
                                            Acceptance ID
                                        </Typography>
                                        <Typography variant="body2" fontWeight="medium">
                                            #{formData.acceptance.id}
                                        </Typography>
                                    </Box>
                                )}

                                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Typography variant="body2" color="text.secondary">
                                        Current Owner
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                        {formData.owner_type === 'patient'
                                            ? formData.patient?.fullName
                                            : formData.referrer?.fullName || formData.referrer?.name}
                                    </Typography>
                                </Box>

                                <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                    <Typography variant="body2" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Chip
                                        label={formData.status || 'Not Set'}
                                        color={getStatusColor(formData.status)}
                                        size="small"
                                        variant="outlined"
                                    />
                                </Box>
                            </Stack>
                        </Box>
                    </>
                )}
            </DialogContent>

            <Divider/>

            <DialogActions sx={{p: 2.5, backgroundColor: alpha(theme.palette.background.default, 0.5)}}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    disabled={processing}
                    variant="outlined"
                    startIcon={<Close/>}
                    sx={{borderRadius: 2}}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={processing}
                    startIcon={<Save/>}
                    endIcon={<ArrowForward/>}
                    sx={{borderRadius: 2, px: 3}}
                >
                    Update Invoice
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditInvoiceForm;
