import {useState} from "react";
import {router, usePage, useForm} from "@inertiajs/react";
import {
    Box, Button, Card, CardContent, CardHeader, Grid, TextField,
    IconButton, Table, TableHead, TableBody, TableRow, TableCell,
    CircularProgress, Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PageHeader from "@/Components/PageHeader";
import ItemSelect from "@/Pages/Inventory/Components/ItemSelect";
import UnitSelect from "@/Pages/Inventory/Components/UnitSelect";
import SupplierSelect from "@/Pages/Inventory/Components/SupplierSelect";
import BrandInput from "@/Pages/Inventory/Components/BrandInput";

const URGENCY_OPTIONS = ["NORMAL", "URGENT"];

const toPayload = ({_item, _unit, _preferred_supplier, ...rest}) => rest;

const lineFromExisting = (line) => ({
    _item: line.item ?? null,
    _unit: line.unit ?? null,
    _preferred_supplier: line.preferred_supplier ?? null,
    item_id: line.item_id,
    unit_id: line.unit_id,
    qty: line.qty ?? "",
    preferred_supplier_id: line.preferred_supplier_id ?? "",
    cat_no: line.cat_no ?? "",
    brand: line.brand ?? "",
    notes: line.notes ?? "",
});

const emptyLine = () => ({
    _item: null,
    _unit: null,
    _preferred_supplier: null,
    item_id: null,
    unit_id: null,
    qty: "",
    preferred_supplier_id: "",
    cat_no: "",
    brand: "",
    notes: "",
});

const Edit = () => {
    const {purchaseRequest} = usePage().props;
    const pr = purchaseRequest;

    const {data, setData, put, processing, errors} = useForm({
        urgency: pr.urgency ?? "NORMAL",
        notes: pr.notes ?? "",
        lines: pr.lines?.map((l) => toPayload(lineFromExisting(l))) ?? [],
    });

    const [lineItems, setLineItems] = useState(() => pr.lines?.map(lineFromExisting) ?? []);

    const syncLines = (updated) => {
        setLineItems(updated);
        setData("lines", updated.map(toPayload));
    };

    const addLine = () => syncLines([...lineItems, emptyLine()]);
    const removeLine = (idx) => syncLines(lineItems.filter((_, i) => i !== idx));

    const setLineItem = (idx, item) => {
        syncLines(lineItems.map((l, i) => i === idx
            ? {...l, _item: item, item_id: item?.id ?? null, _unit: null, unit_id: null}
            : l
        ));
    };

    const setLineUnit = (idx, unit) => {
        syncLines(lineItems.map((l, i) => i === idx
            ? {...l, _unit: unit, unit_id: unit?.id ?? null}
            : l
        ));
    };

    const updateLine = (idx, field, value) => {
        syncLines(lineItems.map((l, i) => i === idx ? {...l, [field]: value} : l));
    };

    const setLineSupplier = (idx, supplier) => {
        syncLines(lineItems.map((l, i) => i === idx
            ? {...l, _preferred_supplier: supplier, preferred_supplier_id: supplier?.id ?? ""}
            : l
        ));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("inventory.purchase-requests.update", pr.id));
    };

    return (
        <>
            <PageHeader title={`Edit Purchase Request #${pr.id}`}/>
            <Box component="form" onSubmit={handleSubmit} sx={{display: "flex", flexDirection: "column", gap: 3}}>
                <Card>
                    <CardHeader title="Request Details"/>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <TextField select fullWidth required label="Urgency"
                                    value={data.urgency} onChange={(e) => setData("urgency", e.target.value)}>
                                    {URGENCY_OPTIONS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                                </TextField>
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
                        title="Requested Items"
                        action={
                            <Button startIcon={<AddIcon/>} onClick={addLine} size="small" variant="outlined">
                                Add Item
                            </Button>
                        }
                    />
                    <CardContent sx={{p: lineItems.length ? 0 : undefined, overflowX: "auto"}}>
                        {lineItems.length === 0 ? (
                            <Alert severity="info" sx={{m: 2}}>Click "Add Item" to begin building your request.</Alert>
                        ) : (
                            <Table size="small" sx={{minWidth: 900}}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{minWidth: 260}}>Item</TableCell>
                                        <TableCell sx={{minWidth: 180}}>Unit</TableCell>
                                        <TableCell sx={{width: 100}}>Qty</TableCell>
                                        <TableCell sx={{minWidth: 130}}>Cat No</TableCell>
                                        <TableCell sx={{minWidth: 140}}>Brand</TableCell>
                                        <TableCell sx={{minWidth: 160}}>Preferred Supplier</TableCell>
                                        <TableCell sx={{minWidth: 140}}>Notes</TableCell>
                                        <TableCell sx={{width: 48}}/>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {lineItems.map((line, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <ItemSelect
                                                    size="small"
                                                    value={line._item}
                                                    onChange={(item) => setLineItem(idx, item)}
                                                    required
                                                    error={!!errors[`lines.${idx}.item_id`]}
                                                    helperText={errors[`lines.${idx}.item_id`]}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <UnitSelect
                                                    size="small"
                                                    itemId={line._item?.id}
                                                    allUnits={[]}
                                                    value={line._unit}
                                                    onChange={(unit) => setLineUnit(idx, unit)}
                                                    required
                                                    error={!!errors[`lines.${idx}.unit_id`]}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField size="small" type="number" placeholder="Qty"
                                                    value={line.qty}
                                                    onChange={(e) => updateLine(idx, "qty", e.target.value)}
                                                    inputProps={{min: 0, step: "any"}} fullWidth
                                                    error={!!errors[`lines.${idx}.qty`]}/>
                                            </TableCell>
                                            <TableCell>
                                                <TextField size="small" fullWidth placeholder="Cat No"
                                                    value={line.cat_no}
                                                    onChange={(e) => updateLine(idx, "cat_no", e.target.value)}/>
                                            </TableCell>
                                            <TableCell>
                                                <BrandInput
                                                    value={line.brand}
                                                    itemId={line._item?.id}
                                                    onChange={(v) => updateLine(idx, "brand", v)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <SupplierSelect
                                                    size="small"
                                                    label="Preferred Supplier"
                                                    value={line._preferred_supplier}
                                                    onChange={(s) => setLineSupplier(idx, s)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField size="small" fullWidth placeholder="Notes"
                                                    value={line.notes}
                                                    onChange={(e) => updateLine(idx, "notes", e.target.value)}/>
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" color="error" onClick={() => removeLine(idx)}>
                                                    <DeleteIcon fontSize="small"/>
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {errors.lines && (
                            <Alert severity="error" sx={{mt: 1}}>{errors.lines}</Alert>
                        )}
                    </CardContent>
                </Card>

                <Box sx={{display: "flex", gap: 2}}>
                    <Button onClick={() => router.visit(route("inventory.purchase-requests.show", pr.id))}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" color="primary"
                        disabled={processing || lineItems.length === 0}
                        startIcon={processing && <CircularProgress size={16}/>}>
                        Save Changes
                    </Button>
                </Box>
            </Box>
        </>
    );
};

const breadcrumbs = (pr) => [
    {title: "Inventory", link: null},
    {title: "Purchase Requests", link: route("inventory.purchase-requests.index")},
    {title: `#${pr?.id || ""}`, link: route("inventory.purchase-requests.show", pr?.id)},
    {title: "Edit", link: null},
];

Edit.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs(page.props.purchaseRequest)}>{page}</AuthenticatedLayout>
);

export default Edit;
