import {useState, useEffect} from "react";
import {Autocomplete, TextField, CircularProgress} from "@mui/material";
import axios from "axios";

/**
 * Unit selector. When itemId is provided, fetches only units valid for that
 * item (base + conversions). When itemId is null, shows all passed-in units.
 *
 * Props:
 *   itemId     – numeric item id (or null)
 *   allUnits   – fallback unit list [{id, name, abbreviation}] passed from server
 *   value      – selected unit object or null
 *   onChange   – fn(unit | null)
 *   label      – field label (default "Unit")
 *   required   – bool
 *   error      – bool
 *   helperText – string
 *   size       – MUI size
 */
const UnitSelect = ({itemId, allUnits = [], value, onChange, label = "Unit", required = false, error = false, helperText = "", size = "medium"}) => {
    const [itemUnits, setItemUnits] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!itemId) {
            setItemUnits(null);
            return;
        }
        setLoading(true);
        axios.get(route("api.inventory.items.units", itemId))
            .then(({data}) => setItemUnits(data))
            .catch(() => setItemUnits(null))
            .finally(() => setLoading(false));
    }, [itemId]);

    const options = itemUnits ?? allUnits;

    return (
        <Autocomplete
            value={value || null}
            options={options}
            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
            getOptionLabel={(opt) => opt ? `${opt.name} (${opt.abbreviation})` : ""}
            onChange={(_, newValue) => onChange(newValue)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    required={required}
                    size={size}
                    error={error}
                    helperText={helperText || (itemId && itemUnits ? `${options.length} unit(s) available` : "")}
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

export default UnitSelect;
