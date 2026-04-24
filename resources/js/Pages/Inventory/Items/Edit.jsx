import {useState} from "react";
import {router, usePage, useForm} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, Chip, Stepper, Step, StepLabel,
    Grid, TextField, MenuItem, FormControlLabel, Checkbox,
    Typography, Divider, IconButton, Table, TableHead, TableBody,
    TableRow, TableCell, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const STEPS = ["Item Details", "Unit Conversions"];

const Edit = () => {
    const {item, storageConditions, units} = usePage().props;
    const [activeStep, setActiveStep] = useState(0);

    const {data, setData, put, processing, errors} = useForm({
        name:                    item.name                    ?? "",
        scientific_name:         item.scientific_name         ?? "",
        description:             item.description             ?? "",
        storage_condition:       item.storage_condition       ?? "",
        storage_condition_notes: item.storage_condition_notes ?? "",
        default_unit_id:         item.default_unit_id         ?? "",
        is_active:               item.is_active               ?? true,
        is_hazardous:            item.is_hazardous            ?? false,
        requires_lot_tracking:   item.requires_lot_tracking   ?? true,
        minimum_stock_level:     item.minimum_stock_level     ?? 0,
        maximum_stock_level:     item.maximum_stock_level     ?? "",
        lead_time_days:          item.lead_time_days          ?? "",
        notes:                   item.notes                   ?? "",
        unit_conversions: (item.unit_conversions ?? []).map(uc => ({
            unit_id:            uc.unit_id,
            conversion_to_base: uc.conversion_to_base,
        })),
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
        put(route("inventory.items.update", item.id));
    };

    return (
        <>
            <PageHeader
                title={`Edit — ${item.item_code}`}
                actions={
                    <Button variant="outlined" onClick={() => router.visit(route("inventory.items.show", item.id))}>
                        Cancel
                    </Button>
                }
            />

            <Box sx={{display: "flex", gap: 1, mb: 2, flexWrap: "wrap"}}>
                <Chip label={`Dept: ${item.department}`} size="small" variant="outlined"/>
                <Chip label={`Type: ${item.material_type}`} size="small" variant="outlined"/>
                <Chip
                    label={data.is_active ? "Active" : "Inactive"}
                    size="small"
                    color={data.is_active ? "success" : "default"}
                />
            </Box>

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
                                        error={!!errors.scientific_name} helperText={errors.scientific_name}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        select fullWidth required label="Storage Condition"
                                        value={data.storage_condition}
                                        onChange={(e) => setData("storage_condition", e.target.value)}
                                        error={!!errors.storage_condition} helperText={errors.storage_condition}
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
                                        error={!!errors.default_unit_id} helperText={errors.default_unit_id}
                                    >
                                        {units.map((u) => (
                                            <MenuItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth type="number" label="Min Stock Level"
                                        value={data.minimum_stock_level}
                                        onChange={(e) => setData("minimum_stock_level", e.target.value)}
                                        inputProps={{min: 0, step: "any"}}
                                        error={!!errors.minimum_stock_level} helperText={errors.minimum_stock_level}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth type="number" label="Max Stock Level"
                                        value={data.maximum_stock_level}
                                        onChange={(e) => setData("maximum_stock_level", e.target.value)}
                                        inputProps={{min: 0, step: "any"}}
                                        error={!!errors.maximum_stock_level} helperText={errors.maximum_stock_level}
                                    />
                                </Grid>
                                <Grid item xs={12} md={4}>
                                    <TextField
                                        fullWidth type="number" label="Lead Time (days)"
                                        value={data.lead_time_days}
                                        onChange={(e) => setData("lead_time_days", e.target.value)}
                                        inputProps={{min: 0}}
                                        error={!!errors.lead_time_days} helperText={errors.lead_time_days}
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
                                <Grid item xs={6} md={3}>
                                    <FormControlLabel
                                        control={<Checkbox checked={data.is_active} onChange={(e) => setData("is_active", e.target.checked)}/>}
                                        label="Active"
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
                                        error={!!errors.description} helperText={errors.description}
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
                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        disabled={!data.name || !data.storage_condition || !data.default_unit_id}
                                        onClick={() => setActiveStep(1)}
                                    >
                                        Next
                                    </Button>
                                </Grid>
                            </Grid>
                        )}

                        {activeStep === 1 && (
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
                                    <Button onClick={() => setActiveStep(0)}>Back</Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="success"
                                        disabled={processing}
                                        startIcon={processing && <CircularProgress size={16}/>}
                                    >
                                        Save Changes
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
    {title: "Edit Item", link: null},
];

Edit.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Edit;
