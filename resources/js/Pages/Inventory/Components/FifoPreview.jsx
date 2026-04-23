import {useEffect, useState} from "react";
import axios from "axios";
import {
    Alert, Box, Chip, CircularProgress, Collapse, Table, TableBody,
    TableCell, TableHead, TableRow, Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

/**
 * Shows FIFO lot breakdown for an outbound line.
 * Props: itemId, storeId, quantityBaseUnits
 */
const FifoPreview = ({itemId, storeId, quantityBaseUnits}) => {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!itemId || !storeId || !quantityBaseUnits || parseFloat(quantityBaseUnits) <= 0) {
            setData(null);
            return;
        }
        setLoading(true);
        axios
            .get(route("api.inventory.fifo.preview"), {
                params: {item_id: itemId, store_id: storeId, quantity_base_units: quantityBaseUnits},
            })
            .then((r) => setData(r.data))
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, [itemId, storeId, quantityBaseUnits]);

    if (!itemId || !storeId || !quantityBaseUnits) return null;

    if (loading) return <Box sx={{py: 1, display: "flex", alignItems: "center", gap: 1}}><CircularProgress size={14}/><Typography variant="caption">Loading FIFO…</Typography></Box>;

    if (!data || data.lots.length === 0) return (
        <Alert severity="warning" icon={<WarningAmberIcon fontSize="small"/>} sx={{py: 0.5, mt: 0.5, fontSize: "0.75rem"}}>
            No stock available for this item/store.
        </Alert>
    );

    return (
        <Collapse in>
            <Box sx={{mt: 0.5, border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden"}}>
                {data.shortfall > 0 && (
                    <Alert severity="error" icon={<WarningAmberIcon fontSize="small"/>} sx={{py: 0.5, fontSize: "0.75rem", borderRadius: 0}}>
                        Shortfall: {data.shortfall.toFixed(4)} base units (have {data.available.toFixed(4)}, need {data.needed.toFixed(4)})
                    </Alert>
                )}
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{"& th": {fontSize: "0.7rem", py: 0.5, bgcolor: "action.hover"}}}>
                            <TableCell>Lot #</TableCell>
                            <TableCell>Brand</TableCell>
                            <TableCell>Expiry</TableCell>
                            <TableCell align="right">Available</TableCell>
                            <TableCell align="right">Will Take</TableCell>
                            <TableCell align="right">Remaining</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.lots.map((lot, i) => {
                            const expiry   = lot.expiry_date;
                            const daysLeft = expiry ? Math.ceil((new Date(expiry) - new Date()) / 86400000) : null;
                            return (
                                <TableRow key={i} sx={{"& td": {fontSize: "0.72rem", py: 0.4}}}>
                                    <TableCell sx={{fontFamily: "monospace"}}>{lot.lot_number}</TableCell>
                                    <TableCell>{lot.brand || "—"}</TableCell>
                                    <TableCell>
                                        {expiry ? (
                                            <Box sx={{display: "flex", alignItems: "center", gap: 0.5}}>
                                                <span>{expiry}</span>
                                                {daysLeft !== null && daysLeft < 0 && <Chip label="EXP" size="small" color="error" sx={{height: 14, fontSize: "0.6rem"}}/>}
                                                {daysLeft !== null && daysLeft >= 0 && daysLeft <= 30 && <Chip label={`${daysLeft}d`} size="small" color="warning" sx={{height: 14, fontSize: "0.6rem"}}/>}
                                            </Box>
                                        ) : "—"}
                                    </TableCell>
                                    <TableCell align="right">{lot.quantity_base_units.toFixed(4)}</TableCell>
                                    <TableCell align="right" sx={{fontWeight: 700, color: "error.main"}}>−{lot.take.toFixed(4)}</TableCell>
                                    <TableCell align="right" sx={{color: lot.remaining_after <= 0 ? "text.disabled" : "inherit"}}>{lot.remaining_after.toFixed(4)}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>
        </Collapse>
    );
};

export default FifoPreview;
