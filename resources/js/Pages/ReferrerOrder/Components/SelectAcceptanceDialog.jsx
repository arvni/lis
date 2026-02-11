import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Paper,
    Stack,
    Chip,
    CircularProgress,
    Alert,
    Avatar,
    Divider,
    List,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Radio,
} from "@mui/material";
import {
    Assignment,
    Science,
    CalendarToday,
    Add,
    CheckCircle,
} from "@mui/icons-material";
import axios from "axios";

const SelectAcceptanceDialog = ({
    open,
    onClose,
    patientId,
    referrerId,
    onSelectAcceptance,
    onCreateNew,
    poolingOnly = false,
}) => {
    const [loading, setLoading] = useState(false);
    const [acceptances, setAcceptances] = useState([]);
    const [selectedAcceptanceId, setSelectedAcceptanceId] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open && patientId && referrerId) {
            fetchAcceptances();
        }
    }, [open, patientId, referrerId]);

    const fetchAcceptances = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(
                route("api.referrer.patient.acceptances", patientId),
                { params: { referrer_id: referrerId, ...(poolingOnly ? { pooling_only: true } : {}) } }
            );
            setAcceptances(response.data.acceptances || []);
        } catch (err) {
            setError("Failed to load acceptances. Please try again.");
            console.error("Error fetching acceptances:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = () => {
        if (selectedAcceptanceId) {
            const selectedAcceptance = acceptances.find(
                (a) => a.id === selectedAcceptanceId
            );
            onSelectAcceptance(selectedAcceptance);
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedAcceptanceId(null);
        setError(null);
        onClose();
    };

    const handleCreateNew = () => {
        onCreateNew();
        handleClose();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "sampling":
                return "warning";
            case "processing":
                return "info";
            case "pooling":
                return "secondary";
            default:
                return "default";
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: "primary.main" }}>
                        <Assignment />
                    </Avatar>
                    <Box>
                        <Typography variant="h6">
                            Select Existing Acceptance
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Choose an acceptance to add new tests to, or create
                            a new one
                        </Typography>
                    </Box>
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                {loading && (
                    <Box
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        py={4}
                    >
                        <CircularProgress />
                    </Box>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {!loading && !error && acceptances.length === 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        No existing acceptances found for this patient and
                        referrer. You can create a new acceptance.
                    </Alert>
                )}

                {!loading && acceptances.length > 0 && (
                    <List sx={{ width: "100%" }}>
                        {acceptances.map((acceptance) => (
                            <Paper
                                key={acceptance.id}
                                elevation={
                                    selectedAcceptanceId === acceptance.id
                                        ? 4
                                        : 1
                                }
                                sx={{
                                    mb: 2,
                                    border: "2px solid",
                                    borderColor:
                                        selectedAcceptanceId === acceptance.id
                                            ? "primary.main"
                                            : "transparent",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                <ListItemButton
                                    onClick={() =>
                                        setSelectedAcceptanceId(acceptance.id)
                                    }
                                    selected={
                                        selectedAcceptanceId === acceptance.id
                                    }
                                    sx={{
                                        p: 2,
                                        "&.Mui-selected": {
                                            bgcolor: "primary.50",
                                        },
                                    }}
                                >
                                    <ListItemIcon>
                                        <Radio
                                            checked={
                                                selectedAcceptanceId ===
                                                acceptance.id
                                            }
                                            color="primary"
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={2}
                                            >
                                                <Typography
                                                    variant="subtitle1"
                                                    fontWeight={600}
                                                >
                                                    Acceptance #{acceptance.id}
                                                </Typography>
                                                <Chip
                                                    label={acceptance.status}
                                                    size="small"
                                                    color={getStatusColor(
                                                        acceptance.status
                                                    )}
                                                />
                                                {acceptance.referenceCode && (
                                                    <Chip
                                                        label={`Ref: ${acceptance.referenceCode}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </Stack>
                                        }
                                        secondary={
                                            <Box sx={{ mt: 1 }}>
                                                <Stack
                                                    direction="row"
                                                    alignItems="center"
                                                    spacing={1}
                                                    mb={1}
                                                >
                                                    <CalendarToday
                                                        fontSize="small"
                                                        color="action"
                                                    />
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        Created:{" "}
                                                        {acceptance.created_at}
                                                    </Typography>
                                                </Stack>

                                                {acceptance.acceptance_items
                                                    .length > 0 && (
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: 1,
                                                                mb: 1,
                                                            }}
                                                        >
                                                            <Science fontSize="small" />
                                                            Current Tests:
                                                        </Typography>
                                                        <Stack
                                                            direction="row"
                                                            spacing={0.5}
                                                            flexWrap="wrap"
                                                            gap={0.5}
                                                        >
                                                            {acceptance.acceptance_items.map(
                                                                (item) => (
                                                                    <Chip
                                                                        key={
                                                                            item.id
                                                                        }
                                                                        label={
                                                                            item.test_name
                                                                        }
                                                                        size="small"
                                                                        variant="outlined"
                                                                        color="primary"
                                                                    />
                                                                )
                                                            )}
                                                        </Stack>
                                                    </Box>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItemButton>
                            </Paper>
                        ))}
                    </List>
                )}

                <Divider sx={{ my: 2 }}>
                    <Chip label="OR" size="small" />
                </Divider>

                <Paper
                    elevation={1}
                    sx={{
                        p: 2,
                        border: "2px dashed",
                        borderColor: "grey.300",
                        bgcolor: "grey.50",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            borderColor: "primary.main",
                            bgcolor: "primary.50",
                        },
                    }}
                    onClick={handleCreateNew}
                >
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: "success.main" }}>
                            <Add />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                                Create New Acceptance
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Start a fresh acceptance for this order
                            </Typography>
                        </Box>
                    </Stack>
                </Paper>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSelect}
                    disabled={!selectedAcceptanceId}
                    startIcon={<CheckCircle />}
                >
                    Select Acceptance
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SelectAcceptanceDialog;
