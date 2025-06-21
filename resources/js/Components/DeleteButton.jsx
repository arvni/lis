import {
    Alert,
    Button,
    Card,
    CardActions,
    CardContent,
    CircularProgress,
    IconButton,
    Popper,
} from "@mui/material";
import {Delete as DeleteIcon} from "@mui/icons-material";
import React, {useState} from "react";


const DeleteButton = ({onConfirm}) => {
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleOpenDelete = (event) => {
        setAnchorEl(event.currentTarget);
        setShowConfirmation(true);
    }
    const handleCloseDelete = () => {
        setAnchorEl(null);
        setShowConfirmation(false);
    }

    const handleDelete = () => {
        if (onConfirm)
            onConfirm();
    }
    return <>
        <IconButton color="error" onClick={handleOpenDelete}>
            <DeleteIcon/>
        </IconButton>
        <Popper open={showConfirmation} anchorEl={anchorEl} placement={"top-start"} modifiers={[{
            name: 'arrow',
            enabled: true,
            options: {
                element: anchorEl,
            },
        }]} sx={{zIndex: theme => theme.zIndex.modal + 10}}>
            <Card sx={{minWidth: 275}}>
                <CardContent>
                    <Alert severity="warning">
                        Do You Agree With Deleting This ?
                    </Alert>
                </CardContent>
                <CardActions>
                    <Button size="small" onClick={handleDelete}>Yes</Button>
                    <Button size="small" onClick={handleCloseDelete}>No</Button>
                </CardActions>
            </Card>
        </Popper>

    </>;
}

export default DeleteButton;
