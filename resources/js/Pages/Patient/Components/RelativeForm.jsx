import React, {useState} from "react";
import {
    Box,
    Divider,
    List,
    IconButton,
    ListItem,
    Typography,
    Chip,
    Tooltip,
    Button,
    Card,
    Avatar,
    alpha
} from "@mui/material";
import {
    PersonAdd as PersonAddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Visibility as VisibilityIcon,
    Person as PersonIcon
} from "@mui/icons-material";
import Grid from "@mui/material/Grid2";
import AddRelative from "./AddRelative";
import DeleteForm from "@/Components/DeleteForm";
import {useForm} from "@inertiajs/react";

// Utility function to get the relationship color
const getRelationshipColor = (relationship) => {
    const colors = {
        father: 'primary',
        mother: 'primary',
        husband: 'secondary',
        wife: 'secondary',
        brother: 'info',
        sister: 'info',
        child: 'success',
        default: 'default'
    };

    return colors[relationship] || colors.default;
};

// Utility function to get the relationship icon
const getRelationshipIcon = (relationship, gender) => {
    // This would be better with actual icons for each relationship type
    // For simplicity, we're just returning a person icon for now
    return <PersonIcon fontSize="small"/>;
};

const RelativeForm = ({
                          relatives = [],
                          patientId,
                          edit = false,
                          canEdit = false
                      }) => {
    const {data, setData, post, processing, reset, errors, setError} = useForm({
        avatar: "",
        fullName: "",
        idNo: "",
        nationality: null,
        dateOfBirth: "",
        gender: null,
        relationship: "",
        patient_id: patientId
    });

    const [open, setOpen] = useState(false);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);

    const add = () => {
        reset();
        setData(prevData => ({
            ...prevData,
            patient_id: patientId
        }));
        setOpen(true);
    };

    const editRelative = index => () => {
        setData(prevData => ({
            ...prevData,
            ...relatives[index],
            _method: "put",
            relative_id: relatives[index].id,
            id: relatives[index].relative_id,
            relationship: relatives[index].relationship
        }));
        setOpen(true);
    };

    const destroy = (index) => e => {
        setData(prevData => ({
            ...prevData,
            ...relatives[index],
            _method: "delete",
            relative_id: relatives[index].id,
            id: relatives[index].relative_id,
            relationship: relatives[index].relationship
        }));
        setOpenDeleteForm(true);
    };

    const handleDestroy = () => {
        post(route("relatives.destroy", data.id));
        closeDestroy();
    };

    const closeDestroy = () => {
        setOpenDeleteForm(false);
        reset();
    };

    const close = () => {
        setOpen(false);
        reset();
    };

    const submit = () => post(data.id ? route('relatives.update', data.id) : route('relatives.store'), {
        onSuccess: close
    });

    return (
        <Box>
            {/* Add Family Member Button - Prominently displayed if in edit mode */}
            {edit && (
                <Box sx={{display: 'flex', justifyContent: 'flex-end', mb: 2}}>
                    <Button
                        variant="contained"
                        startIcon={<PersonAddIcon/>}
                        onClick={add}
                        color="primary"
                    >
                        Add Family Member
                    </Button>
                </Box>
            )}

            {/* Family Members List */}
            {relatives.length > 0 ? (
                <Card variant="outlined" sx={{mb: 3}}>
                    <Box sx={{
                        bgcolor: 'background.paper',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        px: 3,
                        py: 1.5
                    }}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid size={{xs: 4}}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Full Name
                                </Typography>
                            </Grid>
                            <Grid size={{xs: 3}}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    ID Number
                                </Typography>
                            </Grid>
                            <Grid size={{xs: 3}}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Relationship
                                </Typography>
                            </Grid>
                            <Grid size={{xs: 2}} sx={{textAlign: 'right'}}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Actions
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    <List disablePadding>
                        {relatives.map((item, index) => (
                            <React.Fragment key={item.id}>
                                <ListItem
                                    sx={{
                                        py: 1.5,
                                        ':hover': {
                                            bgcolor: alpha('#000', 0.03)
                                        },
                                        width: "100%"
                                    }}
                                >
                                    <Grid container alignItems="center" spacing={2} sx={{width: "100%"}}>
                                        <Grid size={{xs: 4}}>
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                <Avatar
                                                    src={item.avatar}
                                                    alt={item.fullName}
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        mr: 1.5,
                                                        bgcolor: getRelationshipColor(item.relationship) + '.main'
                                                    }}
                                                >
                                                    {item.fullName ? item.fullName.charAt(0).toUpperCase() : 'U'}
                                                </Avatar>
                                                <Typography variant="body1">{item.fullName}</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid size={{xs: 3}}>
                                            <Typography variant="body2">{item.idNo}</Typography>
                                        </Grid>
                                        <Grid size={{xs: 3}}>
                                            <Chip
                                                icon={getRelationshipIcon(item.relationship, item.gender)}
                                                label={item.relationship ? item.relationship.charAt(0).toUpperCase() + item.relationship.slice(1) : ''}
                                                size="small"
                                                color={getRelationshipColor(item.relationship)}
                                                variant="outlined"
                                            />
                                        </Grid>
                                        <Grid size={{xs: 2}}>
                                            <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                                                <Tooltip title="View Details">
                                                    <IconButton
                                                        href={route("patients.show", item.id)}
                                                        target="_blank"
                                                        size="small"
                                                        color="primary"
                                                        sx={{mr: 0.5}}
                                                    >
                                                        <VisibilityIcon fontSize="small"/>
                                                    </IconButton>
                                                </Tooltip>

                                                {edit && (
                                                    <>
                                                        <Tooltip title="Edit">
                                                            <IconButton
                                                                onClick={editRelative(index)}
                                                                size="small"
                                                                color="info"
                                                                sx={{mr: 0.5}}
                                                            >
                                                                <EditIcon fontSize="small"/>
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Remove">
                                                            <IconButton
                                                                onClick={destroy(index)}
                                                                size="small"
                                                                color="error"
                                                            >
                                                                <DeleteIcon fontSize="small"/>
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </ListItem>
                                {index < relatives.length - 1 && <Divider/>}
                            </React.Fragment>
                        ))}
                    </List>
                </Card>
            ) : (
                <Box
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        bgcolor: 'background.paper',
                        border: '1px dashed',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 3
                    }}
                >
                    <Typography variant="body1" color="text.secondary" paragraph>
                        No family members have been added yet.
                    </Typography>

                    {edit && (
                        <Button
                            variant="outlined"
                            startIcon={<PersonAddIcon/>}
                            onClick={add}
                        >
                            Add Family Member
                        </Button>
                    )}
                </Box>
            )}

            {/* Dialogs */}
            {open && <AddRelative
                onClose={close}
                setRelative={setData}
                errors={errors}
                setError={setError}
                open={open}
                OnSubmit={submit}
                relative={data}
                processing={processing}
            />}

            <DeleteForm
                title={`Remove ${data.fullName}${data.relationship ? ` (${data.relationship})` : ''}`}
                content={`Are you sure you want to remove this family member? This action cannot be undone.`}
                agreeCB={handleDestroy}
                disAgreeCB={closeDestroy}
                openDelete={openDeleteForm}
            />
        </Box>
    );
};

export default RelativeForm;
