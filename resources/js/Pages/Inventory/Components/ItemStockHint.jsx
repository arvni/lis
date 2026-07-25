import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Chip, CircularProgress } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

/**
 * Live "current stock" hint for an item within a store. Fetches the item's
 * available base-unit quantity and reports it up via onAvailable so the parent
 * can cap the requested export quantity.
 *
 * Props:
 *  - itemId, storeId: identify which stock to look up
 *  - requestedBase: the requested quantity converted to base units (optional)
 *  - onAvailable(totalBase): called whenever the available amount is (re)fetched
 */
const ItemStockHint = ({ itemId, storeId, requestedBase = null, onAvailable }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!itemId || !storeId) {
            setData(null);
            onAvailable?.(null);
            return;
        }
        setLoading(true);
        axios
            .get(route('api.inventory.items.stock', itemId), { params: { store_id: storeId } })
            .then((r) => {
                setData(r.data);
                onAvailable?.(Number(r.data.total_base));
            })
            .catch(() => {
                setData(null);
                onAvailable?.(null);
            })
            .finally(() => setLoading(false));
        // onAvailable intentionally omitted — parent passes a fresh closure each render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemId, storeId]);

    if (!itemId || !storeId) return null;
    if (loading) return <CircularProgress size={12} sx={{ mt: 0.5 }} />;
    if (!data) return null;

    const exceeded = requestedBase != null && Number(requestedBase) > Number(data.total_base);
    const color = exceeded ? 'error' : data.is_low ? 'warning' : 'success';

    return (
        <Box sx={{ mt: 0.5 }}>
            <Chip
                icon={<Inventory2OutlinedIcon sx={{ fontSize: 14 }} />}
                label={`Available: ${data.formatted}`}
                size="small"
                variant="outlined"
                color={color}
                sx={{ height: 20, fontSize: '0.7rem' }}
            />
            {exceeded && (
                <Chip
                    label="Exceeds stock"
                    size="small"
                    color="error"
                    sx={{ height: 20, fontSize: '0.7rem', ml: 0.5 }}
                />
            )}
        </Box>
    );
};

export default ItemStockHint;
