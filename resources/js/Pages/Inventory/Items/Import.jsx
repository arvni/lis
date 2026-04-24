import {useState, useCallback, useMemo, memo} from "react";
import * as XLSX from "xlsx";
import {router, usePage} from "@inertiajs/react";
import {
    Alert, Box, Button, Card, CardContent, CardHeader, Chip,
    CircularProgress, IconButton, List, ListItem, Paper, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

// ─── Column definitions ───────────────────────────────────────────────────────
const COLS = [
    {key: "name",                  label: "Name",         type: "text",   required: true, w: 180},
    {key: "department",            label: "Dept",         type: "select", optKey: "department",        w: 85},
    {key: "material_type",         label: "Type",         type: "select", optKey: "material_type",     w: 85},
    {key: "storage_condition",     label: "Storage",      type: "select", optKey: "storage_condition", w: 155},
    {key: "default_unit",          label: "Unit",         type: "select", optKey: "unit", required: true, w: 120},
    {key: "minimum_stock_level",   label: "Min Stock",    type: "number", w: 90},
    {key: "maximum_stock_level",   label: "Max Stock",    type: "number", w: 90},
    {key: "lead_time_days",        label: "Lead (d)",     type: "number", w: 75},
    {key: "is_hazardous",          label: "Hazardous",    type: "select", optKey: "yesno",   w: 82},
    {key: "requires_lot_tracking", label: "Lot Track",    type: "select", optKey: "yesno_r", w: 82},
    {key: "scientific_name",       label: "Sci. Name",    type: "text",   w: 150},
    {key: "notes",                 label: "Notes",        type: "text",   w: 150},
    {key: "extra_unit_1",          label: "Extra Unit 1", type: "select", optKey: "unitOpt", w: 120},
    {key: "conversion_1",          label: "Conv. 1",      type: "number", w: 75},
    {key: "extra_unit_2",          label: "Extra Unit 2", type: "select", optKey: "unitOpt", w: 120},
    {key: "conversion_2",          label: "Conv. 2",      type: "number", w: 75},
];

const EMPTY_ROW = () => ({
    name: "", scientific_name: "", department: "LAB", material_type: "OTH",
    storage_condition: "ROOM_TEMP", default_unit: "", minimum_stock_level: "",
    maximum_stock_level: "", lead_time_days: "", is_hazardous: "no",
    requires_lot_tracking: "yes", notes: "", extra_unit_1: "", conversion_1: "",
    extra_unit_2: "", conversion_2: "",
});

// ─── Lightweight cell inputs ──────────────────────────────────────────────────
const BASE_STYLE = {
    width: "100%", border: "1px solid transparent", borderRadius: 4,
    padding: "3px 6px", fontSize: "0.8rem", background: "transparent",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

const CellInput = memo(({value, onChange, type = "text", highlight}) => (
    <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        style={{...BASE_STYLE, ...(highlight ? {border: "1px solid #d32f2f"} : {})}}
        onFocus={e  => (e.target.style.border = "1px solid #1976d2")}
        onBlur={e   => (e.target.style.border = highlight ? "1px solid #d32f2f" : "1px solid transparent")}
    />
));

const CellSelect = memo(({value, onChange, options, allowEmpty}) => (
    <select
        value={value ?? ""}
        onChange={onChange}
        style={{...BASE_STYLE, cursor: "pointer"}}
        onFocus={e => (e.target.style.border = "1px solid #1976d2")}
        onBlur={e  => (e.target.style.border = "1px solid transparent")}
    >
        {allowEmpty && <option value="">—</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
));

// ─── Memoized row ─────────────────────────────────────────────────────────────
const Row = memo(({row, idx, opts, onUpdate, onDelete}) => {
    const missingName = !String(row.name ?? "").trim();
    return (
        <TableRow sx={{bgcolor: missingName ? "rgba(211,47,47,0.07)" : undefined}}>
            <TableCell sx={{px: 0.5, py: 0.25}}>
                <IconButton size="small" tabIndex={-1} onClick={() => onDelete(idx)}>
                    <DeleteIcon sx={{fontSize: 15, color: "error.light"}}/>
                </IconButton>
            </TableCell>
            <TableCell sx={{color: "text.disabled", fontSize: "0.75rem", px: 0.5, py: 0.25, textAlign: "right", minWidth: 28}}>
                {idx + 1}
            </TableCell>
            {COLS.map(col => (
                <TableCell key={col.key} sx={{px: 0.5, py: 0.25, minWidth: col.w}}>
                    {col.type === "select" ? (
                        <CellSelect
                            value={row[col.key]}
                            onChange={e => onUpdate(idx, col.key, e.target.value)}
                            options={opts[col.optKey] ?? []}
                            allowEmpty={!col.required}
                        />
                    ) : (
                        <CellInput
                            type={col.type}
                            value={row[col.key]}
                            onChange={e => onUpdate(idx, col.key, e.target.value)}
                            highlight={col.required && missingName}
                        />
                    )}
                </TableCell>
            ))}
        </TableRow>
    );
});

// ─── Main component ───────────────────────────────────────────────────────────
const ItemImport = () => {
    const {
        status, success, import_errors,
        departments = [], materialTypes = [], storageConditions = [], units = [],
    } = usePage().props;

    const [rows,       setRows]       = useState([]);
    const [file,       setFile]       = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errors,     setErrors]     = useState({});
    const [parsing,    setParsing]    = useState(false);

    // Stable select-option lists passed to every Row
    const opts = useMemo(() => ({
        department:        departments.map(d => d.value),
        material_type:     materialTypes.map(m => m.value),
        storage_condition: storageConditions.map(s => s.value),
        unit:              units,
        unitOpt:           units,
        yesno:             ["no", "yes"],
        yesno_r:           ["yes", "no"],
    }), [departments, materialTypes, storageConditions, units]);

    // Parse selected file into rows
    const parseFile = useCallback((selected) => {
        if (!selected) return;
        setParsing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb    = XLSX.read(e.target.result, {type: "array"});
                const sheet = wb.SheetNames.includes("Items") ? "Items" : wb.SheetNames[0];
                const raw   = XLSX.utils.sheet_to_json(wb.Sheets[sheet], {defval: ""});
                const mapped = raw
                    .filter(r => Object.values(r).some(v => String(v).trim()))
                    .map(r => {
                        const base = EMPTY_ROW();
                        for (const [k, v] of Object.entries(r)) {
                            const key = k.toLowerCase().replace(/\s+/g, "_");
                            if (key in base) base[key] = String(v);
                        }
                        return base;
                    });
                setRows(mapped);
            } catch {
                setRows([]);
            }
            setParsing(false);
        };
        reader.readAsArrayBuffer(selected);
    }, []);

    const handleFileChange = (e) => {
        const selected = e.target.files[0] ?? null;
        setFile(selected);
        if (selected) parseFile(selected);
    };

    const addRow = useCallback(() => setRows(prev => [...prev, EMPTY_ROW()]), []);

    const updateCell = useCallback((idx, key, value) => {
        setRows(prev => prev.map((r, i) => i === idx ? {...r, [key]: value} : r));
    }, []);

    const deleteRow = useCallback((idx) => {
        setRows(prev => prev.filter((_, i) => i !== idx));
    }, []);

    const handleSubmit = () => {
        const validRows = rows.filter(r => String(r.name ?? "").trim());
        if (!validRows.length) return;
        setSubmitting(true);
        router.post(route("inventory.items.import.rows"), {rows: validRows}, {
            onError:  (errs) => { setErrors(errs); setSubmitting(false); },
            onFinish: () => setSubmitting(false),
        });
    };

    const validCount   = rows.filter(r => String(r.name ?? "").trim()).length;
    const invalidCount = rows.length - validCount;

    return (
        <>
            <PageHeader
                title="Bulk Import Items"
                actions={
                    <Button
                        startIcon={<DownloadIcon/>}
                        variant="outlined"
                        size="small"
                        component="a"
                        href={route("inventory.items.import.template")}
                        download
                    >
                        Download Template
                    </Button>
                }
            />

            {status && (
                <Alert severity={success ? "success" : "warning"} sx={{mb: 2}}>
                    {status}
                </Alert>
            )}

            {import_errors?.length > 0 && (
                <Alert severity="error" sx={{mb: 2}}>
                    <Typography variant="subtitle2" gutterBottom>Row errors:</Typography>
                    <List dense disablePadding>
                        {import_errors.map((e, i) => (
                            <ListItem key={i} disableGutters sx={{py: 0}}>
                                <Typography variant="caption">{e}</Typography>
                            </ListItem>
                        ))}
                    </List>
                </Alert>
            )}

            {/* ── File picker ── */}
            <Card sx={{maxWidth: 600, mb: 2}}>
                <CardHeader
                    title="Load from file (optional)"
                    subheader="Select an Excel or CSV file to pre-fill the table, then edit before importing."
                    titleTypographyProps={{variant: "subtitle1"}}
                    subheaderTypographyProps={{variant: "caption"}}
                    sx={{pb: 0}}
                />
                <CardContent>
                    <Box sx={{display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap"}}>
                        <Button component="label" variant="outlined" size="small" startIcon={<UploadFileIcon/>}>
                            {file ? file.name : "Choose File (.xlsx / .xlsm / .csv)"}
                            <input type="file" hidden accept=".xlsx,.xlsm,.xls,.csv" onChange={handleFileChange}/>
                        </Button>
                        {parsing && <CircularProgress size={18}/>}
                        {rows.length > 0 && !parsing && (
                            <>
                                <Chip icon={<CheckCircleIcon/>} label={`${validCount} valid`} color="success" size="small" variant="outlined"/>
                                {invalidCount > 0 && (
                                    <Chip icon={<ErrorIcon/>} label={`${invalidCount} missing name`} color="error" size="small" variant="outlined"/>
                                )}
                            </>
                        )}
                    </Box>
                </CardContent>
            </Card>

            {/* ── Action bar ── */}
            <Box sx={{display: "flex", gap: 1.5, alignItems: "center", mb: 1.5, flexWrap: "wrap"}}>
                <Button size="small" startIcon={<AddIcon/>} variant="outlined" onClick={addRow}>
                    Add Row
                </Button>
                <Box sx={{flex: 1}}/>
                {errors.rows && (
                    <Typography variant="caption" color="error">{errors.rows}</Typography>
                )}
                <Button size="small" variant="text" onClick={() => router.visit(route("inventory.items.index"))}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    disabled={validCount === 0 || submitting}
                    startIcon={submitting ? <CircularProgress size={14}/> : <UploadFileIcon/>}
                    onClick={handleSubmit}
                >
                    {submitting ? "Importing…" : `Import ${validCount || ""} Item${validCount !== 1 ? "s" : ""}`}
                </Button>
            </Box>

            {/* ── Editable table ── */}
            <TableContainer component={Paper} sx={{maxHeight: "62vh"}}>
                <Table
                    size="small"
                    stickyHeader
                    sx={{"& td, & th": {borderRight: "1px solid", borderRightColor: "divider"}}}
                >
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{px: 0.5, py: 0.75, bgcolor: "background.paper", width: 36}}/>
                            <TableCell sx={{px: 0.5, py: 0.75, bgcolor: "background.paper", color: "text.disabled", fontSize: "0.75rem", width: 32}}>
                                #
                            </TableCell>
                            {COLS.map(col => (
                                <TableCell
                                    key={col.key}
                                    sx={{
                                        px: 0.5, py: 0.75, fontWeight: 700,
                                        whiteSpace: "nowrap", bgcolor: "background.paper",
                                        minWidth: col.w, fontSize: "0.8rem",
                                    }}
                                >
                                    {col.label}
                                    {col.required && <Box component="span" sx={{color: "error.main"}}> *</Box>}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={COLS.length + 2}
                                    sx={{textAlign: "center", py: 5, color: "text.disabled"}}
                                >
                                    No rows yet — load a file or click "Add Row"
                                </TableCell>
                            </TableRow>
                        ) : rows.map((row, idx) => (
                            <Row
                                key={idx}
                                row={row}
                                idx={idx}
                                opts={opts}
                                onUpdate={updateCell}
                                onDelete={deleteRow}
                            />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
};

const breadcrumbs = [
    {title: "Inventory", link: null},
    {title: "Items", link: route("inventory.items.index")},
    {title: "Bulk Import", link: null},
];

ItemImport.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default ItemImport;
