import {usePage, router} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, CardHeader, Chip, Grid, MenuItem,
    Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PrintIcon from "@mui/icons-material/Print";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import {StockBadge} from "../Components/StockBadge";

const StockCard = () => {
    const {stockCard, stores, storeId} = usePage().props;
    const {item, entries, lots, total_base, total_fmt} = stockCard;

    const isLowStock = item.minimum_stock_level > 0 && total_base < item.minimum_stock_level;

    return (
        <>
            <PageHeader title={`${item.item_code} — ${item.name}`}/>

            <Grid container spacing={3} sx={{mb: 3}}>
                <Grid item xs={12} md={4}>
                    <Card sx={{height: "100%"}}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                Current Stock
                            </Typography>
                            <Typography
                                variant="h4"
                                fontWeight={700}
                                color={isLowStock ? "error.main" : "success.main"}
                            >
                                {total_fmt || `${Number(total_base).toFixed(2)} ${item.default_unit?.abbreviation}`}
                            </Typography>
                            {item.minimum_stock_level > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                    Min: {item.minimum_stock_level} {item.default_unit?.abbreviation}
                                </Typography>
                            )}
                            <Box sx={{mt: 1}}>
                                <StockBadge isLowStock={isLowStock}/>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Card sx={{height: "100%"}}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                Item Info
                            </Typography>
                            <Grid container spacing={1}>
                                {[
                                    ["Department",   item.department],
                                    ["Type",         item.material_type],
                                    ["Storage",      item.storage_condition],
                                    ["Base Unit",    `${item.default_unit?.name} (${item.default_unit?.abbreviation})`],
                                ].map(([label, value]) => (
                                    <Grid item xs={6} key={label}>
                                        <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                                        <Typography variant="body2" fontWeight={500}>{value || "—"}</Typography>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card sx={{height: "100%"}}>
                        <CardContent>
                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                Filter by Store
                            </Typography>
                            <TextField
                                select fullWidth size="small"
                                value={storeId || ""}
                                onChange={(e) => router.visit(route("inventory.stock.card", item.id), {data: {store_id: e.target.value || undefined}})}
                            >
                                <MenuItem value="">All Stores</MenuItem>
                                {stores.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                            </TextField>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                    <Card>
                        <CardHeader
                            title="Transaction History"
                            subheader="Running balance in base units"
                        />
                        <CardContent sx={{p: 0, overflowX: "auto"}}>
                            <Table size="small" sx={{minWidth: 700}}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Reference</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Flow</TableCell>
                                        <TableCell>Store</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell>Lot #</TableCell>
                                        <TableCell>Brand</TableCell>
                                        <TableCell align="right">Qty (base)</TableCell>
                                        <TableCell align="right">Balance</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {entries.map((e, idx) => (
                                        <TableRow key={idx} hover>
                                            <TableCell>{e.date}</TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    color="primary"
                                                    sx={{cursor: "pointer", fontFamily: "monospace", "&:hover": {textDecoration: "underline"}}}
                                                    onClick={() => e.transaction_id && router.visit(route("inventory.transactions.show", e.transaction_id))}
                                                >
                                                    {e.reference}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={e.type?.replace("_", " ")} size="small" variant="outlined" sx={{fontSize: "0.7rem"}}/>
                                            </TableCell>
                                            <TableCell>
                                                {e.direction === "IN"
                                                    ? <Chip icon={<TrendingUpIcon/>} label="In" size="small" color="success"/>
                                                    : <Chip icon={<TrendingDownIcon/>} label="Out" size="small" color="error"/>
                                                }
                                            </TableCell>
                                            <TableCell>{e.store || "—"}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{fontFamily: "monospace"}}>{e.location || "—"}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{fontFamily: "monospace"}}>{e.lot_number || "—"}</Typography>
                                            </TableCell>
                                            <TableCell>{e.brand || "—"}</TableCell>
                                            <TableCell align="right">
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                    color={e.direction === "OUT" ? "error.main" : "success.main"}
                                                >
                                                    {e.direction === "OUT" ? "−" : "+"}{e.base_units}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight={500}>
                                                    {e.balance_fmt || e.balance_base}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {entries.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{py: 4}}>
                                                <Typography color="text.secondary">No approved transactions found.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Card>
                        <CardHeader
                            title="Active Lots"
                            subheader={`${lots.length} lot${lots.length !== 1 ? "s" : ""} in stock`}
                        />
                        <CardContent sx={{p: 0}}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Lot #</TableCell>
                                        <TableCell>Brand</TableCell>
                                        <TableCell>Expiry</TableCell>
                                        <TableCell align="right">Qty</TableCell>
                                        <TableCell>Location</TableCell>
                                        <TableCell sx={{width: 64}}/>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lots.map((lot) => {
                                        const expiry     = lot.expiry_date ? lot.expiry_date.substring(0, 10) : null;
                                        const daysLeft   = expiry ? Math.ceil((new Date(expiry) - new Date()) / 86400000) : null;
                                        const isExpiring = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
                                        const isExpired  = daysLeft !== null && daysLeft <= 0;
                                        return (
                                            <TableRow key={lot.id} hover sx={{cursor: "pointer"}}
                                                onClick={() => router.visit(route("inventory.lots.show", lot.id))}>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{fontFamily: "monospace", color: "primary.main"}}>{lot.lot_number}</Typography>
                                                </TableCell>
                                                <TableCell>{lot.brand || "—"}</TableCell>
                                                <TableCell>
                                                    {expiry ? (
                                                        <Box>
                                                            <Typography variant="body2" color={isExpired ? "error" : isExpiring ? "warning.main" : "inherit"}>
                                                                {expiry}
                                                            </Typography>
                                                            {isExpired  && <Chip label="Expired"  size="small" color="error"   sx={{height: 16, fontSize: "0.65rem"}}/>}
                                                            {isExpiring && <Chip label={`${daysLeft}d`} size="small" color="warning" sx={{height: 16, fontSize: "0.65rem"}}/>}
                                                        </Box>
                                                    ) : "—"}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body2" fontWeight={500}>{lot.quantity_base_units}</Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{fontFamily: "monospace"}}>
                                                        {lot.location?.label || lot.store?.name || "—"}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell onClick={(e) => e.stopPropagation()}>
                                                    <Box sx={{display: "flex", gap: 0.5}}>
                                                        <PrintIcon fontSize="small" color="action" sx={{cursor: "pointer"}}
                                                            onClick={() => router.visit(route("inventory.lots.label", lot.id))}/>
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {lots.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} align="center" sx={{py: 4}}>
                                                <Typography color="text.secondary">No active lots.</Typography>
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

const breadcrumbs = (card) => [
    {title: "Inventory", link: null},
    {title: "Stock", link: route("inventory.stock.index")},
    {title: card?.item?.item_code || "Card", link: null},
];

StockCard.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.stockCard)}>
        {page}
    </AuthenticatedLayout>
);

export default StockCard;
