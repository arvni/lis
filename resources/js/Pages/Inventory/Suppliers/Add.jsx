import {router, usePage, useForm} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, CardHeader, Divider, FormControlLabel,
    Grid, IconButton, Switch, TextField, MenuItem, Typography, CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const Add = () => {
    const {types} = usePage().props;

    const {data, setData, post, processing, errors} = useForm({
        name: "",
        code: "",
        type: "",
        country: "",
        city: "",
        address: "",
        website: "",
        payment_terms: "",
        lead_time_days: "",
        tax_number: "",
        commercial_registration: "",
        notes: "",
        contacts: [],
    });

    const addContact = () => setData("contacts", [...data.contacts, {name: "", title: "", phone: "", mobile: "", email: "", is_primary: false}]);
    const removeContact = (idx) => setData("contacts", data.contacts.filter((_, i) => i !== idx));
    const updateContact = (idx, field, value) => {
        const updated = [...data.contacts];
        updated[idx] = {...updated[idx], [field]: value};
        setData("contacts", updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("inventory.suppliers.store"));
    };

    return (
        <>
            <PageHeader title="New Supplier"/>
            <Box component="form" onSubmit={handleSubmit} sx={{display: "flex", flexDirection: "column", gap: 3}}>
                <Card>
                    <CardHeader title="Supplier Details"/>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth required label="Supplier Name"
                                    value={data.name} onChange={(e) => setData("name", e.target.value)}
                                    error={!!errors.name} helperText={errors.name}/>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField fullWidth required label="Code"
                                    value={data.code} onChange={(e) => setData("code", e.target.value)}
                                    error={!!errors.code} helperText={errors.code}/>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <TextField select fullWidth required label="Type"
                                    value={data.type} onChange={(e) => setData("type", e.target.value)}
                                    error={!!errors.type}>
                                    {types.map((t) => <MenuItem key={t.value} value={t.value}>{t.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth label="Country"
                                    value={data.country} onChange={(e) => setData("country", e.target.value)}/>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth label="City"
                                    value={data.city} onChange={(e) => setData("city", e.target.value)}/>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <TextField fullWidth type="number" label="Lead Time (days)"
                                    value={data.lead_time_days} onChange={(e) => setData("lead_time_days", e.target.value)}
                                    inputProps={{min: 0}}/>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth label="Website"
                                    value={data.website} onChange={(e) => setData("website", e.target.value)}
                                    error={!!errors.website} helperText={errors.website}/>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth label="Payment Terms"
                                    value={data.payment_terms} onChange={(e) => setData("payment_terms", e.target.value)}/>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth label="Tax Number"
                                    value={data.tax_number} onChange={(e) => setData("tax_number", e.target.value)}/>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth label="Commercial Registration"
                                    value={data.commercial_registration} onChange={(e) => setData("commercial_registration", e.target.value)}/>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth multiline rows={2} label="Address"
                                    value={data.address} onChange={(e) => setData("address", e.target.value)}/>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth multiline rows={2} label="Notes"
                                    value={data.notes} onChange={(e) => setData("notes", e.target.value)}/>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader
                        title="Contacts"
                        subheader={data.contacts.length > 0 ? `${data.contacts.length} contact${data.contacts.length !== 1 ? "s" : ""}` : "No contacts yet"}
                        action={
                            <Box sx={{pt: 1, pr: 1}}>
                                <Button startIcon={<AddIcon/>} onClick={addContact} size="small" variant="outlined">
                                    Add Contact
                                </Button>
                            </Box>
                        }
                    />
                    <CardContent>
                        {data.contacts.length === 0 && (
                            <Typography color="text.secondary" variant="body2">
                                Click "Add Contact" to add a contact person for this supplier.
                            </Typography>
                        )}
                        {data.contacts.map((contact, idx) => (
                            <Box key={idx}>
                                {idx > 0 && <Divider sx={{my: 2}}/>}
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} md={3}>
                                        <TextField fullWidth required size="small" label="Name"
                                            value={contact.name} onChange={(e) => updateContact(idx, "name", e.target.value)}/>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <TextField fullWidth size="small" label="Title / Position"
                                            value={contact.title} onChange={(e) => updateContact(idx, "title", e.target.value)}/>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <TextField fullWidth size="small" label="Phone"
                                            value={contact.phone} onChange={(e) => updateContact(idx, "phone", e.target.value)}/>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <TextField fullWidth size="small" label="Mobile"
                                            value={contact.mobile} onChange={(e) => updateContact(idx, "mobile", e.target.value)}/>
                                    </Grid>
                                    <Grid item xs={12} md={2}>
                                        <TextField fullWidth size="small" label="Email"
                                            value={contact.email} onChange={(e) => updateContact(idx, "email", e.target.value)}/>
                                    </Grid>
                                    <Grid item xs="auto">
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    size="small"
                                                    checked={!!contact.is_primary}
                                                    onChange={(e) => updateContact(idx, "is_primary", e.target.checked)}
                                                    color="warning"
                                                />
                                            }
                                            label={<Typography variant="caption">Primary</Typography>}
                                        />
                                    </Grid>
                                    <Grid item xs="auto">
                                        <IconButton size="small" color="error" onClick={() => removeContact(idx)}>
                                            <DeleteIcon fontSize="small"/>
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                    </CardContent>
                    <Divider/>
                    <CardContent sx={{display: "flex", gap: 2}}>
                        <Button onClick={() => router.visit(route("inventory.suppliers.index"))}>Cancel</Button>
                        <Button type="submit" variant="contained" color="success" disabled={processing}
                            startIcon={processing && <CircularProgress size={16}/>}>
                            Create Supplier
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        </>
    );
};

const breadcrumbs = [
    {title: "Inventory", link: null},
    {title: "Suppliers", link: route("inventory.suppliers.index")},
    {title: "New Supplier", link: null},
];

Add.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default Add;
