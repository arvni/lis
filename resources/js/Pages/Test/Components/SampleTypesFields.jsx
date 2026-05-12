import List from "@mui/material/List";
import React, {useState} from "react";
import {Alert, ListItem, ListItemIcon, ListItemText} from "@mui/material";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddSampleType from "@/Pages/Test/Components/AddSampleType";
import Button from "@mui/material/Button";

const SampleTypeFields = ({sampleTypes, onChange, error, name}) => {
    const [sampleType, setSampleType] = useState({
        sample_type: null,
        description: "",
        defaultType: false
    });
    const [openSampleType, setOpenSampleType] = useState(false);
    const closeSampleType = () => {
        setOpenSampleType(false);
    }
    const rowKey = (item) => item?.sample_type?.id ?? item?.sample_type_id;
    const find = (id) => {
        const index = sampleTypes.findIndex((item) => rowKey(item) + "" === id + "");
        return {sample_type: index > -1 ? sampleTypes[index] : undefined, index};
    }
    const sampleTypeChange = () => {
        const tmp = [...sampleTypes];
        const index = find(rowKey(sampleType)).index;
        if (index > -1)
            tmp[index] = sampleType;
        else
            tmp.push(sampleType);
        onChange(name, tmp);
        closeSampleType();
    }
    const sampleTypeEdit = (id) => () => {
        const tmp = find(id);
        setSampleType(tmp.sample_type);
        setOpenSampleType(true);
    }
    const sampleTypeDelete = (id) => () => {
        const tmp = [...sampleTypes];
        tmp.splice(find(id).index, 1);
        onChange(name, tmp);
    }
    const addSampleType = () => {
        setSampleType({
            sample_type: null,
            description: "",
            defaultType: false
        });
        setOpenSampleType(true);
    }
    return <>
        {error && <Alert severity="error">{error}</Alert>}
        <List sx={{maxWidth: "100%"}}>
            {sampleTypes.map(item => {
                const id = rowKey(item);
                return (
                <React.Fragment key={id}>
                    <ListItem secondaryAction={[
                        <IconButton color="warning"
                                    key={`edit-button-${id}`}
                                    onClick={sampleTypeEdit(id)}>
                            <EditIcon/>
                        </IconButton>,
                        <IconButton color="error"
                                    key={`delete-button-${id}`}
                                    onClick={sampleTypeDelete(id)}>
                            <DeleteIcon/>
                        </IconButton>
                    ]}>
                        <ListItemIcon>{item.sample_type.name}</ListItemIcon>
                        <Typography sx={{mx: "1em"}}/>
                        <ListItemText>
                            {item.description}
                            {!item.defaultType ? "" : "  |  Default Sample Type"}
                        </ListItemText>
                    </ListItem>
                </React.Fragment>
                );
            })}
        </List>
        <Button onClick={addSampleType}>Add SampleType</Button>
        <AddSampleType onClose={closeSampleType}
                       open={openSampleType}
                       onChange={sampleTypeChange}
                       sampleType={sampleType}
                       setSampleType={setSampleType}/>
    </>
}
export default SampleTypeFields;
