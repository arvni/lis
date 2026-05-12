import React, { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Paper,
    Radio,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import { Add, Cancel, ReceiptLong, Science } from "@mui/icons-material";
import SelectSearch from "@/Components/SelectSearch.jsx";

const SelectMethodForm = ({ method, open, onClose, onChange, onSubmit, errors }) => {
    const [test,    setTest]    = useState(null);
    const [loading, setLoading] = useState(false);

    // reset local state every time the dialog opens
    useEffect(() => {
        if (open) {
            setTest(null);
            onChange("method", null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleTestSelect = (e) => {
        const selected = e.target.value;
        onChange("method", null);
        setTest(null);
        if (!selected) return;

        setLoading(true);
        axios
            .get(route("api.tests.show", selected))
            .then(({ data }) => setTest(data.data))
            .finally(() => setLoading(false));
    };

    const handleMethodSelect = (methodTest) => {
        onChange("method", methodTest.method);
        onChange("test_name", test.fullName || test.name);
    };

    const activeMethodTests = test?.method_tests?.filter((m) => m.status) ?? [];
    const selectedId        = method?.id ?? null;

    const TypeIcon = test?.type === "TEST" ? Science : ReceiptLong;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Select Test for Panel</DialogTitle>

            <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 2.5 }}>
                {/* ── search ──────────────────────────────────────────── */}
                <SelectSearch
                    value={test}
                    label="Search test or service"
                    fullWidth
                    defaultData={{ type: ["TEST", "SERVICE"] }}
                    url={route("api.tests.list")}
                    onChange={handleTestSelect}
                    name="test"
                />

                {/* ── loading ─────────────────────────────────────────── */}
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                        <CircularProgress />
                    </Box>
                )}

                {/* ── no selection yet ────────────────────────────────── */}
                {!loading && !test && (
                    <Box sx={{ textAlign: "center", py: 4, color: "text.disabled" }}>
                        <Science sx={{ fontSize: 52, mb: 1 }} />
                        <Typography variant="body2">
                            Search for a test or service to add to this panel.
                        </Typography>
                    </Box>
                )}

                {/* ── test details + method picker ─────────────────────── */}
                {!loading && test && (
                    <>
                        {/* test info card */}
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                <TypeIcon color="primary" sx={{ mt: 0.25 }} />
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                        <Typography variant="subtitle1" fontWeight="medium" noWrap>
                                            {test.fullName}
                                        </Typography>
                                        <Chip label={test.code} size="small" variant="outlined" />
                                        <Chip
                                            label={test.type}
                                            size="small"
                                            color={test.type === "TEST" ? "primary" : "secondary"}
                                            variant="outlined"
                                        />
                                    </Box>

                                    {test.type === "TEST" && test.sampleTypes?.length > 0 && (
                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                                            Samples:{" "}
                                            {test.sampleTypes
                                                .map((s) => s.sampleType?.name || s.sample_type?.name)
                                                .filter(Boolean)
                                                .join(", ")}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Paper>

                        <Divider>
                            <Chip label="Select Method" size="small" />
                        </Divider>

                        {/* validation error */}
                        {errors?.method && (
                            <Alert severity="error">{errors.method}</Alert>
                        )}

                        {/* no active methods */}
                        {activeMethodTests.length === 0 && (
                            <Alert severity="warning">
                                This test has no active methods. Activate a method first.
                            </Alert>
                        )}

                        {/* method table */}
                        {activeMethodTests.length > 0 && (
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ "& th": { fontWeight: 600 } }}>
                                        <TableCell padding="checkbox" />
                                        <TableCell>Method</TableCell>
                                        {test.type === "TEST" && (
                                            <TableCell align="right">
                                                <Tooltip title="Turnaround time in days">
                                                    <span>TAT</span>
                                                </Tooltip>
                                            </TableCell>
                                        )}
                                        <TableCell align="right">Price</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {activeMethodTests.map((mt) => {
                                        const isSelected = selectedId === mt.method.id;
                                        const priceLabel =
                                            mt.method.price_type === "Fix"
                                                ? `${mt.method.price} OMR`
                                                : mt.method.price_type;

                                        return (
                                            <TableRow
                                                key={mt.method.id}
                                                hover
                                                selected={isSelected}
                                                onClick={() => handleMethodSelect(mt)}
                                                sx={{ cursor: "pointer" }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Radio
                                                        size="small"
                                                        checked={isSelected}
                                                        onChange={() => handleMethodSelect(mt)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </TableCell>
                                                <TableCell>{mt.method.name}</TableCell>
                                                {test.type === "TEST" && (
                                                    <TableCell align="right">
                                                        {mt.method.turnaround_time ?? "—"}
                                                    </TableCell>
                                                )}
                                                <TableCell align="right">{priceLabel}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} color="inherit" startIcon={<Cancel />}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={onSubmit}
                    disabled={!selectedId}
                    startIcon={<Add />}
                >
                    Add to Panel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SelectMethodForm;
