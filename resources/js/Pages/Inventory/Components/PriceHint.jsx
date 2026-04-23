import {useEffect, useState} from "react";
import axios from "axios";
import {Box, Chip, CircularProgress, Tooltip, Typography} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

/**
 * Shows last purchase price(s) for an item as a helper hint.
 * Props: itemId, supplierId (optional)
 */
const PriceHint = ({itemId, supplierId}) => {
    const [prices,  setPrices]  = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!itemId) { setPrices([]); return; }
        setLoading(true);
        axios
            .get(route("api.inventory.items.price-hint"), {
                params: {item_id: itemId, supplier_id: supplierId || undefined},
            })
            .then((r) => setPrices(r.data))
            .catch(() => setPrices([]))
            .finally(() => setLoading(false));
    }, [itemId, supplierId]);

    if (!itemId) return null;
    if (loading) return <CircularProgress size={12}/>;
    if (prices.length === 0) return null;

    return (
        <Box sx={{display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5}}>
            <InfoOutlinedIcon sx={{fontSize: 14, color: "text.secondary", mt: 0.2}}/>
            {prices.map((p, i) => (
                <Tooltip key={i} title={`${p.supplier_name} — last price`} placement="top">
                    <Chip
                        label={`${p.last_purchase_price} ${p.currency}${p.is_preferred ? " ★" : ""}`}
                        size="small"
                        variant="outlined"
                        color={p.is_preferred ? "primary" : "default"}
                        sx={{height: 18, fontSize: "0.68rem", cursor: "default"}}
                    />
                </Tooltip>
            ))}
        </Box>
    );
};

export default PriceHint;
