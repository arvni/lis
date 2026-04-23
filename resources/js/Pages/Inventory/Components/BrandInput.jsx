import {useState, useEffect} from "react";
import {Autocomplete, TextField, CircularProgress} from "@mui/material";
import axios from "axios";

let debounceTimer = null;

/**
 * Brand free-text input with suggestions fetched from existing transaction lines.
 *
 * Props:
 *   value    – current brand string
 *   onChange – fn(string)
 *   itemId   – item ID used to fetch suggestions (optional)
 *   size     – "small" | "medium"
 *   disabled – bool
 *   label    – string
 */
const BrandInput = ({
    value = "",
    onChange,
    itemId = null,
    size = "small",
    disabled = false,
    label = "Brand",
}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load suggestions whenever itemId changes or on first mount
    useEffect(() => {
        if (!itemId) { setOptions([]); return; }
        fetchSuggestions("");
    }, [itemId]);

    const fetchSuggestions = (search) => {
        if (!itemId) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            setLoading(true);
            try {
                const {data} = await axios.get(route("api.inventory.brands.suggestions"), {
                    params: {item_id: itemId, search},
                });
                setOptions(data);
            } catch {
                setOptions([]);
            } finally {
                setLoading(false);
            }
        }, 250);
    };

    return (
        <Autocomplete
            freeSolo
            value={value || ""}
            options={options}
            disabled={disabled}
            filterOptions={(x) => x}
            inputValue={value || ""}
            onInputChange={(_, newVal) => {
                onChange(newVal ?? "");
                fetchSuggestions(newVal);
            }}
            onChange={(_, newVal) => onChange(newVal ?? "")}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    size={size}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading && <CircularProgress size={14}/>}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
        />
    );
};

export default BrandInput;
