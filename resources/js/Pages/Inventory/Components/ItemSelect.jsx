import {useState, useCallback} from "react";
import {Autocomplete, TextField, CircularProgress} from "@mui/material";
import axios from "axios";

let debounceTimer = null;

/**
 * Async item search autocomplete.
 *
 * Props:
 *   value        – currently selected item object (or null)
 *   onChange     – fn(item | null) called when selection changes
 *   label        – field label (default "Item")
 *   required     – bool
 *   error        – bool
 *   helperText   – string
 *   size         – MUI size ("small" | "medium")
 */
const ItemSelect = ({value, onChange, label = "Item", required = false, error = false, helperText = "", size = "medium"}) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState("");

    const search = useCallback((query) => {
        clearTimeout(debounceTimer);
        if (!query || query.length < 1) {
            setOptions([]);
            return;
        }
        debounceTimer = setTimeout(async () => {
            setLoading(true);
            try {
                const {data} = await axios.get(route("api.inventory.items.lookup"), {params: {search: query}});
                setOptions(data);
            } catch {
                setOptions([]);
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    return (
        <Autocomplete
            value={value || null}
            inputValue={inputValue}
            options={options}
            loading={loading}
            filterOptions={(x) => x}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            getOptionLabel={(opt) => opt ? `${opt.item_code} — ${opt.name}` : ""}
            onInputChange={(_, newInput, reason) => {
                setInputValue(newInput);
                if (reason === "input") search(newInput);
            }}
            onChange={(_, newValue) => {
                onChange(newValue);
                setInputValue(newValue ? `${newValue.item_code} — ${newValue.name}` : "");
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    required={required}
                    size={size}
                    error={error}
                    helperText={helperText}
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

export default ItemSelect;
