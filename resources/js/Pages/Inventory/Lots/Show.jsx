import {router, usePage} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, CardHeader, Chip, Grid,
    Table, TableBody, TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";

const STATUS_COLORS = {ACTIVE: "success", EXPIRED: "error", QUARANTINE: "warning", CONSUMED: "default"};

const LotShow = () => {
    const {lot, lines} = usePage().props;
    const item = lot.item;

    const totalIn  = lines.filter((l) => l.direction === "IN").reduce((s, l) => s + l.base_units, 0);
    const totalOut = lines.filter((l) => l.direction === "OUT").reduce((s, l) => s + l.base_units, 0);
    const balance  = totalIn - totalOut;

    const expiryDate = lot.expiry_date ? lot.expiry_date.substring(0, 10) : null;
    const daysLeft   = expiryDate ? Math.ceil((new Date(expiryDate) - new Date()) / 86400000) : null;

    return (
        <>
            <PageHeader
                title={`Lot: ${lot.lot_number}`}
                actions={
                    <Button
                        startIcon={<PrintIcon/>}
                        variant="outlined"
                        size="small"
                        onClick={() => router.visit(route("inventory.lots.label", lot.id))}
                    >
                        Print Label
                    </Button>
                }
            />

            <Grid container spacing={3} sx={{mb: 3}}>
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardHeader title="Lot Details"/>
                        <CardContent>
                            {[
                                ["Item",      `${item?.item_code} — ${item?.name}`],
                                ["Lot #",     lot.lot_number],
                                ["Brand",     lot.brand],
                                ["Barcode",   lot.barcode],
                                ["Received",  lot.received_date],
                                ["Expiry",    expiryDate
                                    ? `${expiryDate}${daysLeft !== null
                                        ? daysLeft < 0 ? " (EXPIRED)" : ` (${daysLeft}d left)`
                                        : ""}`
                                    : null],
                                ["Store",     lot.store?.name],
                                ["Location",  lot.location?.label],
                                ["Status",    lot.status],
                            ].map(([label, value]) => (
                                value ? (
                                    <Box key={label} sx={{display: "flex", gap: 1, py: 0.5}}>
                                        <Typography variant="body2" color="text.secondary" sx={{minWidth: 90}}>{label}:</Typography>
                                        <Typography variant="body2" fontWeight={label === "Status" ? 600 : 400}>
                                            {label === "Status"
                                                ? <Chip label={value} size="small" color={STATUS_COLORS[value] ?? "default"}/>
                                                : value}
                                        </Typography>
                                    </Box>
                                ) : null
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Grid container spacing={2}>
                        {[
                            {label: "Total Received (base)", value: totalIn.toFixed(4), color: "success.main"},
                            {label: "Total Consumed (base)", value: totalOut.toFixed(4), color: "error.main"},
                            {label: "Current Balance (base)", value: balance.toFixed(4), color: balance > 0 ? "text.primary" : "error.main"},
                        ].map((stat) => (
                            <Grid item xs={12} key={stat.label}>
                                <Card variant="outlined">
                                    <CardContent sx={{py: "12px !important"}}>
                                        <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                                        <Typography variant="h5" fontWeight={700} color={stat.color}>
                                            {stat.value}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            </Grid>

            <Card>
                <CardHeader title="Movement History" subheader="All approved transactions that touched this lot"/>
                <CardContent sx={{p: 0, overflowX: "auto"}}>
                    <Table size="small" sx={{minWidth: 650}}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Reference</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Direction</TableCell>
                                <TableCell>Store</TableCell>
                                <TableCell>Location</TableCell>
                                <TableCell align="right">Qty</TableCell>
                                <TableCell>Unit</TableCell>
                                <TableCell align="right">Base Units</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lines.map((line, idx) => (
                                <TableRow key={idx} hover>
                                    <TableCell>{line.date}</TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2" color="primary" sx={{cursor: "pointer", fontFamily: "monospace"}}
                                            onClick={() => router.visit(route("inventory.transactions.show", line.transaction_id))}
                                        >
                                            {line.reference}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={line.type?.replace("_", " ")} size="small" variant="outlined" sx={{fontSize: "0.7rem"}}/>
                                    </TableCell>
                                    <TableCell>
                                        {line.direction === "IN"
                                            ? <Chip icon={<TrendingUpIcon/>}   label="In"  size="small" color="success"/>
                                            : <Chip icon={<TrendingDownIcon/>} label="Out" size="small" color="error"/>
                                        }
                                    </TableCell>
                                    <TableCell>{line.store}</TableCell>
                                    <TableCell>{line.location || "—"}</TableCell>
                                    <TableCell align="right">{line.quantity}</TableCell>
                                    <TableCell>{line.unit}</TableCell>
                                    <TableCell align="right" sx={{fontWeight: 600, color: line.direction === "OUT" ? "error.main" : "success.main"}}>
                                        {line.direction === "OUT" ? "−" : "+"}{line.base_units}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {lines.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{py: 4}}>
                                        <Typography color="text.secondary">No transaction history found for this lot.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    );
};

const breadcrumbs = (lot) => [
    {title: "Inventory", link: null},
    {title: "Stock", link: route("inventory.stock.index")},
    {title: lot?.item?.item_code ? route("inventory.stock.card", lot?.item_id) : null, link: lot?.item_id ? route("inventory.stock.card", lot?.item_id) : null},
    {title: `Lot: ${lot?.lot_number}`, link: null},
];

LotShow.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.lot)}>
        {page}
    </AuthenticatedLayout>
);

export default LotShow;
