import {router, usePage, useForm} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, CardHeader, Divider, Grid, MenuItem,
    TextField, CircularProgress,
} from "@mui/material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const Add = () => {
    const {managers} = usePage().props;

    const {data, setData, post, processing, errors} = useForm({
        name: "",
        code: "",
        description: "",
        manager_user_id: "",
        address: "",
        notes: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("inventory.stores.store"));
    };

    return (
        <>
            <PageHeader title="New Store"/>
            <Box component="form" onSubmit={handleSubmit}>
                <Card>
                    <CardHeader title="Store Details"/>
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
                                    helperText={errors.code || "Short uppercase identifier, e.g. WH-01"}
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
                        <Button onClick={() => router.visit(route("inventory.stores.index"))}>Cancel</Button>
                        <Button
                            type="submit" variant="contained" color="success"
                            disabled={processing}
                            startIcon={processing && <CircularProgress size={16}/>}
                        >
                            Create Store
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        </>
    );
};

const breadcrumbs = [
    {title: "Inventory", link: null},
    {title: "Stores", link: route("inventory.stores.index")},
    {title: "New Store", link: null},
];

Add.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default Add;
