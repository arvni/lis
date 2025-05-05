import React, { useCallback, useEffect, useState } from "react";
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
    Fade
} from "@mui/material";
import {
    LocationOn,
    CalendarToday,
    Print,
    Close,
    Check,
    Science,
    Person,
    CheckCircle
} from "@mui/icons-material";

const AddForm = ({ open, onClose, defaultValue }) => {
    const { data, setData, post, reset, processing, errors } = useForm({
        barcodes: [],
        ...defaultValue
    });
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        if (defaultValue) {
            setData(defaultValue);
        }
    }, [defaultValue, setData]);

    // Get today's date in YYYY-MM-DD format for date inputs
    const today = new Date().toISOString().split("T")[0];

    const handleClose = useCallback(() => {
        setSubmitSuccess(false);
        onClose();
        reset();
    }, [onClose, reset]);

    const handleChange = (index) => (e) => {
        const newBarcodes = [...(data?.barcodes || [])];
        newBarcodes[index] = {
            ...newBarcodes[index],
            [e.target.name]: e.target.value
        };

        setData({ barcodes: newBarcodes });
    };

    const handleSubmit = useCallback(() => {
        const acceptanceId=data?.barcodes[0]?.items[0].acceptance_id;
        post(route("samples.store"), {
            onSuccess: () => {
                setSubmitSuccess(true);
                setTimeout(() => {
                    window.open(
                        route("acceptances.barcodes", acceptanceId),
                        "_blank"
                    );
                    handleClose();
                }, 500);
            }
        });
    }, [data, post, handleClose]);

    return (
        <Dialog
            open={open}
            onClose={processing ? undefined : handleClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)"
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
                    py: 2
                }}
            >
                <Box display="flex" alignItems="center">
                    <Science sx={{ mr: 1.5 }} />
                    <Typography variant="h6">Sample Collection</Typography>
                </Box>
                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={handleClose}
                    disabled={processing}
                    aria-label="close"
                    size="small"
                >
                    <Close />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3, mt: 1 }}>
                <Container>
                    {submitSuccess && (
                        <Fade in={submitSuccess}>
                            <Alert
                                icon={<CheckCircle />}
                                severity="success"
                                sx={{ mb: 3, fontWeight: 500 }}
                            >
                                Collection successfully recorded! Opening barcode print page...
                            </Alert>
                        </Fade>
                    )}

                    {data?.barcodes?.length > 0 ? (
                        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: "grey.100" }}>
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: "bold", py: 2, width: "20%" }}
                                            >
                                                Barcode Group
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: "bold", py: 2, width: "20%" }}
                                            >
                                                Patient
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: "bold", py: 2, width: "25%" }}
                                            >
                                                Test
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{ fontWeight: "bold", py: 2, width: "35%" }}
                                            >
                                                Sample Details
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data?.barcodes?.map((barcode, index) => (
                                            <TableRow
                                                key={`barcode-${index}`}
                                                sx={{
                                                    "&:hover": { bgcolor: "action.hover" },
                                                    "& td": { borderColor: "divider" }
                                                }}
                                            >
                                                <TableCell align="center">
                                                    <Chip
                                                        label={barcode.barcodeGroup?.name || "N/A"}
                                                        color="primary"
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ fontWeight: 500 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" alignItems="center" justifyContent="center">
                                                        <Person fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {barcode.patient?.fullName || "N/A"}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack spacing={1} alignItems="center">
                                                        {barcode.items.map((item, itemIndex) => (
                                                            <Chip
                                                                key={itemIndex}
                                                                size="small"
                                                                variant="filled"
                                                                sx={{
                                                                    bgcolor: "info.50",
                                                                    color: "info.main",
                                                                    fontWeight: 500,
                                                                    fontSize: "0.75rem",
                                                                    height: "auto",
                                                                    "& .MuiChip-label": { px: 1, py: 0.5 }
                                                                }}
                                                                label={
                                                                    <>
                                                                        <Typography component="span" fontWeight={600} variant="caption">
                                                                            {item.test?.name || "N/A"}
                                                                        </Typography>
                                                                        <Typography component="span" variant="caption" color="text.secondary">
                                                                            {" › "}{item.method?.name || "N/A"}
                                                                        </Typography>
                                                                    </>
                                                                }
                                                            />
                                                        ))}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell>
                                                    <Paper
                                                        elevation={0}
                                                        sx={{
                                                            p: 2,
                                                            bgcolor: "grey.50",
                                                            borderRadius: 1.5
                                                        }}
                                                    >
                                                        <Stack spacing={2}>
                                                            <Box display="flex" alignItems="center">
                                                                <Science fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                                                                <Typography variant="body2" fontWeight={500}>
                                                                    {barcode?.sampleType?.name || "N/A"}
                                                                </Typography>
                                                            </Box>

                                                            <Divider sx={{ my: 0.5 }} />

                                                            <TextField
                                                                onChange={handleChange(index)}
                                                                variant="outlined"
                                                                size="small"
                                                                fullWidth
                                                                name="sampleLocation"
                                                                value={barcode.sampleLocation || "In Lab"}
                                                                label="Sampling Place"
                                                                InputProps={{
                                                                    startAdornment: <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                                }}
                                                                sx={{
                                                                    "& .MuiOutlinedInput-root": {
                                                                        borderRadius: 1.5,
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
                                                                label="Collection Date"
                                                                slotProps={{
                                                                    htmlInput: { max: today },
                                                                    inputLabel: { shrink: true },
                                                                    startAdornment: <CalendarToday fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                                                }}
                                                                value={barcode.collection_date}
                                                                error={!barcode.collection_date}
                                                                helperText={!barcode.collection_date ? "Please set collection date" : ""}
                                                                sx={{
                                                                    "& .MuiOutlinedInput-root": {
                                                                        borderRadius: 1.5,
                                                                        bgcolor: "background.paper"
                                                                    }
                                                                }}
                                                            />
                                                        </Stack>
                                                    </Paper>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    ) : (
                        <Alert
                            severity="info"
                            sx={{
                                mt: 2,
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                            }}
                        >
                            <Typography variant="body1" sx={{ py: 2 }}>
                                No barcode data available
                            </Typography>
                        </Alert>
                    )}
                </Container>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                <Button
                    onClick={handleClose}
                    color="inherit"
                    disabled={processing}
                    startIcon={<Close />}
                    sx={{ borderRadius: 2 }}
                >
                    Cancel
                </Button>
                <Tooltip title={data?.barcodes?.length === 0 ? "No samples to collect" : ""}>
          <span>
            <Button
                onClick={handleSubmit}
                variant="contained"
                color="primary"
                disabled={data?.barcodes?.length === 0 || processing}
                startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <Check />}
                endIcon={<Print />}
                sx={{
                    borderRadius: 2,
                    px: 3,
                    fontWeight: 600
                }}
            >
              {processing ? "Processing..." : "Collect & Print"}
            </Button>
          </span>
                </Tooltip>
            </DialogActions>
        </Dialog>
    );
};

export default AddForm;
