import {useState} from "react";
import {usePage, router} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, Chip, FormControlLabel, Grid, MenuItem,
    Switch, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import {StockBadge} from "../Components/StockBadge";

const DEPARTMENTS = ["LAB", "ADM", "MNT", "CLN", "IT", "FAC"];
const MATERIAL_TYPES = ["CHM", "SLD", "LQD", "ELC", "CSM", "BIO", "GLS", "PPE", "RGT", "OTH"];

const StockIndex = () => {
    const {stock, stores, storeId, filters = {}} = usePage().props;

    const [search,       setSearch]       = useState(filters.search ?? "");
    const [department,   setDepartment]   = useState(filters.department ?? "");
    const [materialType, setMaterialType] = useState(filters.material_type ?? "");
    const [lowStockOnly, setLowStockOnly] = useState(!!filters.low_stock_only);

    const applyFilters = (overrides = {}) => {
        const params = {
            store_id:       storeId || undefined,
            search:         search || undefined,
            department:     department || undefined,
            material_type:  materialType || undefined,
            low_stock_only: lowStockOnly || undefined,
            ...overrides,
        };
        Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
        router.visit(route("inventory.stock.index"), {data: params});
    };

    const resetFilters = () => {
        setSearch(""); setDepartment(""); setMaterialType(""); setLowStockOnly(false);
        router.visit(route("inventory.stock.index"), {data: {}});
    };

    return (
        <>
            <PageHeader title="Current Stock Overview"/>
            <Card sx={{mb: 3}}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <TextField
                                select fullWidth label="Store" size="small"
                                value={storeId || ""}
                                onChange={(e) => applyFilters({store_id: e.target.value || undefined})}
                            >
                                <MenuItem value="">All Stores</MenuItem>
                                {stores.map((s) => (
                                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField fullWidth size="small" label="Search item name / code"
                                value={search} onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && applyFilters()}/>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select fullWidth size="small" label="Department"
                                value={department} onChange={(e) => setDepartment(e.target.value)}>
                                <MenuItem value="">All Departments</MenuItem>
                                {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField select fullWidth size="small" label="Material Type"
                                value={materialType} onChange={(e) => setMaterialType(e.target.value)}>
                                <MenuItem value="">All Types</MenuItem>
                                {MATERIAL_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={1}>
                            <FormControlLabel
                                control={<Switch checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} size="small"/>}
                                label="Low Stock"
                                sx={{m: 0}}
                            />
                        </Grid>
                        <Grid item xs={12} md={1}>
                            <Box sx={{display: "flex", gap: 1}}>
                                <Button variant="contained" size="small" onClick={() => applyFilters()}>Apply</Button>
                                <Button variant="outlined" size="small" onClick={resetFilters}>Reset</Button>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Card>
                <CardContent sx={{p: 0}}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Item Code</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Department</TableCell>
                                <TableCell>Storage</TableCell>
                                <TableCell align="right">Stock (Base Units)</TableCell>
                                <TableCell align="right">Min Level</TableCell>
                                <TableCell>Alert</TableCell>
                                <TableCell/>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {stock.map(({item, total_base, is_low_stock}) => (
                                <TableRow key={item.id} hover>
                                    <TableCell>{item.item_code}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{item.name}</Typography>
                                        {item.scientific_name && (
                                            <Typography variant="caption" color="text.secondary" sx={{fontStyle: "italic"}}>
                                                {item.scientific_name}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell><Chip label={item.department} size="small" variant="outlined"/></TableCell>
                                    <TableCell>{item.storage_condition}</TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" fontWeight={is_low_stock ? "bold" : "normal"}
                                            color={is_low_stock ? "error" : "inherit"}>
                                            {Number(total_base).toFixed(2)} {item.default_unit?.abbreviation}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">{item.minimum_stock_level}</TableCell>
                                    <TableCell>
                                        <StockBadge isLowStock={is_low_stock}/>
                                    </TableCell>
                                    <TableCell>
                                        <Button size="small" startIcon={<VisibilityIcon/>}
                                            onClick={() => router.visit(route("inventory.stock.card", item.id))}>
                                            Card
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {stock.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <Typography color="text.secondary">No stock data found.</Typography>
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

const breadcrumbs = [{title: "Inventory", link: null}, {title: "Current Stock", link: null}];

StockIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>{page}</AuthenticatedLayout>
);

export default StockIndex;
