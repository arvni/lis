import {router, usePage, useForm} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, CardHeader, Chip, Divider, Grid,
    MenuItem, FormControlLabel, Switch, TextField, CircularProgress,
} from "@mui/material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const Edit = () => {
    const {store, managers} = usePage().props;

    const {data, setData, put, processing, errors} = useForm({
        name: store.name ?? "",
        code: store.code ?? "",
        description: store.description ?? "",
        is_active: store.is_active ?? true,
        manager_user_id: store.manager_user_id ?? "",
        address: store.address ?? "",
        notes: store.notes ?? "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("inventory.stores.update", store.id));
    };

    return (
        <>
            <PageHeader title={`Edit Store: ${store.name}`}/>
            <Box component="form" onSubmit={handleSubmit}>
                <Card>
                    <CardHeader
                        title="Store Details"
                        action={
                            <Box sx={{pt: 1, pr: 1}}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={data.is_active}
                                            onChange={(e) => setData("is_active", e.target.checked)}
                                            color="success"
                                        />
                                    }
                                    label={<Chip label={data.is_active ? "Active" : "Inactive"} size="small" color={data.is_active ? "success" : "default"}/>}
                                />
                            </Box>
                        }
                    />
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth required label="Store Name"
                                    value={data.name} onChange={(e) => setData("name", e.target.value)}
                                    error={!!errors.name} helperText={errors.name}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth required label="Store Code"
                                    value={data.code} onChange={(e) => setData("code", e.target.value)}
                                    error={!!errors.code} helperText={errors.code}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    select fullWidth label="Store Manager"
                                    value={data.manager_user_id} onChange={(e) => setData("manager_user_id", e.target.value)}
                                >
                                    <MenuItem value="">— None —</MenuItem>
                                    {managers.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth label="Address"
                                    value={data.address} onChange={(e) => setData("address", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth multiline rows={2} label="Description"
                                    value={data.description} onChange={(e) => setData("description", e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth multiline rows={2} label="Notes"
                                    value={data.notes} onChange={(e) => setData("notes", e.target.value)}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                    <Divider/>
                    <CardContent sx={{display: "flex", gap: 2}}>
                        <Button onClick={() => router.visit(route("inventory.stores.show", store.id))}>Cancel</Button>
                        <Button
                            type="submit" variant="contained"
                            disabled={processing}
                            startIcon={processing && <CircularProgress size={16}/>}
                        >
                            Save Changes
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        </>
    );
};

const breadcrumbs = (store) => [
    {title: "Inventory", link: null},
    {title: "Stores", link: route("inventory.stores.index")},
    {title: store?.name || "Store", link: route("inventory.stores.show", store?.id)},
    {title: "Edit", link: null},
];

Edit.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.store)}>{page}</AuthenticatedLayout>
);

export default Edit;
