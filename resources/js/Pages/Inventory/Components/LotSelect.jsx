import {useState, useEffect, useCallback} from "react";
import {Autocomplete, TextField, CircularProgress, Typography, Box} from "@mui/material";
import axios from "axios";

let debounceTimer = null;

/**
 * Searchable lot selector for outbound transactions.
 *
 * Props:
 *   itemId   – numeric item id (required for outbound)
 *   storeId  – numeric store id for filtering
 *   value    – selected lot object or null
 *   onChange – fn(lot | null)
 *   size     – MUI size
 */
const LotSelect = ({itemId, storeId, value, onChange, size = "medium", disabled = false}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const fetchLots = useCallback((search = "") => {
        if (!itemId) {
            setOptions([]);
            return;
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            setLoading(true);
            const params = {search};
            if (storeId) params.store_id = storeId;
            axios.get(route("api.inventory.items.lots", itemId), {params})
                .then(({data}) => setOptions(data))
                .catch(() => setOptions([]))
                .finally(() => setLoading(false));
        }, 250);
    }, [itemId, storeId]);

    // Reload when item or store changes
    useEffect(() => {
        onChange(null);
        setInputValue("");
        fetchLots("");
    }, [itemId, storeId]);

    const getLabel = (opt) => {
        if (!opt) return "";
        return opt.brand ? `${opt.lot_number} · ${opt.brand}` : opt.lot_number;
    };

    return (
        <Autocomplete
            value={value || null}
            inputValue={inputValue}
            options={options}
            loading={loading}
            disabled={disabled}
            filterOptions={(x) => x}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            getOptionLabel={getLabel}
            noOptionsText={!itemId ? "Select an item first" : "No matching lots"}
            onInputChange={(_, newInput, reason) => {
                setInputValue(newInput);
                if (reason === "input") fetchLots(newInput);
            }}
            onChange={(_, newValue) => {
                onChange(newValue);
                setInputValue(newValue ? getLabel(newValue) : "");
            }}
            renderOption={(props, opt) => (
                <Box component="li" {...props} key={opt.id}>
                    <Box>
                        <Typography variant="body2">
                            {opt.lot_number}
                            {opt.brand && (
                                <Typography component="span" variant="body2" color="primary.main" sx={{ml: 1}}>
                                    {opt.brand}
                                </Typography>
                            )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Qty: {opt.quantity_base_units}
                            {opt.expiry_date ? ` · Exp: ${opt.expiry_date.substring(0, 10)}` : ""}
                        </Typography>
                    </Box>
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Lot / Brand"
                    size={size}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading && <CircularProgress size={16}/>}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
};

export default LotSelect;
