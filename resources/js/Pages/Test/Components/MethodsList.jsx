import React, { useState } from "react";
import {
    Box,
    Button,
    Chip,
    IconButton,
    InputAdornment,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import { Add, Delete, Edit, Search } from "@mui/icons-material";

// ── helpers ────────────────────────────────────────────────────────────────────

function priceLabel(priceType, price) {
    if (!priceType || priceType === "Fix") {
        return price ? `${Number(price).toFixed(3)} OMR` : "—";
    }
    return priceType; // "Formulate" | "Conditional"
}

// ── component ──────────────────────────────────────────────────────────────────

const MethodsList = ({
    methodTests = [],
    type        = "TEST",
    onStatusChange,
    onEdit,
    onDelete,
    onAdd,
}) => {
    const [search,      setSearch]      = useState("");
    const [page,        setPage]        = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // ── filter ─────────────────────────────────────────────────────────
    const q = search.trim().toLowerCase();
    const filtered = !q
        ? methodTests
        : methodTests.filter(({ method, test_name }) => {
              const name = method?.name?.toLowerCase() ?? "";
              const tn   = test_name?.toLowerCase() ?? "";
              const wf   = method?.workflow?.name?.toLowerCase() ?? "";
              return name.includes(q) || tn.includes(q) || wf.includes(q);
          });

    const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const handleSearch = (e) => { setSearch(e.target.value); setPage(0); };

    // ── empty state ────────────────────────────────────────────────────
    if (methodTests.length === 0) {
        return (
            <Box
                sx={{
                    py: 6, textAlign: "center",
                    border: "2px dashed", borderColor: "divider", borderRadius: 2,
                }}
            >
                <Typography variant="body1" color="text.secondary" gutterBottom>
                    {type === "PANEL"
                        ? "No tests added to this panel yet."
                        : "No methods added yet."}
                </Typography>
                <Button variant="contained" size="small" startIcon={<Add />} onClick={onAdd} sx={{ mt: 1 }}>
                    {type === "PANEL" ? "Add Test" : "Add Method"}
                </Button>
            </Box>
        );
    }

    // ── column definitions (vary by type) ──────────────────────────────
    const cols = [];
    if (type === "PANEL") cols.push({ label: "Test",         key: "test" });
    cols.push({ label: "Method Name", key: "name" });
    if (type === "TEST") {
        cols.push({ label: "Workflow",       key: "workflow" });
        cols.push({ label: "Barcode Group",  key: "barcode" });
        cols.push({ label: "TAT (days)",     key: "tat",    align: "right" });
    }
    if (type !== "PANEL") {
        cols.push({ label: "Price",          key: "price",  align: "right" });
        cols.push({ label: "Referral Price", key: "rprice", align: "right" });
    }
    cols.push({ label: "Used in",   key: "used",   align: "right" });
    cols.push({ label: "Status",    key: "status", align: "center" });
    cols.push({ label: "",          key: "actions", align: "right" });

    return (
        <Box>
            {/* toolbar */}
            <Box sx={{ mb: 1.5, display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                    size="small"
                    placeholder="Search…"
                    value={search}
                    onChange={handleSearch}
                    sx={{ flexGrow: 1, maxWidth: 300 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Box>

            {/* table */}
            <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: "action.hover" }}>
                            {cols.map((c) => (
                                <TableCell key={c.key} align={c.align ?? "left"} sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                                    {c.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {paged.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={cols.length} align="center" sx={{ py: 3, color: "text.secondary" }}>
                                    No results for "{search}"
                                </TableCell>
                            </TableRow>
                        ) : paged.map(({ id, method, status, acceptance_items_count, test_name }) => (
                            <TableRow key={id} hover>
                                {/* PANEL: source test name */}
                                {type === "PANEL" && (
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                                            {test_name || "—"}
                                        </Typography>
                                    </TableCell>
                                )}

                                {/* method name */}
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                                        {method?.name || "—"}
                                    </Typography>
                                </TableCell>

                                {/* TEST-specific */}
                                {type === "TEST" && (
                                    <>
                                        <TableCell>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                                                {method?.workflow?.name || "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>
                                                {method?.barcode_group?.name || "—"}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            {method?.turnaround_time
                                                ? <Chip label={`${method.turnaround_time}d`} size="small" variant="outlined" />
                                                : "—"}
                                        </TableCell>
                                    </>
                                )}

                                {/* pricing (TEST + SERVICE) */}
                                {type !== "PANEL" && (
                                    <>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontFamily="monospace">
                                                {priceLabel(method?.price_type, method?.price)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontFamily="monospace">
                                                {priceLabel(method?.referrer_price_type, method?.referrer_price)}
                                            </Typography>
                                        </TableCell>
                                    </>
                                )}

                                {/* acceptance count */}
                                <TableCell align="right">
                                    {acceptance_items_count
                                        ? <Chip label={acceptance_items_count} size="small" />
                                        : <Typography variant="body2" color="text.disabled">—</Typography>}
                                </TableCell>

                                {/* status */}
                                <TableCell align="center">
                                    <Tooltip title={status ? "Active — click to deactivate" : "Inactive — click to activate"}>
                                        <Switch
                                            checked={Boolean(status)}
                                            onChange={onStatusChange(id)}
                                            color="success"
                                            size="small"
                                        />
                                    </Tooltip>
                                </TableCell>

                                {/* actions */}
                                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                                    <Tooltip title="Edit">
                                        <IconButton size="small" onClick={() => onEdit(id)}>
                                            <Edit fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    {!acceptance_items_count && (
                                        <Tooltip title="Delete">
                                            <IconButton size="small" color="error" onClick={() => onDelete(id)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* pagination */}
            {filtered.length > rowsPerPage && (
                <TablePagination
                    component="div"
                    count={filtered.length}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[5, 10, 25]}
                    onPageChange={(_, p) => setPage(p)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                />
            )}
        </Box>
    );
};

export default MethodsList;
