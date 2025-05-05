import {useState} from "react";
import List from "@mui/material/List";
import {IconButton, ListItem, ListItemSecondaryAction, ListItemText, Stack} from "@mui/material";
import TextField from "@mui/material/TextField";
import {Add, Delete} from "@mui/icons-material";
import {makeId} from "@/Services/helper";

const ConditionsField = ({defaultValue = [], onChange, errors, name}) => {
    const [conditions, setConditions] = useState(defaultValue);
    const handleAdd = () => {
        let id=makeId(6);
        setConditions(prevState => ([...prevState, {condition: "", id,value:""}]));
        onChange({target: {name, value: [...conditions, {condition: "", id,value:""}]}});
    };
    const handleDelete = (id) => () => {
        const temp = [...conditions];
        let index = temp.findIndex((item) => item.id === id);
        temp.splice(index, 1);
        setConditions(temp);
        onChange({target: {name, value: temp}});
    }
    const handleChange = (id) => (e) => {
        const temp = [...conditions];
        let index = temp.findIndex((item) => item.id === id);
        temp[index] = {...temp[index], [e.target.name]: e.target.value};
        setConditions(temp);
        onChange({target: {name, value: temp}});
    }
    return <List dense disablePadding>
        <ListItem>Conditions</ListItem>
        {conditions.map(condition => <ListItem key={condition.id}
                                               secondaryAction={<IconButton onClick={handleDelete(condition.id)}>
                                                   <Delete/>
        </IconButton>}>
                <Stack direction="row" spacing={1}>
                <TextField name="condition"
                           size="small"
                           label="Condition"
                           onChange={handleChange(condition.id)}
                           value={condition.condition}
                           error={Boolean(errors?.[condition.id])}
                           helperText={errors?.[condition.id]}/>
                <TextField name="value"
                           size="small"
                           label="Value"
                           onChange={handleChange(condition.id)}
                           value={condition.value}
                           error={Boolean(errors?.[condition.id])}
                           helperText={errors?.[condition.id]}/>
                </Stack>
        </ListItem>)}
        <ListItem>
            <IconButton onClick={handleAdd}>
                <Add/>
            </IconButton>
        </ListItem>
    </List>
}

export default ConditionsField;
