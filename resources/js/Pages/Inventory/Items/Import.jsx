import {useState, useCallback} from "react";
import * as XLSX from "xlsx";
import {router, usePage} from "@inertiajs/react";
import {
    Alert, Box, Button, Card, CardContent, CardHeader, Chip,
    CircularProgress, List, ListItem, Paper, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const PREVIEW_COLS = [
    {key: "name",                  label: "Name",         required: true},
    {key: "department",            label: "Dept"},
    {key: "material_type",         label: "Type"},
    {key: "storage_condition",     label: "Storage"},
    {key: "default_unit",          label: "Unit"},
    {key: "minimum_stock_level",   label: "Min Stock"},
    {key: "maximum_stock_level",   label: "Max Stock"},
    {key: "lead_time_days",        label: "Lead (d)"},
    {key: "is_hazardous",          label: "Hazardous"},
    {key: "requires_lot_tracking", label: "Lot Track"},
    {key: "scientific_name",       label: "Sci. Name"},
    {key: "extra_unit_1",          label: "Extra Unit 1"},
    {key: "conversion_1",          label: "Conv. 1"},
    {key: "extra_unit_2",          label: "Extra Unit 2"},
    {key: "conversion_2",          label: "Conv. 2"},
    {key: "notes",                 label: "Notes"},
];

const ItemImport = () => {
    const {status, success, import_errors} = usePage().props;
    const [file,       setFile]       = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [errors,     setErrors]     = useState({});
    const [preview,    setPreview]    = useState(null);
    const [parsing,    setParsing]    = useState(false);

    const parseFile = useCallback((selected) => {
        if (!selected) { setPreview(null); return; }
        setParsing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb   = XLSX.read(e.target.result, {type: "array"});
                const name = wb.SheetNames.includes("Items") ? "Items" : wb.SheetNames[0];
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], {defval: ""});
                setPreview(rows.filter(r => Object.values(r).some(v => String(v).trim() !== "")));
            } catch {
                setPreview([]);
            }
            setParsing(false);
        };
        reader.readAsArrayBuffer(selected);
    }, []);

    const handleFileChange = (e) => {
        const selected = e.target.files[0] ?? null;
        setFile(selected);
        parseFile(selected);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!file) return;
        const form = new FormData();
        form.append("file", file);
        setSubmitting(true);
        router.post(route("inventory.items.import.store"), form, {
            onError:  (errs) => { setErrors(errs); setSubmitting(false); },
            onFinish: () => setSubmitting(false),
        });
    };

    const validRows   = preview?.filter(r => String(r.name ?? "").trim()) ?? [];
    const invalidRows = preview ? preview.length - validRows.length : 0;

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

            <Card sx={{maxWidth: 600}}>
                <CardHeader
                    title="Upload Excel / CSV"
                    subheader="Download the template first to see the expected columns."
                />
                <CardContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{display: "flex", flexDirection: "column", gap: 2}}>
                        <Box
                            component="label"
                            sx={{
                                display: "flex", flexDirection: "column", alignItems: "center",
                                gap: 1, p: 4, border: "2px dashed",
                                borderColor: file ? "primary.main" : "divider",
                                borderRadius: 2, cursor: "pointer", bgcolor: "action.hover",
                                "&:hover": {borderColor: "primary.main"},
                            }}
                        >
                            <UploadFileIcon sx={{fontSize: 48, color: file ? "primary.main" : "text.secondary"}}/>
                            <Typography variant="body2" color={file ? "primary.main" : "text.secondary"} fontWeight={file ? 600 : 400}>
                                {file ? file.name : "Click to choose .xlsx, .xlsm, .xls, or .csv"}
                            </Typography>
                            <input
                                type="file"
                                hidden
                                accept=".xlsx,.xlsm,.xls,.csv"
                                onChange={handleFileChange}
                            />
                        </Box>

                        {parsing && (
                            <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                                <CircularProgress size={16}/>
                                <Typography variant="body2" color="text.secondary">Reading file…</Typography>
                            </Box>
                        )}

                        {preview !== null && !parsing && (
                            <Box sx={{display: "flex", gap: 1, flexWrap: "wrap"}}>
                                <Chip
                                    icon={<CheckCircleIcon/>}
                                    label={`${validRows.length} valid row${validRows.length !== 1 ? "s" : ""}`}
                                    color="success" size="small" variant="outlined"
                                />
                                {invalidRows > 0 && (
                                    <Chip
                                        icon={<ErrorIcon/>}
                                        label={`${invalidRows} row${invalidRows !== 1 ? "s" : ""} missing name`}
                                        color="error" size="small" variant="outlined"
                                    />
                                )}
                            </Box>
                        )}

                        {errors.file && <Alert severity="error">{errors.file}</Alert>}

                        <Box sx={{display: "flex", gap: 2}}>
                            <Button variant="outlined" onClick={() => router.visit(route("inventory.items.index"))}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={!file || submitting || parsing || validRows.length === 0}
                                startIcon={submitting ? <CircularProgress size={16}/> : <UploadFileIcon/>}
                            >
                                {submitting ? "Importing…" : `Import ${validRows.length > 0 ? validRows.length + " " : ""}Items`}
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {preview !== null && !parsing && preview.length === 0 && (
                <Alert severity="warning" sx={{mt: 2, maxWidth: 600}}>
                    No data rows found. Make sure you're using the correct template and the sheet is named <strong>Items</strong>.
                </Alert>
            )}

            {preview !== null && !parsing && preview.length > 0 && (
                <Box sx={{mt: 3}}>
                    <Typography variant="subtitle2" gutterBottom>
                        Preview — {preview.length} row{preview.length !== 1 ? "s" : ""}
                    </Typography>
                    <TableContainer component={Paper} sx={{maxHeight: 440}}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{fontWeight: 700, bgcolor: "background.paper"}}>#</TableCell>
                                    {PREVIEW_COLS.map(c => (
                                        <TableCell
                                            key={c.key}
                                            sx={{fontWeight: 700, whiteSpace: "nowrap", bgcolor: "background.paper"}}
                                        >
                                            {c.label}
                                            {c.required && <Box component="span" sx={{color: "error.main"}}> *</Box>}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {preview.map((row, idx) => {
                                    const invalid = !String(row.name ?? "").trim();
                                    return (
                                        <TableRow
                                            key={idx}
                                            sx={{bgcolor: invalid ? "rgba(211,47,47,0.07)" : undefined}}
                                        >
                                            <TableCell sx={{color: "text.disabled"}}>{idx + 1}</TableCell>
                                            {PREVIEW_COLS.map(c => (
                                                <TableCell
                                                    key={c.key}
                                                    sx={{
                                                        maxWidth: 160,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        color: invalid && c.required ? "error.main" : undefined,
                                                    }}
                                                    title={String(row[c.key] ?? "")}
                                                >
                                                    {String(row[c.key] ?? "")}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}
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
