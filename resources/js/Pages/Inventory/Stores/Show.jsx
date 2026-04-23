import {useState} from "react";
import {router, usePage, useForm} from "@inertiajs/react";
import {
    Alert, Box, Button, Card, CardContent, CardHeader, Chip, Collapse,
    Divider, Grid, IconButton, Table, TableBody, TableCell, TableHead, TableRow,
    TextField, Tooltip, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const AddLocationForm = ({storeId, onClose}) => {
    const {data, setData, post, processing, reset} = useForm({
        zone: "", row: "", column: "", shelf: "", bin: "", capacity_notes: "",
    });

    const preview = [data.zone, data.row, data.column, data.shelf, data.bin].filter(Boolean).join("-") || "—";

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("inventory.stores.locations.store", storeId), {
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{bgcolor: "action.hover", borderRadius: 1, p: 2}}>
            <Typography variant="subtitle2" gutterBottom>
                New Location — Label preview: <strong>{preview}</strong>
            </Typography>
            <Grid container spacing={2}>
                {["zone", "row", "column", "shelf", "bin"].map((field) => (
                    <Grid item xs={6} sm={2} key={field}>
                        <TextField
                            fullWidth size="small" label={field.charAt(0).toUpperCase() + field.slice(1)}
                            value={data[field]} onChange={(e) => setData(field, e.target.value)}
                        />
                    </Grid>
                ))}
                <Grid item xs={12} sm={2}>
                    <TextField
                        fullWidth size="small" label="Capacity Notes"
                        value={data.capacity_notes} onChange={(e) => setData("capacity_notes", e.target.value)}
                    />
                </Grid>
            </Grid>
            <Box sx={{mt: 2, display: "flex", gap: 1}}>
                <Button size="small" onClick={onClose}>Cancel</Button>
                <Button type="submit" size="small" variant="contained" color="success" disabled={processing}>
                    Add Location
                </Button>
            </Box>
        </Box>
    );
};

const Field = ({label, children}) => (
    <Box sx={{py: 0.75}}>
        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
        <Typography variant="body2" fontWeight={500}>{children || "—"}</Typography>
    </Box>
);

const Show = () => {
    const {store, success, status} = usePage().props;
    const [showAddForm, setShowAddForm] = useState(false);

    const handleDelete = (locationId) => {
        if (confirm("Remove this location?")) {
            router.delete(route("inventory.stores.locations.destroy", [store.id, locationId]));
        }
    };

    const handleToggle = (locationId) => {
        router.post(route("inventory.stores.locations.toggle", [store.id, locationId]));
    };

    return (
        <>
            <PageHeader
                title={`${store.code} — ${store.name}`}
                actions={
                    <Button startIcon={<EditIcon/>} variant="contained"
                        onClick={() => router.visit(route("inventory.stores.edit", store.id))}>
                        Edit
                    </Button>
                }
            />

            {status && (
                <Alert severity={success ? "success" : "error"} sx={{mb: 2}}>
                    {status}
                </Alert>
            )}

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card sx={{height: "100%"}}>
                        <CardHeader
                            title="Store Info"
                            action={
                                <Box sx={{pt: 1, pr: 1}}>
                                    <Chip
                                        label={store.is_active ? "Active" : "Inactive"}
                                        color={store.is_active ? "success" : "default"}
                                        size="small"
                                    />
                                </Box>
                            }
                        />
                        <CardContent>
                            <Grid container spacing={0}>
                                <Grid item xs={6}>
                                    <Field label="Code">{store.code}</Field>
                                </Grid>
                                <Grid item xs={6}>
                                    <Field label="Manager">{store.manager?.name}</Field>
                                </Grid>
                            </Grid>

                            {store.address && (
                                <>
                                    <Divider sx={{my: 1.5}}/>
                                    <Field label="Address">{store.address}</Field>
                                </>
                            )}
                            {store.description && (
                                <>
                                    <Divider sx={{my: 1.5}}/>
                                    <Field label="Description">{store.description}</Field>
                                </>
                            )}
                            {store.notes && (
                                <>
                                    <Divider sx={{my: 1.5}}/>
                                    <Field label="Notes">{store.notes}</Field>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card>
                        <CardHeader
                            title="Locations"
                            subheader={`${store.locations?.length ?? 0} location${store.locations?.length !== 1 ? "s" : ""} defined`}
                            action={
                                <Box sx={{pt: 1, pr: 1}}>
                                    <Button startIcon={showAddForm ? <ExpandMoreIcon/> : <AddIcon/>} size="small" variant="outlined"
                                        onClick={() => setShowAddForm((v) => !v)}>
                                        {showAddForm ? "Cancel" : "Add Location"}
                                    </Button>
                                </Box>
                            }
                        />
                        <CardContent sx={{p: 0}}>
                            <Collapse in={showAddForm}>
                                <Box sx={{p: 2}}>
                                    <AddLocationForm storeId={store.id} onClose={() => setShowAddForm(false)}/>
                                </Box>
                            </Collapse>

                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Label</TableCell>
                                        <TableCell>Zone</TableCell>
                                        <TableCell>Row</TableCell>
                                        <TableCell>Column</TableCell>
                                        <TableCell>Shelf</TableCell>
                                        <TableCell>Bin</TableCell>
                                        <TableCell>Active</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {store.locations?.map((loc) => (
                                        <TableRow key={loc.id} hover>
                                            <TableCell><strong>{loc.label}</strong></TableCell>
                                            <TableCell>{loc.zone || "—"}</TableCell>
                                            <TableCell>{loc.row || "—"}</TableCell>
                                            <TableCell>{loc.column || "—"}</TableCell>
                                            <TableCell>{loc.shelf || "—"}</TableCell>
                                            <TableCell>{loc.bin || "—"}</TableCell>
                                            <TableCell>
                                                <Chip label={loc.is_active ? "Yes" : "No"} size="small"
                                                    color={loc.is_active ? "success" : "default"}/>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title={loc.is_active ? "Deactivate" : "Activate"}>
                                                    <IconButton size="small" onClick={() => handleToggle(loc.id)}>
                                                        {loc.is_active ? <ToggleOnIcon color="success" fontSize="small"/> : <ToggleOffIcon fontSize="small"/>}
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Remove">
                                                    <IconButton size="small" color="error" onClick={() => handleDelete(loc.id)}>
                                                        <DeleteIcon fontSize="small"/>
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!store.locations?.length && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{py: 4}}>
                                                <Typography color="text.secondary">No locations defined.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </>
    );
};

const breadcrumbs = (store) => [
    {title: "Inventory", link: null},
    {title: "Stores", link: route("inventory.stores.index")},
    {title: store?.name || "Store", link: null},
];

Show.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.store)}>{page}</AuthenticatedLayout>
);

export default Show;
