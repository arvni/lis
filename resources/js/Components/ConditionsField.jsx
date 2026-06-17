import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { List, ListItem, IconButton, TextField, Box, Typography, Stack } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { makeId } from '@/Services/helper';

const ConditionsField = ({
    onChange,
    name,
    defaultValue = [],
    errors = {},
    label = 'Conditions',
}) => {
    const [conditions, setConditions] = useState(defaultValue);

    useEffect(() => {
        setConditions(defaultValue);
    }, [defaultValue]);

    const handleAdd = useCallback(() => {
        const newCondition = {
            id: makeId(6),
            condition: '',
            value: '',
        };

        const updatedConditions = [...conditions, newCondition];

        setConditions(updatedConditions);
        onChange({ target: { name, value: updatedConditions } });
    }, [conditions, name, onChange]);

    const handleDelete = useCallback(
        (id) => {
            const updatedConditions = conditions.filter((condition) => condition.id !== id);

            setConditions(updatedConditions);
            onChange({ target: { name, value: updatedConditions } });
        },
        [conditions, name, onChange],
    );

    const handleChange = useCallback(
        (id) => (e) => {
            const { name: fieldName, value } = e.target;

            const updatedConditions = conditions.map((condition) =>
                condition.id === id ? { ...condition, [fieldName]: value } : condition,
            );

            setConditions(updatedConditions);
            onChange({ target: { name, value: updatedConditions } });
        },
        [conditions, name, onChange],
    );

    const getFieldError = useMemo(() => {
        return (id) => errors[id];
    }, [errors]);

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
                {label}
            </Typography>
            <List dense disablePadding>
                {conditions.map((condition) => (
                    <ListItem
                        key={condition.id}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            paddingX: 0,
                            paddingY: 1,
                        }}
                        disableGutters
                    >
                        <Stack
                            direction="row"
                            spacing={2}
                            sx={{
                                flexGrow: 1,
                                alignItems: 'center',
                            }}
                        >
                            <TextField
                                name="condition"
                                size="small"
                                label="Condition"
                                fullWidth
                                value={condition.condition}
                                onChange={handleChange(condition.id)}
                                error={Boolean(getFieldError(condition.id))}
                                helperText={getFieldError(condition.id)}
                            />
                            <TextField
                                name="value"
                                size="small"
                                label="Value"
                                fullWidth
                                value={condition.value}
                                onChange={handleChange(condition.id)}
                                error={Boolean(getFieldError(condition.id))}
                                helperText={getFieldError(condition.id)}
                            />
                            <IconButton
                                onClick={() => handleDelete(condition.id)}
                                color="error"
                                size="small"
                                edge="end"
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Stack>
                    </ListItem>
                ))}

                <ListItem
                    sx={{
                        justifyContent: 'center',
                        paddingY: 1,
                    }}
                    disableGutters
                >
                    <IconButton onClick={handleAdd} color="primary" aria-label="Add condition">
                        <AddIcon />
                    </IconButton>
                </ListItem>
            </List>
        </Box>
    );
};

ConditionsField.propTypes = {
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    defaultValue: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string,
            condition: PropTypes.string,
            value: PropTypes.string,
        }),
    ),
    errors: PropTypes.object,
    label: PropTypes.string,
};

export default ConditionsField;
