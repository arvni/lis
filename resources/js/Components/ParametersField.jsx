import {useState} from "react";
import List from "@mui/material/List";
import {IconButton, ListItem, ListItemSecondaryAction, ListItemText} from "@mui/material";
import TextField from "@mui/material/TextField";
import {Add, Delete} from "@mui/icons-material";
import {makeId} from "@/Services/helper";

const ParametersField = ({defaultValue = [], onChange, errors, name}) => {
    const [parameters, setParameters] = useState(defaultValue);
    const handleAdd = () => {
        let id=makeId(6);
        setParameters(prevState => ([...prevState, {name: "", id}]));
        onChange({target: {name, value: [...parameters, {value: "", id}]}});
    };
    const handleDelete = (id) => () => {
        const temp = [...parameters];
        let index = temp.findIndex((item) => item.id === id);
        temp.splice(index, 1);
        setParameters(temp);
        onChange({target: {name, value: temp}});
    }
    const handleChange = (id) => (e) => {
        const temp = [...parameters];
        let index = temp.findIndex((item) => item.id === id);
        temp[index].value=e.target.value;
        setParameters(temp);
        onChange({target: {name, value: temp}});
    }
    return <List dense disablePadding>
        <ListItem>Parameters</ListItem>
        {parameters.map(parameter => <ListItem key={parameter.id}>
            <ListItemText>
                <TextField name="value"
                           size="small"
                           label="Parameter name"
                           onChange={handleChange(parameter.id)}
                           value={parameter.value}
                           error={Boolean(errors?.[parameter.id])}
                           helperText={errors?.[parameter.id]}/>
            </ListItemText>
            <ListItemSecondaryAction>
                <IconButton onClick={handleDelete(parameter.id)}><Delete/></IconButton>
            </ListItemSecondaryAction>
        </ListItem>)}
        <ListItem>
            <IconButton onClick={handleAdd}><Add/></IconButton>
        </ListItem>
    </List>
}

export default ParametersField;
