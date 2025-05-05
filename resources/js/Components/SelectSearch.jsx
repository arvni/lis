import React, {useEffect, useRef, useState} from "react";
import {Autocomplete, TextField} from "@mui/material";
import axios from "axios";


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
            if (multiple && Array.isArray(value)) {
                setData([...result.data.data, ...value].reduce((a, b) => {
                    let index = a.findIndex((item) => item.id === b.id);
                    if (index < 0)
                        a.push(b);
                    return a
                }, []))
            } else if (!multiple && value)
                setData([...result.data.data, value].reduce((a, b) => {
                    let index = a.findIndex((item) => item.id === b.id);
                    if (index < 0)
                        a.push(b);
                    return a
                }, []));
            else
                setData(result.data.data)
            setLoading(false);
        });
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
export default SelectSearch;
