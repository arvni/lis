import {router, usePage} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, CardHeader, Chip, Divider,
    Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StarIcon from "@mui/icons-material/Star";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const Field = ({label, children}) => (
    <Box sx={{py: 0.75}}>
        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
        <Typography variant="body2" fontWeight={500}>{children || "—"}</Typography>
    </Box>
);

const Show = () => {
    const {supplier} = usePage().props;

    return (
        <>
            <PageHeader
                title={supplier.name}
                actions={
                    <Button startIcon={<EditIcon/>} variant="contained"
                        onClick={() => router.visit(route("inventory.suppliers.edit", supplier.id))}>
                        Edit
                    </Button>
                }
            />

            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Card sx={{height: "100%"}}>
                        <CardHeader
                            title="Supplier Info"
                            action={
                                <Box sx={{pt: 1, pr: 1, display: "flex", gap: 0.5}}>
                                    <Chip label={supplier.code} size="small" variant="outlined" sx={{fontFamily: "monospace"}}/>
                                    <Chip
                                        label={supplier.is_active ? "Active" : "Inactive"}
                                        color={supplier.is_active ? "success" : "default"}
                                        size="small"
                                    />
                                </Box>
                            }
                        />
                        <CardContent>
                            <Grid container spacing={0}>
                                <Grid item xs={6}>
                                    <Field label="Type">{supplier.type}</Field>
                                </Grid>
                                <Grid item xs={6}>
                                    <Field label="Lead Time">
                                        {supplier.lead_time_days ? `${supplier.lead_time_days} days` : null}
                                    </Field>
                                </Grid>
                                <Grid item xs={6}>
                                    <Field label="Country">{supplier.country}</Field>
                                </Grid>
                                <Grid item xs={6}>
                                    <Field label="City">{supplier.city}</Field>
                                </Grid>
                                {supplier.address && (
                                    <Grid item xs={12}>
                                        <Field label="Address">{supplier.address}</Field>
                                    </Grid>
                                )}
                                {supplier.payment_terms && (
                                    <Grid item xs={12}>
                                        <Field label="Payment Terms">{supplier.payment_terms}</Field>
                                    </Grid>
                                )}
                            </Grid>

                            <Divider sx={{my: 1.5}}/>

                            {supplier.website && (
                                <Box sx={{py: 0.75}}>
                                    <Typography variant="caption" color="text.secondary" display="block">Website</Typography>
                                    <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                                        <Typography
                                            component="a"
                                            href={supplier.website}
                                            target="_blank"
                                            rel="noreferrer"
                                            variant="body2"
                                            color="primary"
                                            sx={{textDecoration: "none", "&:hover": {textDecoration: "underline"}}}
                                        >
                                            {supplier.website}
                                        </Typography>
                                        <OpenInNewIcon sx={{fontSize: 14, color: "primary.main"}}/>
                                    </Box>
                                </Box>
                            )}

                            <Grid container>
                                {supplier.tax_number && (
                                    <Grid item xs={12}>
                                        <Field label="Tax Number">{supplier.tax_number}</Field>
                                    </Grid>
                                )}
                                {supplier.commercial_registration && (
                                    <Grid item xs={12}>
                                        <Field label="Commercial Registration">{supplier.commercial_registration}</Field>
                                    </Grid>
                                )}
                            </Grid>

                            {supplier.notes && (
                                <>
                                    <Divider sx={{my: 1.5}}/>
                                    <Field label="Notes">{supplier.notes}</Field>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={8}>
                    <Card sx={{mb: 3}}>
                        <CardHeader
                            title="Contacts"
                            subheader={`${supplier.contacts?.length ?? 0} contact${supplier.contacts?.length !== 1 ? "s" : ""}`}
                        />
                        <CardContent sx={{p: 0}}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Title</TableCell>
                                        <TableCell>Phone</TableCell>
                                        <TableCell>Mobile</TableCell>
                                        <TableCell>Email</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {supplier.contacts?.map((c) => (
                                        <TableRow key={c.id}>
                                            <TableCell>
                                                <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                                                    {c.is_primary && (
                                                        <StarIcon sx={{fontSize: 14, color: "warning.main"}}/>
                                                    )}
                                                    <Typography variant="body2" fontWeight={c.is_primary ? 600 : 400}>
                                                        {c.name}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">{c.title || "—"}</Typography>
                                            </TableCell>
                                            <TableCell>{c.phone || "—"}</TableCell>
                                            <TableCell>{c.mobile || "—"}</TableCell>
                                            <TableCell>
                                                {c.email
                                                    ? <Typography component="a" href={`mailto:${c.email}`} variant="body2" color="primary" sx={{textDecoration: "none"}}>{c.email}</Typography>
                                                    : "—"
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!supplier.contacts?.length && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{py: 3}}>
                                                <Typography variant="body2" color="text.secondary">No contacts added.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader
                            title="Supplied Items"
                            subheader={`${supplier.supplier_items?.length ?? 0} item${supplier.supplier_items?.length !== 1 ? "s" : ""} linked`}
                        />
                        <CardContent sx={{p: 0}}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Item</TableCell>
                                        <TableCell>Supplier Code</TableCell>
                                        <TableCell>Supplier Name</TableCell>
                                        <TableCell align="right">Last Price</TableCell>
                                        <TableCell>Min Order</TableCell>
                                        <TableCell>Preferred</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {supplier.supplier_items?.map((si) => (
                                        <TableRow key={si.id}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={500}>{si.item?.name}</Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{fontFamily: "monospace"}}>
                                                    {si.item?.item_code}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{fontFamily: "monospace"}}>
                                                    {si.supplier_item_code || "—"}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{si.supplier_item_name || "—"}</TableCell>
                                            <TableCell align="right">
                                                {si.last_purchase_price
                                                    ? <Typography variant="body2" fontWeight={500}>{Number(si.last_purchase_price).toLocaleString(undefined, {minimumFractionDigits: 2})}</Typography>
                                                    : "—"
                                                }
                                            </TableCell>
                                            <TableCell>
                                                {si.min_order_qty ? `${si.min_order_qty} ${si.unit?.abbreviation ?? ""}` : "—"}
                                            </TableCell>
                                            <TableCell>
                                                {si.is_preferred
                                                    ? <Chip label="Preferred" size="small" color="success" icon={<StarIcon/>}/>
                                                    : null
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!supplier.supplier_items?.length && (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{py: 3}}>
                                                <Typography variant="body2" color="text.secondary">No items linked to this supplier.</Typography>
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

const breadcrumbs = (supplier) => [
    {title: "Inventory", link: null},
    {title: "Suppliers", link: route("inventory.suppliers.index")},
    {title: supplier?.name || "Supplier", link: null},
];

Show.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.supplier)}>{page}</AuthenticatedLayout>
);

export default Show;
