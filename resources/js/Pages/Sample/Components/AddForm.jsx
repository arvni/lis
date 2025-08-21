import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Container,
    Stack,
    Button,
    Paper,
    Box,
    Chip,
    Divider,
    IconButton,
    Alert,
    Tooltip,
    CircularProgress,
    Fade,
    Collapse,
    Avatar,
    Badge
} from "@mui/material";
import {
    LocationOn,
    CalendarToday,
    Print,
    Close,
    Check,
    Science,
    Person,
    CheckCircle,
    Warning,
    ExpandMore,
    ExpandLess,
    Schedule,
    Biotech
} from "@mui/icons-material";

const AddForm = ({ open, onClose, defaultValue }) => {
    const { data, setData, post, reset, processing, errors } = useForm({
        barcodes: [],
        ...defaultValue
    });
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [expandedRows, setExpandedRows] = useState(new Set());

    useEffect(() => {
        if (defaultValue) {
            setData(defaultValue);
        }
    }, [defaultValue, setData]);

    // Get today's date in YYYY-MM-DD format for date inputs
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toISOString().slice(0, 16);

    // Validation logic
    const validation = useMemo(() => {
        const barcodes = data?.barcodes || [];
        const hasIncompleteDates = barcodes.some(barcode =>
            !barcode.collection_date || !barcode.received_at
        );
        const hasInvalidDates = barcodes.some(barcode => {
            if (!barcode.collection_date || !barcode.received_at) return false;
            return new Date(barcode.collection_date) > new Date(barcode.received_at);
        });

        return {
            isValid: !hasIncompleteDates && !hasInvalidDates,
            hasIncompleteDates,
            hasInvalidDates,
            totalSamples: barcodes.length,
            completedSamples: barcodes.filter(b => b.collection_date && b.received_at).length
        };
    }, [data?.barcodes]);

    const handleClose = useCallback(() => {
        setSubmitSuccess(false);
        setExpandedRows(new Set());
        onClose();
        reset();
    }, [onClose, reset]);

    const toggleRowExpansion = useCallback((index) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    }, []);

    const handleChange = useCallback((index) => (e) => {
        const { name, value } = e.target;
        const newBarcodes = [...(data?.barcodes || [])];

        // Auto-set received_at to collection_date if not set and collection_date is being updated
        if (name === 'collection_date' && value && !newBarcodes[index]?.received_at) {
            newBarcodes[index] = {
                ...newBarcodes[index],
                [name]: value,
                received_at: value
            };
        } else {
            newBarcodes[index] = {
                ...newBarcodes[index],
                [name]: value
            };
        }

        setData({ barcodes: newBarcodes });
    }, [data, setData]);

    const handleQuickFill = useCallback(() => {
        const newBarcodes = (data?.barcodes || []).map(barcode => ({
            ...barcode,
            collection_date: barcode.collection_date || now,
            received_at: barcode.received_at || now,
            sampleLocation: barcode.sampleLocation || "In Lab"
        }));
        setData({ barcodes: newBarcodes });
    }, [data, setData, now]);

    const handleSubmit = useCallback(() => {
        const acceptanceId = data?.barcodes[0]?.items[0].acceptance_id;
        post(route("samples.store"), {
            onSuccess: () => {
                setSubmitSuccess(true);
                setTimeout(() => {
                    window.open(
                        route("acceptances.barcodes", acceptanceId),
                        "_blank"
                    );
                    handleClose();
                }, 1000);
            }
        });
    }, [data, post, handleClose]);

    const getSampleStatusColor = useCallback((barcode) => {
        if (!barcode.collection_date || !barcode.received_at) return 'error';
        if (new Date(barcode.collection_date) > new Date(barcode.received_at)) return 'warning';
        return 'success';
    }, []);

    return (
        <Dialog
            open={open}
            onClose={processing ? undefined : handleClose}
            fullWidth
            maxWidth="lg"
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.12)",
                    maxHeight: '90vh'
                }
            }}
        >
            <DialogTitle
                sx={{
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 2.5,
                    px: 3
                }}
            >
                <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: "primary.light", mr: 2 }}>
                        <Science />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" fontWeight={600}>
                            Sample Collection
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                            Record collection details and print barcodes
                        </Typography>
                    </Box>
                </Box>
                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleClose}
                    disabled={processing}
                    aria-label="close"
                    size="large"
                    sx={{ ml: 2 }}
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
                {submitSuccess && (
                    <Fade in={submitSuccess}>
                        <Alert
                            icon={<CheckCircle />}
                            severity="success"
                            sx={{
                                m: 3,
                                fontWeight: 500,
                                borderRadius: 2,
                                fontSize: '1rem'
                            }}
                        >
                            Collection successfully recorded! Opening barcode print page...
                        </Alert>
                    </Fade>
                )}

                {/* Progress Summary */}
                {data?.barcodes?.length > 0 && (
                    <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                        <Paper
                            elevation={0}
                            variant="outlined"
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                bgcolor: validation.isValid ? 'success.50' : 'warning.50'
                            }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box display="flex" alignItems="center">
                                    <Badge
                                        badgeContent={validation.totalSamples}
                                        color="primary"
                                        sx={{ mr: 2 }}
                                    >
                                        <Biotech color={validation.isValid ? 'success' : 'warning'} />
                                    </Badge>
                                    <Box>
                                        <Typography variant="h6" fontWeight={600}>
                                            {validation.completedSamples} of {validation.totalSamples} samples completed
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {validation.isValid ? 'Ready for collection' : 'Some fields need attention'}
                                        </Typography>
                                    </Box>
                                </Box>
                                {!validation.isValid && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={handleQuickFill}
                                        startIcon={<Schedule />}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        Quick Fill
                                    </Button>
                                )}
                            </Box>
                        </Paper>
                    </Box>
                )}

                <Container sx={{ px: 3, pb: 3 }}>
                    {data?.barcodes?.length > 0 ? (
                        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                            <TableContainer sx={{ maxHeight: '60vh' }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "grey.100" }}>
                                            <TableCell sx={{ width: "40px" }} />
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: "bold", py: 2.5, width: "15%" }}
                                            >
                                                Barcode
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: "bold", py: 2.5, width: "20%" }}
                                            >
                                                Patient
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: "bold", py: 2.5, width: "25%" }}
                                            >
                                                Tests
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: "bold", py: 2.5, width: "20%" }}
                                            >
                                                Sample Type
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: "bold", py: 2.5, width: "20%" }}
                                            >
                                                Status
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data?.barcodes?.map((barcode, index) => (
                                            <React.Fragment key={`barcode-${index}`}>
                                                <TableRow
                                                    sx={{
                                                        "&:hover": { bgcolor: "action.hover" },
                                                        "& td": { borderColor: "divider" },
                                                        cursor: "pointer"
                                                    }}
                                                    onClick={() => toggleRowExpansion(index)}
                                                >
                                                    <TableCell>
                                                        <IconButton size="small">
                                                            {expandedRows.has(index) ? <ExpandLess /> : <ExpandMore />}
                                                        </IconButton>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={barcode.barcodeGroup?.name || `BC-${index + 1}`}
                                                            color="primary"
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{ fontWeight: 600, minWidth: 80 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" justifyContent="center">
                                                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.light' }}>
                                                                <Person fontSize="small" />
                                                            </Avatar>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                {barcode.patient?.fullName || "Unknown Patient"}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Typography variant="body2" fontWeight={500} color="primary">
                                                            {barcode.items?.length || 0} test{barcode.items?.length !== 1 ? 's' : ''}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            size="small"
                                                            icon={<Science fontSize="small" />}
                                                            label={barcode?.sampleType?.name || "Unknown"}
                                                            variant="filled"
                                                            sx={{
                                                                bgcolor: "info.100",
                                                                color: "info.dark",
                                                                fontWeight: 500
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            size="small"
                                                            color={getSampleStatusColor(barcode)}
                                                            icon={getSampleStatusColor(barcode) === 'error' ? <Warning fontSize="small" /> : <CheckCircle fontSize="small" />}
                                                            label={
                                                                !barcode.collection_date || !barcode.received_at
                                                                    ? 'Incomplete'
                                                                    : new Date(barcode.collection_date) > new Date(barcode.received_at)
                                                                        ? 'Invalid dates'
                                                                        : 'Ready'
                                                            }
                                                            variant="filled"
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
                                                        <Collapse in={expandedRows.has(index)} timeout="auto">
                                                            <Box sx={{ p: 3, bgcolor: 'grey.50' }}>
                                                                <Stack spacing={3}>
                                                                    {/* Tests Detail */}
                                                                    <Box>
                                                                        <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                                                                            <Science sx={{ mr: 1 }} fontSize="small" />
                                                                            Requested Tests
                                                                        </Typography>
                                                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                                            {barcode.items?.map((item, itemIndex) => (
                                                                                <Chip
                                                                                    key={itemIndex}
                                                                                    size="small"
                                                                                    variant="outlined"
                                                                                    sx={{
                                                                                        bgcolor: "background.paper",
                                                                                        fontWeight: 500,
                                                                                        mb: 1
                                                                                    }}
                                                                                    label={
                                                                                        <>
                                                                                            <Typography component="span" fontWeight={600} variant="caption">
                                                                                                {item.test?.name || "Unknown Test"}
                                                                                            </Typography>
                                                                                            {item.method?.name && (
                                                                                                <Typography component="span" variant="caption" color="text.secondary">
                                                                                                    {" • "}{item.method.name}
                                                                                                </Typography>
                                                                                            )}
                                                                                        </>
                                                                                    }
                                                                                />
                                                                            )) || (
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    No tests specified
                                                                                </Typography>
                                                                            )}
                                                                        </Stack>
                                                                    </Box>

                                                                    <Divider />

                                                                    {/* Collection Details Form */}
                                                                    <Box>
                                                                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                                                                            Collection Details
                                                                        </Typography>
                                                                        <Stack spacing={2.5} direction={{ xs: 'column', md: 'row' }}>
                                                                            <TextField
                                                                                onChange={handleChange(index)}
                                                                                variant="outlined"
                                                                                size="small"
                                                                                fullWidth
                                                                                name="sampleLocation"
                                                                                value={barcode.sampleLocation || ""}
                                                                                label="Sampling Location"
                                                                                placeholder="e.g., In Lab, Patient Room"
                                                                                slotProps={{
                                                                                    input: {
                                                                                        startAdornment: <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                                                    }
                                                                                }}
                                                                                sx={{
                                                                                    "& .MuiOutlinedInput-root": {
                                                                                        borderRadius: 2,
                                                                                        bgcolor: "background.paper"
                                                                                    }
                                                                                }}
                                                                            />

                                                                            <TextField
                                                                                onChange={handleChange(index)}
                                                                                variant="outlined"
                                                                                size="small"
                                                                                fullWidth
                                                                                name="collection_date"
                                                                                type="datetime-local"
                                                                                label="Collection Date & Time"
                                                                                slotProps={{
                                                                                    htmlInput: { max: now },
                                                                                    inputLabel: { shrink: true }
                                                                                }}
                                                                                value={barcode.collection_date || ""}
                                                                                error={!barcode.collection_date}
                                                                                helperText={!barcode.collection_date ? "Required field" : ""}
                                                                                sx={{
                                                                                    "& .MuiOutlinedInput-root": {
                                                                                        borderRadius: 2,
                                                                                        bgcolor: "background.paper"
                                                                                    }
                                                                                }}
                                                                            />

                                                                            <TextField
                                                                                onChange={handleChange(index)}
                                                                                variant="outlined"
                                                                                size="small"
                                                                                fullWidth
                                                                                name="received_at"
                                                                                type="datetime-local"
                                                                                label="Received Date & Time"
                                                                                slotProps={{
                                                                                    htmlInput: {
                                                                                        max: now,
                                                                                        min: barcode.collection_date || undefined
                                                                                    },
                                                                                    inputLabel: { shrink: true }
                                                                                }}
                                                                                value={barcode.received_at || ""}
                                                                                error={!barcode.received_at || (barcode.collection_date && new Date(barcode.collection_date) > new Date(barcode.received_at))}
                                                                                helperText={
                                                                                    !barcode.received_at
                                                                                        ? "Required field"
                                                                                        : barcode.collection_date && new Date(barcode.collection_date) > new Date(barcode.received_at)
                                                                                            ? "Must be after collection date"
                                                                                            : ""
                                                                                }
                                                                                sx={{
                                                                                    "& .MuiOutlinedInput-root": {
                                                                                        borderRadius: 2,
                                                                                        bgcolor: "background.paper"
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </Stack>
                                                                    </Box>
                                                                </Stack>
                                                            </Box>
                                                        </Collapse>
                                                    </TableCell>
                                                </TableRow>
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    ) : (
                        <Alert
                            severity="info"
                            sx={{
                                mt: 3,
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                py: 4
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                No barcode data available
                            </Typography>
                        </Alert>
                    )}
                </Container>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                        {validation.totalSamples > 0 && (
                            <>Progress: {validation.completedSamples}/{validation.totalSamples} samples</>
                        )}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <Button
                            onClick={handleClose}
                            color="inherit"
                            disabled={processing}
                            startIcon={<Close />}
                            sx={{ borderRadius: 2, px: 3 }}
                        >
                            Cancel
                        </Button>
                        <Tooltip title={
                            validation.totalSamples === 0
                                ? "No samples to collect"
                                : !validation.isValid
                                    ? "Please complete all required fields"
                                    : "Collect samples and print barcodes"
                        }>
                            <span>
                                <Button
                                    onClick={handleSubmit}
                                    variant="contained"
                                    color="primary"
                                    disabled={validation.totalSamples === 0 || !validation.isValid || processing}
                                    startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <Check />}
                                    endIcon={!processing && <Print />}
                                    sx={{
                                        borderRadius: 2,
                                        px: 4,
                                        py: 1,
                                        fontWeight: 600,
                                        boxShadow: 2
                                    }}
                                >
                                    {processing ? "Processing..." : "Collect & Print Barcodes"}
                                </Button>
                            </span>
                        </Tooltip>
                    </Stack>
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default AddForm;
