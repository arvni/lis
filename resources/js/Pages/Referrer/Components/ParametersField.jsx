import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {makeId} from "@/Services/helper.js";
import {IconButton, ListItem, ListItemText} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import AddIcon from "@mui/icons-material/Add";
import Typography from "@mui/material/Typography";


const ParametersField = ({
                             defaultValue = [],
                             onChange,
                             errors = {},
                             name,
                             label = 'Parameters',
                             placeholder = 'Enter parameter'
                         }) => {
    const [parameters, setParameters] = useState(defaultValue);
    useEffect(() => {
        setParameters(defaultValue)
    }, [defaultValue]);

    const handleAdd = useCallback(() => {
        const newParameter = {
            id: makeId(6),
            value: ''
        };

        const updatedParameters = [...parameters, newParameter];

        setParameters(updatedParameters);
        onChange({target: {name, value: updatedParameters}});
    }, [parameters, name, onChange]);

    const handleDelete = useCallback((id) => () => {
        const updatedParameters = parameters.filter(param => param.id !== id);

        setParameters(updatedParameters);
        onChange({target: {name, value: updatedParameters}});
    }, [parameters, name, onChange]);

    const handleChange = useCallback((id) => (e) => {
        const updatedParameters = parameters.map(param =>
            param.id === id
                ? {...param, value: e.target.value}
                : param
        );

        setParameters(updatedParameters);
        onChange({target: {name, value: updatedParameters}});
    }, [parameters, name, onChange]);

    // Memoize the parameter list to prevent unnecessary re-renders
    const parametersList = useMemo(() => (
        parameters.map(parameter => (
            <ListItem
                key={parameter.id}
                disableGutters
                secondaryAction={
                    <IconButton
                        color="error"
                        aria-label="delete parameter"
                        onClick={handleDelete(parameter.id)}
                    >
                        <DeleteIcon/>
                    </IconButton>
                }
            >
                <ListItemText>
                    <TextField
                        name="value"
                        fullWidth
                        size="small"
                        label={placeholder}
                        variant="outlined"
                        onChange={handleChange(parameter.id)}
                        value={parameter.value}
                        error={Boolean(errors[parameter.id])}
                        helperText={errors[parameter.id]}
                    />
                </ListItemText>
            </ListItem>
        ))
    ), [parameters, errors, handleChange, handleDelete, placeholder]);

    return (
        <>
            <Typography variant="subtitle1"
                        gutterBottom>
                {label}
            </Typography>
            <List dense>
                {parametersList}
                <ListItem disableGutters>
                    <IconButton
                        color="primary"
                        aria-label="add parameter"
                        onClick={handleAdd}
                    >
                        <AddIcon/>
                    </IconButton>
                </ListItem>
            </List>
        </>
    );
};

export default ParametersField;
