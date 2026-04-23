import {router, usePage} from "@inertiajs/react";
import {
    Alert, Box, Card, CardContent, CardHeader, Chip, MenuItem,
    Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import StockBadge from "@/Pages/Inventory/Components/StockBadge";

const LotTable = ({lots, emptyText}) => (
    lots.length === 0
        ? <Alert severity="info" sx={{m: 2}}>{emptyText}</Alert>
        : (
            <Table size="small" sx={{minWidth: 700}}>
                <TableHead>
                    <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Lot #</TableCell>
                        <TableCell>Brand</TableCell>
                        <TableCell>Expiry</TableCell>
                        <TableCell align="right">Qty (base)</TableCell>
                        <TableCell>Store</TableCell>
                        <TableCell>Location</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {lots.map((lot) => {
                        const daysLeft = Math.ceil(
                            (new Date(lot.expiry_date) - new Date()) / 86400000
                        );
                        return (
                            <TableRow
                                key={lot.id}
                                hover
                                sx={{cursor: "pointer"}}
                                onClick={() => router.visit(route("inventory.items.show", lot.item_id))}
                            >
                                <TableCell>
                                    <Typography variant="body2" fontWeight={500}>{lot.item?.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{lot.item?.item_code}</Typography>
                                </TableCell>
                                <TableCell sx={{fontFamily: "monospace"}}>{lot.lot_number}</TableCell>
                                <TableCell>{lot.brand || "—"}</TableCell>
                                <TableCell>
                                    <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                                        <span>{lot.expiry_date}</span>
                                        {daysLeft < 0
                                            ? <Chip label="EXPIRED" size="small" color="error"/>
                                            : daysLeft <= 30
                                                ? <Chip label={`${daysLeft}d`} size="small" color="warning"/>
                                                : <Chip label={`${daysLeft}d`} size="small" color="info" variant="outlined"/>
                                        }
                                    </Box>
                                </TableCell>
                                <TableCell align="right">{parseFloat(lot.quantity_base_units)}</TableCell>
                                <TableCell>{lot.store?.name}</TableCell>
                                <TableCell>{lot.location?.label || "—"}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        )
);

const ExpiryIndex = () => {
    const {expired, expiringSoon, stores, storeId, window: days} = usePage().props;

    const applyFilter = (key, val) => {
        router.get(route("inventory.expiry.index"), {
            store_id: storeId,
            days,
            [key]: val || undefined,
        }, {preserveState: true, replace: true});
    };

    return (
        <>
            <PageHeader title="Expiry Dashboard"/>

            <Box sx={{display: "flex", gap: 2, mb: 3, flexWrap: "wrap"}}>
                <TextField select label="Store" size="small" value={storeId || ""} sx={{minWidth: 180}}
                    onChange={(e) => applyFilter("store_id", e.target.value)}>
                    <MenuItem value="">All Stores</MenuItem>
                    {stores.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </TextField>
                <TextField select label="Expiry Window" size="small" value={days} sx={{minWidth: 160}}
                    onChange={(e) => applyFilter("days", e.target.value)}>
                    {[30, 60, 90, 180].map((d) => (
                        <MenuItem key={d} value={d}>Next {d} days</MenuItem>
                    ))}
                </TextField>
            </Box>

            <Card sx={{mb: 3}}>
                <CardHeader
                    title={
                        <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                            Already Expired
                            <Chip label={expired.length} color="error" size="small"/>
                        </Box>
                    }
                />
                <CardContent sx={{p: 0, overflowX: "auto"}}>
                    <LotTable lots={expired} emptyText="No expired lots with remaining stock."/>
                </CardContent>
            </Card>

            <Card>
                <CardHeader
                    title={
                        <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                            Expiring Within {days} Days
                            <Chip label={expiringSoon.length} color="warning" size="small"/>
                        </Box>
                    }
                />
                <CardContent sx={{p: 0, overflowX: "auto"}}>
                    <LotTable lots={expiringSoon} emptyText={`No lots expiring in the next ${days} days.`}/>
                </CardContent>
            </Card>
        </>
    );
};

const breadcrumbs = [
    {title: "Inventory", link: null},
    {title: "Expiry Dashboard", link: null},
];

ExpiryIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default ExpiryIndex;
