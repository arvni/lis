import {useState} from "react";
import {router, usePage} from "@inertiajs/react";
import {
    Alert, Box, Button, Card, CardContent, CardHeader,
    CircularProgress, List, ListItem, Typography,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const ItemImport = () => {
    const {status, success, import_errors} = usePage().props;
    const [file,        setFile]        = useState(null);
    const [submitting,  setSubmitting]  = useState(false);
    const [errors,      setErrors]      = useState({});

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
                                gap: 1, p: 4, border: "2px dashed", borderColor: "divider",
                                borderRadius: 2, cursor: "pointer", bgcolor: "action.hover",
                                "&:hover": {borderColor: "primary.main"},
                            }}
                        >
                            <UploadFileIcon sx={{fontSize: 48, color: "text.secondary"}}/>
                            <Typography variant="body2" color="text.secondary">
                                {file ? file.name : "Click to choose .xlsx, .xls, or .csv"}
                            </Typography>
                            <input
                                type="file"
                                hidden
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => setFile(e.target.files[0] ?? null)}
                            />
                        </Box>

                        {errors.file && <Alert severity="error">{errors.file}</Alert>}

                        <Box sx={{display: "flex", gap: 2}}>
                            <Button variant="outlined" onClick={() => router.visit(route("inventory.items.index"))}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={!file || submitting}
                                startIcon={submitting ? <CircularProgress size={16}/> : <UploadFileIcon/>}
                            >
                                Import Items
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            <Box sx={{mt: 3}}>
                <Typography variant="subtitle2" gutterBottom>Column Reference</Typography>
                <Typography variant="body2" color="text.secondary" component="ul" sx={{pl: 2}}>
                    <li><strong>name</strong> (required) — item display name</li>
                    <li><strong>department</strong> — LAB, ADM, MNT, CLN, IT, FAC</li>
                    <li><strong>material_type</strong> — CHM, SLD, LQD, ELC, CSM, BIO, GLS, PPE, RGT, OTH</li>
                    <li><strong>storage_condition</strong> — ROOM_TEMP, REFRIGERATED, FROZEN, ULTRA_FROZEN, DRY_COOL, FLAMMABLE_CABINET</li>
                    <li><strong>default_unit</strong> — must match an existing unit name or abbreviation</li>
                    <li><strong>extra_unit_1 / conversion_1</strong> — optional secondary unit and its conversion ratio to base</li>
                    <li><strong>is_hazardous / requires_lot_tracking</strong> — yes/no or 1/0</li>
                </Typography>
            </Box>
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
