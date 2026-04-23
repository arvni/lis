import {router, usePage} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, CardHeader, Chip, Divider,
    Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import BarChartIcon from "@mui/icons-material/BarChart";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const Field = ({label, children}) => (
    <Grid item xs={6}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>{label}</Typography>
        <Typography variant="body2" fontWeight={500}>{children || "—"}</Typography>
    </Grid>
);

const Show = () => {
    const {item} = usePage().props;

    return (
        <>
            <PageHeader
                title={`${item.item_code} — ${item.name}`}
                actions={
                    <Box sx={{display: "flex", gap: 1}}>
                        <Button startIcon={<BarChartIcon/>} variant="outlined"
                            onClick={() => router.visit(route("inventory.stock.card", item.id))}>
                            Stock Card
                        </Button>
                        <Button startIcon={<EditIcon/>} variant="contained"
                            onClick={() => router.visit(route("inventory.items.edit", item.id))}>
                            Edit
                        </Button>
                    </Box>
                }
            />

            <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                    <Card>
                        <CardHeader
                            title="Item Details"
                            subheader={item.scientific_name && <em>{item.scientific_name}</em>}
                            action={
                                <Stack direction="row" spacing={0.5} sx={{pt: 1, pr: 1}}>
                                    <Chip
                                        label={item.is_active ? "Active" : "Inactive"}
                                        color={item.is_active ? "success" : "default"}
                                        size="small"
                                    />
                                    {item.is_hazardous && (
                                        <Chip icon={<WarningAmberIcon/>} label="Hazardous" color="error" size="small"/>
                                    )}
                                    {item.requires_lot_tracking && (
                                        <Chip icon={<TrackChangesIcon/>} label="Lot Tracking" color="info" size="small"/>
                                    )}
                                </Stack>
                            }
                        />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Field label="Item Code">{item.item_code}</Field>
                                <Field label="Department">{item.department}</Field>
                                <Field label="Material Type">{item.material_type}</Field>
                                <Field label="Storage Condition">{item.storage_condition}</Field>
                                <Field label="Base Unit">
                                    {item.default_unit?.name}
                                    {item.default_unit?.abbreviation && (
                                        <Typography component="span" variant="caption" color="text.secondary" sx={{ml: 0.5}}>
                                            ({item.default_unit.abbreviation})
                                        </Typography>
                                    )}
                                </Field>
                                <Field label="Lead Time">
                                    {item.lead_time_days ? `${item.lead_time_days} days` : null}
                                </Field>

                                <Grid item xs={12}><Divider/></Grid>

                                <Field label="Min Stock Level">
                                    {item.minimum_stock_level != null
                                        ? `${item.minimum_stock_level} ${item.default_unit?.abbreviation ?? ""}`
                                        : null}
                                </Field>
                                <Field label="Max Stock Level">
                                    {item.maximum_stock_level != null
                                        ? `${item.maximum_stock_level} ${item.default_unit?.abbreviation ?? ""}`
                                        : null}
                                </Field>

                                {(item.storage_condition_notes || item.description || item.notes) && (
                                    <Grid item xs={12}><Divider/></Grid>
                                )}
                                {item.storage_condition_notes && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                            Storage Notes
                                        </Typography>
                                        <Typography variant="body2">{item.storage_condition_notes}</Typography>
                                    </Grid>
                                )}
                                {item.description && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                            Description
                                        </Typography>
                                        <Typography variant="body2">{item.description}</Typography>
                                    </Grid>
                                )}
                                {item.notes && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                            Notes
                                        </Typography>
                                        <Typography variant="body2">{item.notes}</Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Card>
                        <CardHeader
                            title="Unit Conversions"
                            subheader={`Base unit: ${item.default_unit?.name} (${item.default_unit?.abbreviation})`}
                        />
                        <CardContent sx={{p: 0}}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Unit</TableCell>
                                        <TableCell>Abbrev.</TableCell>
                                        <TableCell align="right">= Base Units</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow sx={{"&:last-child td": {border: 0}}}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {item.default_unit?.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={item.default_unit?.abbreviation} size="small" variant="outlined"/>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight={600}>1</Typography>
                                        </TableCell>
                                    </TableRow>
                                    {item.unit_conversions?.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell>{c.unit?.name}</TableCell>
                                            <TableCell>
                                                <Chip label={c.unit?.abbreviation} size="small" variant="outlined"/>
                                            </TableCell>
                                            <TableCell align="right">{Number(c.conversion_to_base).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                    {!item.unit_conversions?.length && (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{py: 3}}>
                                                <Typography variant="body2" color="text.secondary">
                                                    No additional unit conversions defined.
                                                </Typography>
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

const breadcrumbs = (item) => [
    {title: "Inventory", link: null},
    {title: "Items", link: route("inventory.items.index")},
    {title: item?.item_code || "Item", link: null},
];

Show.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.item)}>
        {page}
    </AuthenticatedLayout>
);

export default Show;
