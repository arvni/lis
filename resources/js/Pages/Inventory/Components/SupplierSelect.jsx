import {useState, useEffect} from "react";
import {Autocomplete, TextField, CircularProgress} from "@mui/material";
import axios from "axios";

let debounceTimer = null;

/**
 * Async supplier search autocomplete.
 *
 * Props:
 *   value      – selected supplier object (or null)
 *   onChange   – fn(supplier | null)
 *   label      – field label (default "Supplier")
 *   required   – bool
 *   error      – bool
 *   helperText – string
 *   size       – "small" | "medium"
 *   disabled   – bool
 */
const SupplierSelect = ({
    value = null,
    onChange,
    label = "Supplier",
    required = false,
    error = false,
    helperText = "",
    size = "medium",
    disabled = false,
}) => {
    const [options,     setOptions]     = useState([]);
    const [loading,     setLoading]     = useState(false);
    const [inputValue,  setInputValue]  = useState("");

    // Seed options with current value so it renders on load
    useEffect(() => {
        if (value && !options.find((o) => o.id === value.id))
            setOptions((prev) => [value, ...prev]);
    }, [value]);

    const search = (query) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            setLoading(true);
            try {
                const {data} = await axios.get(route("api.inventory.suppliers.lookup"), {
                    params: {search: query},
                });
                setOptions(data);
            } catch {
                setOptions([]);
            } finally {
                setLoading(false);
            }
        }, 300);
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
            getOptionLabel={(opt) => opt ? `${opt.name}${opt.code ? ` (${opt.code})` : ""}` : ""}
            onInputChange={(_, newInput, reason) => {
                setInputValue(newInput);
                if (reason === "input") search(newInput);
                if (reason === "clear") search("");
            }}
            onOpen={() => { if (!options.length) search(""); }}
            onChange={(_, newValue) => {
                onChange(newValue);
                setInputValue(newValue ? `${newValue.name}${newValue.code ? ` (${newValue.code})` : ""}` : "");
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

export default SupplierSelect;
