import React, {useEffect, useRef, useState} from "react";
import {Autocomplete, TextField} from "@mui/material";
import axios from "axios";
import PropTypes from 'prop-types';


const SelectSearch = ({
                          value,
                          onChange,
                          name = "",
                          url = "",
                          helperText = "",
                          label = "",
                          error = false,
                          required = false,
                          disabled = false,
                          multiple = false,
                          sx = null,
                          defaultData = {},
                          disableFirst = false,
                          fullWidth = false,
    size="medium"
                      }) => {
    const ref = useRef();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!data.length && !disableFirst)
            handleSearch({target: {value: ""}});
        if (multiple && Array.isArray(value)) {
            setData(prevState => {
                return [...prevState,...value].reduce((a, b) => {
                    let index = a.findIndex((item) => item.id === b.id);
                    if (index < 0)
                        a.push(b);
                    return a
                }, [])
            })
        } else if (!multiple && value)
            setData(prevState => {
                return [...prevState,value].reduce((a, b) => {
                    let index = a.findIndex((item) => item.id === b.id);
                    if (index < 0)
                        a.push(b);
                    return a
                }, []);
            })
    }, []);

    const handleSearch = (e) => {
        setLoading(true);
        axios.get(url + "?" + (new URLSearchParams({
            ...defaultData,
            search: e?.target?.value ?? ""
        })).toString(),).then((result) => {
            const items = Array.isArray(result.data.data) ? result.data.data : [];
            if (multiple && Array.isArray(value)) {
                setData([...items, ...value].reduce((a, b) => {
                    let index = a.findIndex((item) => item.id === b.id);
                    if (index < 0)
                        a.push(b);
                    return a
                }, []))
            } else if (!multiple && value)
                setData([...items, value].reduce((a, b) => {
                    let index = a.findIndex((item) => item.id === b.id);
                    if (index < 0)
                        a.push(b);
                    return a
                }, []));
            else
                setData(items)
            setLoading(false);
        }).catch(() => setLoading(false));
    }
    const handleChange = (_, v) => onChange({target: {name, value: v}});
    const finalValue = value ? value : (multiple ? [] : null);
    return <Autocomplete sx={sx}
                         size={size}
                         ref={ref}
                         value={finalValue}
                         onChange={handleChange}
                         options={data}
                         fullWidth={fullWidth}
                         name={name}
                         getOptionKey={(option)=>data.find(op => op.id == option.id)?.id ?? value?.id}
                         multiple={multiple}
                         disabled={disabled}
                         filterOptions={(options)=>options}
                         onInputChange={handleSearch}
                         getOptionLabel={(option) => data.find(op => op.id == option.id)?.name ?? value?.name}
                         loading={loading}
                         renderInput={(params) => <TextField sx={sx} {...params}
                                                             helperText={helperText} error={error}
                                                             label={label}
                                                             fullWidth={fullWidth}
                                                             required={required}/>}
    />;
}
SelectSearch.propTypes = {
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string,
    url: PropTypes.string,
    helperText: PropTypes.string,
    label: PropTypes.string,
    error: PropTypes.bool,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    multiple: PropTypes.bool,
    sx: PropTypes.object,
    defaultData: PropTypes.object,
    disableFirst: PropTypes.bool,
    fullWidth: PropTypes.bool,
    size: PropTypes.string,
};

export default SelectSearch;
