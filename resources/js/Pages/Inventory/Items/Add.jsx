import {useState} from "react";
import {router, usePage, useForm} from "@inertiajs/react";
import {
    Box, Button, Stepper, Step, StepLabel, Card, CardContent,
    Grid, TextField, MenuItem, FormControlLabel, Checkbox,
    Typography, Divider, IconButton, Table, TableHead, TableBody,
    TableRow, TableCell, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const STEPS = ["Department & Type", "Item Details", "Unit Conversions"];

const Add = () => {
    const {departments, materialTypes, storageConditions, units} = usePage().props;
    const [activeStep, setActiveStep] = useState(0);

    const {data, setData, post, processing, errors} = useForm({
        department: "",
        material_type: "",
        name: "",
        scientific_name: "",
        description: "",
        storage_condition: "",
        storage_condition_notes: "",
        default_unit_id: "",
        is_hazardous: false,
        requires_lot_tracking: true,
        minimum_stock_level: 0,
        maximum_stock_level: "",
        lead_time_days: "",
        notes: "",
        unit_conversions: [],
    });

    const addConversion = () => {
        setData("unit_conversions", [
            ...data.unit_conversions,
            {unit_id: "", conversion_to_base: ""},
        ]);
    };

    const removeConversion = (idx) => {
        setData("unit_conversions", data.unit_conversions.filter((_, i) => i !== idx));
    };

    const updateConversion = (idx, field, value) => {
        const updated = [...data.unit_conversions];
        updated[idx] = {...updated[idx], [field]: value};
        setData("unit_conversions", updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("inventory.items.store"));
    };

    const codePreview = data.department && data.material_type
        ? `${data.department}-${data.material_type}-XXXXXX`
        : "—";

    return (
        <>
            <PageHeader title="New Inventory Item"/>
            <Card>
                <CardContent>
                    <Stepper activeStep={activeStep} sx={{mb: 4}}>
                        {STEPS.map((label) => (
                            <Step key={label}><StepLabel>{label}</StepLabel></Step>
                        ))}
                    </Stepper>

                    <Box component="form" onSubmit={handleSubmit}>
                        {activeStep === 0 && (
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Selecting department and material type will generate the item code automatically.
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        select fullWidth required
                                        label="Department / Purpose"
                                        value={data.department}
                                        onChange={(e) => setData("department", e.target.value)}
                                        error={!!errors.department}
                                        helperText={errors.department}
                                    >
                                        {departments.map((d) => (
                                            <MenuItem key={d.value} value={d.value}>{d.value} — {d.name}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        select fullWidth required
                                        label="Material Type"
                                        value={data.material_type}
                                        onChange={(e) => setData("material_type", e.target.value)}
                                        error={!!errors.material_type}
                                        helperText={errors.material_type}
                                    >
                                        {materialTypes.map((m) => (
                                            <MenuItem key={m.value} value={m.value}>{m.value} — {m.name}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                                        <Typography variant="body2" color="text.secondary">Generated Code Preview:</Typography>
                                        <Typography
                                            variant="body1" fontWeight={700}
                                            sx={{fontFamily: "monospace", bgcolor: "action.hover", px: 1.5, py: 0.5, borderRadius: 1}}
                                        >
                                            {codePreview}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        disabled={!data.department || !data.material_type}
                                        onClick={() => setActiveStep(1)}
                                    >
                                        Next
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {activeStep === 1 && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth required label="Item Name"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        error={!!errors.name} helperText={errors.name}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth label="Scientific Name"
                                        value={data.scientific_name}
                                        onChange={(e) => setData("scientific_name", e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        select fullWidth required label="Storage Condition"
                                        value={data.storage_condition}
                                        onChange={(e) => setData("storage_condition", e.target.value)}
                                        error={!!errors.storage_condition}
                                    >
                                        {storageConditions.map((s) => (
                                            <MenuItem key={s.value} value={s.value}>{s.name}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        select fullWidth required label="Base Unit"
                                        value={data.default_unit_id}
                                        onChange={(e) => setData("default_unit_id", e.target.value)}
                                        error={!!errors.default_unit_id}
                                    >
                                        {units.map((u) => (
                                            <MenuItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth type="number" label="Min Stock Level (base units)"
                                        value={data.minimum_stock_level}
                                        onChange={(e) => setData("minimum_stock_level", e.target.value)}
                                        inputProps={{min: 0, step: "any"}}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth type="number" label="Max Stock Level (base units)"
                                        value={data.maximum_stock_level}
                                        onChange={(e) => setData("maximum_stock_level", e.target.value)}
                                        inputProps={{min: 0, step: "any"}}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth type="number" label="Lead Time (days)"
                                        value={data.lead_time_days}
                                        onChange={(e) => setData("lead_time_days", e.target.value)}
                                        inputProps={{min: 0}}
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <FormControlLabel
                                        control={<Checkbox checked={data.is_hazardous} onChange={(e) => setData("is_hazardous", e.target.checked)}/>}
                                        label="Hazardous"
                                    />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <FormControlLabel
                                        control={<Checkbox checked={data.requires_lot_tracking} onChange={(e) => setData("requires_lot_tracking", e.target.checked)}/>}
                                        label="Lot Tracking"
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider/>
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth multiline rows={2} label="Description"
                                        value={data.description}
                                        onChange={(e) => setData("description", e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth multiline rows={2} label="Storage Notes"
                                        value={data.storage_condition_notes}
                                        onChange={(e) => setData("storage_condition_notes", e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth multiline rows={2} label="Notes"
                                        value={data.notes}
                                        onChange={(e) => setData("notes", e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sx={{display: "flex", gap: 2}}>
                                    <Button onClick={() => setActiveStep(0)}>Back</Button>
                                    <Button
                                        variant="contained"
                                        disabled={!data.name || !data.storage_condition || !data.default_unit_id}
                                        onClick={() => setActiveStep(2)}
                                    >
                                        Next
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {activeStep === 2 && (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Define how many base units ({units.find(u => u.id == data.default_unit_id)?.name || "base"}) equal each larger unit.
                                </Typography>
                                <Table size="small" sx={{mb: 2}}>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Unit</TableCell>
                                            <TableCell>= how many base units?</TableCell>
                                            <TableCell/>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {data.unit_conversions.map((conv, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>
                                                    <TextField
                                                        select size="small" value={conv.unit_id}
                                                        onChange={(e) => updateConversion(idx, "unit_id", e.target.value)}
                                                        sx={{minWidth: 150}}
                                                    >
                                                        {units.filter(u => u.id != data.default_unit_id).map(u => (
                                                            <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
                                                        ))}
                                                    </TextField>
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        size="small" type="number"
                                                        value={conv.conversion_to_base}
                                                        onChange={(e) => updateConversion(idx, "conversion_to_base", e.target.value)}
                                                        inputProps={{min: 0.000001, step: "any"}}
                                                        sx={{width: 120}}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton size="small" onClick={() => removeConversion(idx)}>
                                                        <DeleteIcon fontSize="small"/>
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <Button startIcon={<AddIcon/>} onClick={addConversion} variant="outlined" size="small" sx={{mb: 3}}>
                                    Add Unit Conversion
                                </Button>
                                <Divider sx={{my: 2}}/>
                                <Box sx={{display: "flex", gap: 2}}>
                                    <Button onClick={() => setActiveStep(1)}>Back</Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="success"
                                        disabled={processing}
                                        startIcon={processing && <CircularProgress size={16}/>}
                                    >
                                        Create Item
                                    </Button>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </>
    );
};

const breadcrumbs = [
    {title: "Inventory", link: null},
    {title: "Items", link: route("inventory.items.index")},
    {title: "New Item", link: null},
];

Add.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Add;
