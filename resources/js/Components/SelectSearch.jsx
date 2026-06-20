import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import axios from 'axios';
import PropTypes from 'prop-types';

const SelectSearch = ({
    value,
    onChange,
    name = '',
    url = '',
    helperText = '',
    label = '',
    error = false,
    required = false,
    disabled = false,
    multiple = false,
    sx = null,
    defaultData = {},
    disableFirst = false,
    fullWidth = false,
    size = 'medium',
    startAdornment = null,
}) => {
    const ref = useRef();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!data.length && !disableFirst) handleSearch({ target: { value: '' } });
        if (multiple && Array.isArray(value)) {
            setData((prevState) => {
                return [...prevState, ...value].reduce((a, b) => {
                    let index = a.findIndex((item) => item.id === b.id);
                    if (index < 0) a.push(b);
                    return a;
                }, []);
            });
        } else if (!multiple && value)
            setData((prevState) => {
                return [...prevState, value].reduce((a, b) => {
                    let index = a.findIndex((item) => item.id === b.id);
                    if (index < 0) a.push(b);
                    return a;
                }, []);
            });
        // Mount-only: seed options from the initial value and trigger the first search.
        // handleSearch is recreated each render, so depending on it would loop.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = (e, inputValue, reason) => {
        // Only run for user-typed input, user-clear, or direct calls from useEffect (reason=undefined).
        // Block MUI's internal value-sync calls ('reset', 'blur', 'selectOption', etc.)
        if (reason !== undefined && reason !== 'input' && reason !== 'clear') return;
        setLoading(true);
        axios
            .get(
                url +
                    '?' +
                    new URLSearchParams({
                        ...defaultData,
                        search: inputValue ?? e?.target?.value ?? '',
                    }).toString(),
            )
            .then((result) => {
                const items = Array.isArray(result.data.data) ? result.data.data : [];
                if (multiple && Array.isArray(value)) {
                    setData(
                        [...items, ...value].reduce((a, b) => {
                            let index = a.findIndex((item) => item.id === b.id);
                            if (index < 0) a.push(b);
                            return a;
                        }, []),
                    );
                } else if (!multiple && value)
                    setData(
                        [...items, value].reduce((a, b) => {
                            let index = a.findIndex((item) => item.id === b.id);
                            if (index < 0) a.push(b);
                            return a;
                        }, []),
                    );
                else setData(items);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };
    const handleChange = (_, v) => onChange({ target: { name, value: v } });
    const finalValue = value ? value : multiple ? [] : null;
    return (
        <Autocomplete
            sx={sx}
            size={size}
            ref={ref}
            value={finalValue}
            onChange={handleChange}
            options={data}
            fullWidth={fullWidth}
            name={name}
            getOptionKey={(option) => option?.id}
            multiple={multiple}
            disabled={disabled}
            filterOptions={(options) => options}
            onInputChange={handleSearch}
            getOptionLabel={(option) => option?.name ?? ''}
            loading={loading}
            renderInput={(params) => {
                const { InputProps, inputProps, ...restParams } = params;
                return (
                    <TextField
                        sx={sx}
                        {...restParams}
                        slotProps={{
                            htmlInput: { ...(restParams.slotProps?.htmlInput ?? inputProps) },
                            input: {
                                ...(restParams.slotProps?.input ?? InputProps),
                                startAdornment: (
                                    <>
                                        {startAdornment}
                                        {
                                            (restParams.slotProps?.input ?? InputProps)
                                                ?.startAdornment
                                        }
                                    </>
                                ),
                            },
                        }}
                        helperText={helperText}
                        error={error}
                        label={label}
                        fullWidth={fullWidth}
                        required={required}
                    />
                );
            }}
        />
    );
};
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
    startAdornment: PropTypes.node,
};

export default SelectSearch;
