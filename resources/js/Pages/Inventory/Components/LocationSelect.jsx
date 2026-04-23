import {useState, useEffect} from "react";
import {Autocomplete, TextField, CircularProgress, Typography} from "@mui/material";
import axios from "axios";

/**
 * Loads store locations filtered by item and transaction type.
 *
 * Props:
 *   storeId         – numeric store id (required)
 *   itemId          – numeric item id — when provided with type, filters locations
 *   transactionType – e.g. "ENTRY" | "EXPORT" | "RETURN" etc.
 *   value           – selected location object or null
 *   onChange        – fn(location | null)
 *   label           – field label
 *   size            – MUI size
 */
const LocationSelect = ({storeId, itemId, transactionType, value, onChange, label = "Location (optional)", size = "medium"}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!storeId) {
            setOptions([]);
            onChange(null);
            return;
        }
        setLoading(true);
        const params = {};
        if (itemId) params.item_id = itemId;
        if (transactionType) params.type = transactionType;

        axios.get(route("api.inventory.stores.locations", storeId), {params})
            .then(({data}) => {
                setOptions(data);
                // If current value is no longer in filtered list, clear it
                if (value && !data.find(l => l.id === value.id)) {
                    onChange(null);
                }
            })
            .catch(() => setOptions([]))
            .finally(() => setLoading(false));
    }, [storeId, itemId, transactionType]);

    return (
        <Autocomplete
            value={value || null}
            options={options}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            getOptionLabel={(opt) => opt?.label ?? ""}
            onChange={(_, newValue) => onChange(newValue)}
            noOptionsText={
                !storeId ? "Select a store first" :
                "No locations — add locations to this store first"
            }
            renderOption={(props, opt) => (
                <Typography component="li" {...props} key={opt.id} variant="body2">
                    {opt.label}
                    {(opt.zone || opt.shelf || opt.bin) && (
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ml: 1}}>
                            {[opt.zone, opt.row, opt.shelf, opt.bin].filter(Boolean).join(" · ")}
                        </Typography>
                    )}
                </Typography>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
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

export default LocationSelect;
