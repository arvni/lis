import {
    Accordion,
    AccordionActions,
    AccordionDetails,
    Select,
    TextField,
    Chip,
    FormControl,
    InputLabel,
    FormHelperText,
    Paper,
    Tooltip,
    Divider
} from "@mui/material";
import AccordionSummary from "@mui/material/AccordionSummary";
import {
    ExpandMore as ExpandMoreIcon,
    Save as SaveIcon,
    Edit as EditIcon,
    Cancel as CancelIcon,
    Email as EmailIcon,
    Work as WorkIcon,
    Business as BusinessIcon,
    Home as HomeIcon,
    Info as InfoIcon,
    FamilyRestroom as FamilyIcon
} from "@mui/icons-material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { LoadingButton } from "@mui/lab";
import MenuItem from "@mui/material/MenuItem";
import { useForm } from "@inertiajs/react";
import Box from "@mui/material/Box";

// Styled fields for both disabled and enabled states
const inputStyles = {
    '& .Mui-disabled': {
        color: "text.primary",
        WebkitTextFillColor: "text.primary",
        backgroundColor: "rgba(0, 0, 0, 0.03)",
        borderRadius: 1,
        padding: '8px 12px',
        margin: '-8px -12px',
    },
    '& .MuiInputBase-root:before': {
        borderBottomColor: 'rgba(0, 0, 0, 0.1)'
    }
};

const PatientMetaInfo = ({
                             patientMeta,
                             patientId,
                             defaultExpanded = false,
                             editable = false
                         }) => {
    const [edit, setEdit] = useState(false);
    const { reset, data, setData, processing, errors, wasSuccessful, post } = useForm({
        ...patientMeta,
        _method: "put"
    });

    useEffect(() => {
        if (wasSuccessful)
            setEdit(false);
    }, [wasSuccessful]);

    const handleCancel = () => {
        setEdit(false);
        reset();
    };

    const handleEdit = () => setEdit(true);

    const handleSubmit = () => post(route("patients.updateMetas", patientId));

    const handleChange = (e) => {
        setData(prevData => ({ ...prevData, [e.target.name]: e.target.value }));
    };

    // Helper function to render form fields with consistent styling
    const renderFormField = (label, name, value, type = 'text', multiline = false, rows = 1, icon, width = "110px") => {
        return (
            <Box sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: multiline ? 'flex-start' : 'center',
                pt: 1,
                pb: 1
            }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: width,
                    mr: 2
                }}>
                    {icon}
                    <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 500 }}>
                        {label}
                    </Typography>
                </Box>
                <TextField
                    sx={inputStyles}
                    value={value || ''}
                    name={name}
                    disabled={!edit}
                    variant="standard"
                    onChange={handleChange}
                    fullWidth
                    multiline={multiline}
                    rows={rows}
                    type={type}
                    error={errors[name] ? true : false}
                    helperText={errors[name]}
                    placeholder={`Enter ${label.toLowerCase()}`}
                />
            </Box>
        );
    };

    return (
        <Paper elevation={1} sx={{ mb: 3, overflow: 'hidden' }}>
            <Accordion
                defaultExpanded={defaultExpanded}
                disableGutters
                elevation={0}
                sx={{
                    '&:before': {
                        display: 'none',
                    },
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="patient-meta-information"
                    id="patient-meta-information"
                    sx={{
                        backgroundColor: 'primary.lighter',
                        '&.Mui-expanded': {
                            minHeight: 56,
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 500 }}>Additional Information</Typography>
                    </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        {/* First row */}
                        <Grid item xs={12} sm={6} md={4}>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                pt: 1,
                                pb: 1
                            }}>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    minWidth: "110px",
                                    mr: 2
                                }}>
                                    <FamilyIcon color="primary" />
                                    <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 500 }}>
                                        Marital Status
                                    </Typography>
                                </Box>
                                <FormControl fullWidth variant="standard" error={errors.maritalStatus ? true : false}>
                                    <Select
                                        value={data.maritalStatus !== null ? data.maritalStatus : ''}
                                        disabled={!edit}
                                        onChange={handleChange}
                                        name="maritalStatus"
                                        displayEmpty
                                        sx={{
                                            ...inputStyles,
                                            '.MuiSelect-select': {
                                                p: edit ? 'inherit' : '8px 12px',
                                                bgcolor: !edit ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                                                borderRadius: !edit ? 1 : 0,
                                            }
                                        }}
                                    >
                                        <MenuItem value="">
                                            <em>Unknown</em>
                                        </MenuItem>
                                        <MenuItem value={true}>Married</MenuItem>
                                        <MenuItem value={false}>Single</MenuItem>
                                    </Select>
                                    {errors.maritalStatus && <FormHelperText>{errors.maritalStatus}</FormHelperText>}
                                </FormControl>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            {renderFormField("Company", "company", data?.company, "text", false, 1,
                                <BusinessIcon color="primary" />)}
                        </Grid>

                        <Grid item xs={12} sm={6} md={4}>
                            {renderFormField("Profession", "profession", data?.profession, "text", false, 1,
                                <WorkIcon color="primary" />)}
                        </Grid>

                        {/* Second row */}
                        <Grid item xs={12} sm={6} md={4}>
                            {renderFormField("Email", "email", data?.email, "email", false, 1,
                                <EmailIcon color="primary" />)}
                        </Grid>

                        <Grid item xs={12} md={8}>
                            {renderFormField("Address", "address", data?.address, "text", true, 2,
                                <HomeIcon color="primary" />)}
                        </Grid>

                        {/* Third row - Details */}
                        <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            {renderFormField("Details", "details", data?.details, "text", true, 3,
                                <InfoIcon color="primary" />, "110px")}
                        </Grid>
                    </Grid>
                </AccordionDetails>

                {editable && (
                    <AccordionActions
                        sx={{
                            justifyContent: 'flex-end',
                            p: 2,
                            backgroundColor: 'background.default'
                        }}
                    >
                        {edit ? (
                            <Stack direction="row" spacing={2}>
                                <Button
                                    onClick={handleCancel}
                                    variant="outlined"
                                    color="error"
                                    startIcon={<CancelIcon />}
                                >
                                    Cancel
                                </Button>
                                <LoadingButton
                                    onClick={handleSubmit}
                                    variant="contained"
                                    loading={processing}
                                    startIcon={<SaveIcon />}
                                    color="primary"
                                >
                                    Save Changes
                                </LoadingButton>
                            </Stack>
                        ) : (
                            <Tooltip title="Edit patient information">
                                <Button
                                    onClick={handleEdit}
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    color="primary"
                                >
                                    Edit Information
                                </Button>
                            </Tooltip>
                        )}
                    </AccordionActions>
                )}
            </Accordion>
        </Paper>
    );
};

export default PatientMetaInfo;
