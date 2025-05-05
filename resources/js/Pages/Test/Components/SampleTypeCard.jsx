import React, {useState} from "react";
import {Card, CardActions, CardContent} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import DeleteForm from "@/Components/DeleteForm";

const SampleTypeCard = ({id, text, index, findCard, sampleType, onEdit, onDelete, ...props}) => {
    const [openDelete, setOpenDelete] = useState(false);
    const handleDelete = () => setOpenDelete(true);
    const closeOpenDelete = () => setOpenDelete(false);
    const handleEdit = () => onEdit(id);
    const destroy = () => onDelete(id);


    return <Card variant={"outlined"} {...props} >
        <CardContent>
            <Typography variant={"h4"}>{sampleType?.SampleType.name}</Typography>
            <Typography variant={"p"}>{sampleType.description}</Typography>
        </CardContent>
        <CardActions>
            <IconButton onClick={handleEdit} type={"button"} color={"warning"}><EditIcon/></IconButton>
            <IconButton onClick={handleDelete} type={"button"} color={"error"}><DeleteIcon/></IconButton>
        </CardActions>
        <DeleteForm title={`${sampleType?.sampleType.name} SampleType`} agreeCB={destroy} disAgreeCB={closeOpenDelete}
                    openDelete={openDelete}/>
    </Card>
};
export default SampleTypeCard;
