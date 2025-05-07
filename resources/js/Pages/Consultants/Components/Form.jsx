import React, {useCallback, useState} from "react";
import PropTypes from "prop-types";
import {
    Container,
    Grid2 as Grid,
    TextField,
    Button,
    Switch,
    Typography,
    Paper,
    Box,
    FormControlLabel,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    Divider,
    Alert,
    Snackbar,
    Tooltip,
    Card,
    CardContent,
    useTheme,
    useMediaQuery,
    IconButton
} from "@mui/material";
import {
    Save as SaveIcon,
    Cancel as CancelIcon,
    Person as PersonIcon,
    Schedule as ScheduleIcon,
    Help as HelpIcon,
    CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import AvatarUpload from "@/Components/AvatarUpload";
import PageHeader from "@/Components/PageHeader.jsx";
import WeeklySchedule from "./WeeklySchedule.jsx";
import SelectSearch from "@/Components/SelectSearch.jsx";

// Default time table configuration
export const default_time_table = [

    // Saturday
    [
        {id: 1012, started_at: "9:00", ended_at: "14:00", only_online: false}
    ],
    // Sunday
    [
        {id: 1001, started_at: "09:00", ended_at: "13:00", only_online: false},
        {id: 1002, started_at: "14:00", ended_at: "17:00", only_online: false}
    ],
    // Monday
    [
        {id: 1003, started_at: "09:00", ended_at: "13:00", only_online: false},
        {id: 1004, started_at: "14:00", ended_at: "17:00", only_online: false}
    ],
    // Tuesday
    [
        {id: 1005, started_at: "9:00", ended_at: "13:00", only_online: false},
        {id: 1006, started_at: "14:00", ended_at: "17:00", only_online: false}
    ],
    // Wednesday
    [
        {id: 1007, started_at: "09:00", ended_at: "13:00", only_online: false},
        {id: 1008, started_at: "14:00", ended_at: "17:00", only_online: false}
    ],
    // Thursday
    [
        {id: 1009, started_at: "10:00", ended_at: "14:00", only_online: false},
        {id: 1010, started_at: "15:00", ended_at: "19:00", only_online: false}
    ],
    // Friday
    [
    ],
];

const ConsultantForm = ({values, setValues, cancel, loading, submit, errors, edit}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [activeStep, setActiveStep] = useState(0);
    const [notification, setNotification] = useState({open: false, message: "", severity: "success"});

    // Initialize default_time_table if not present
    React.useEffect(() => {
        if (!values.default_time_table) {
            setValues(prev => ({...prev, default_time_table}));
        }
    }, [setValues, values.default_time_table]);

    const handleChange = useCallback((e) => {
        const {name, value, checked, type} = e.target;
        setValues((prev) => ({...prev, [name]: type === "checkbox" ? checked : value}));
    }, [setValues]);

    const handleFileChange = useCallback((name) => ({data}) => {
        setValues((prev) => ({...prev, [name]: data}));
        showNotification("Profile image updated successfully", "success");
    }, [setValues]);

    const renderTextField = (name, label, type = "text", required = false, helpText = "", icon = null) => (
        <Box sx={{display: 'flex', alignItems: 'flex-start'}}>
            <TextField
                fullWidth
                type={type}
                name={name}
                label={label}
                required={required}
                value={values[name] || ""}
                onChange={handleChange}
                error={Boolean(errors?.[name])}
                helperText={errors?.[name] ?? helpText}
                variant="outlined"
                margin="normal"
                size="medium"
                slotProps={{
                    input: {startAdornment: icon,},
                }}
            />
            {helpText && (
                <Tooltip title={helpText}>
                    <IconButton sx={{mt: 2.5, ml: 1}} size="small">
                        <HelpIcon fontSize="small"/>
                    </IconButton>
                </Tooltip>
            )}
        </Box>
    );

    const handleChangeWeekTimes = (timeSlot) => {
        let updatedTimeTable = [...values.default_time_table];
        let index = updatedTimeTable[timeSlot?.day].findIndex((item) => item.id === timeSlot.id);

        if (index < 0) {
            updatedTimeTable[timeSlot?.day] = [...updatedTimeTable[timeSlot?.day], timeSlot];
        } else {
            updatedTimeTable[timeSlot?.day][index] = timeSlot;
        }

        setValues(prev => ({...prev, default_time_table: updatedTimeTable}));
        showNotification("Schedule updated successfully", "success");
    };

    const handleDeleteWeekTimes = (timeSlot, cb) => {
        let index = values.default_time_table[timeSlot?.day].findIndex((item) => item.id === timeSlot.id);

        if (index >= 0) {
            let updatedTimeTable = [...values.default_time_table];
            updatedTimeTable[timeSlot?.day].splice(index, 1);
            setValues(prev => ({...prev, default_time_table: updatedTimeTable}));
            showNotification("Time slot removed", "info");
        }

        cb();
    };

    const showNotification = (message, severity = "success") => {
        setNotification({open: true, message, severity});
    };

    const closeNotification = () => {
        setNotification({...notification, open: false});
    };

    const handleSubmit = () => {
        // Validate required fields
        if (!values.name) {
            showNotification("Please fill in the required fields", "error");
            setActiveStep(0); // Go back to personal info step
            return;
        }

        submit();
    };

    const handleNext = () => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const steps = [
        {label: "Personal Information", icon: <PersonIcon/>},
        {label: "Schedule", icon: <ScheduleIcon/>}
    ];

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Card variant="outlined" sx={{mb: 3}}>
                        <CardContent>
                            <Grid container spacing={3}>
                                <Grid size={{xs: 12, sm: 6}}>
                                    <AvatarUpload
                                        value={values.avatar}
                                        name="avatar"
                                        tag="AVATAR"
                                        label="Consultant Avatar"
                                        onChange={handleFileChange("avatar")}
                                        error={Boolean(errors?.avatar)}
                                        helperText={errors?.avatar ?? "Upload consultant image"}
                                        uploadUrl={route("documents.store")}
                                    />
                                </Grid>
                                <Grid size={{xs: 12, sm: 6}}>
                                    <Box>
                                        {renderTextField(
                                            "name",
                                            "Full Name",
                                            "text",
                                            true,
                                            "Enter the consultant's full name as it will appear to clients"
                                        )}
                                        {renderTextField(
                                            "title",
                                            "Professional Title",
                                            "text",
                                            false,
                                            "E.g. Senior Consultant, Therapist, Coach, etc."
                                        )}
                                        {renderTextField(
                                            "speciality",
                                            "Expertise",
                                            "text",
                                            false,
                                            "E.g. (MD,M.Sc;Ph.D), etc."
                                        )}

                                        <Box sx={{display: 'flex', alignItems: 'flex-start',mt:2,}}>
                                            <SelectSearch
                                                fullWidth
                                                name="user"
                                                label="Select User Related To Consultant"
                                                required
                                                value={values.user || ""}
                                                onChange={handleChange}
                                                error={Boolean(errors?.user)}
                                                helperText={errors?.user}
                                                url={route("api.users.list")}
                                            />
                                            <Tooltip title="User that manage the consultations">
                                                <IconButton sx={{mt: 2.5, ml: 1}} size="small">
                                                    <HelpIcon fontSize="small"/>
                                                </IconButton>
                                            </Tooltip>
                                        </Box>

                                        <Box sx={{mt: 2}}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={values?.active || false}
                                                        onChange={handleChange}
                                                        name="active"
                                                        color="primary"
                                                    />
                                                }
                                                label={
                                                    <Box>
                                                        <Typography variant="body1">
                                                            Consultant is active
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Inactive users cannot log in to the system
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </Box>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                );
            case 1:
                return (
                    <WeeklySchedule
                        data={values.default_time_table || default_time_table}
                        onChange={handleChangeWeekTimes}
                        onDeleteTimeSlot={handleDeleteWeekTimes}
                    />
                );
            default:
                return "Unknown step";
        }
    };

    return (
        <Container maxWidth="lg">
            <PageHeader title={edit ? "Edit Consultant" : "Add Consultant"}/>

            {/* Stepper for form navigation */}
            <Paper elevation={2} sx={{p: 3, mb: 3}}>
                <Stepper
                    activeStep={activeStep}
                    alternativeLabel={!isMobile}
                    orientation={isMobile ? "vertical" : "horizontal"}
                >
                    {steps.map((step, index) => (
                        <Step key={step.label}>
                            <StepLabel
                                slotProps={{
                                    stepIcon:{icon: activeStep > index ? <CheckCircleIcon color="success"/> : step.icon}
                                }}
                            >
                                {step.label}
                            </StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Paper>

            {/* Form content */}
            <Paper elevation={2} sx={{p: 3, mt: 2}}>
                <Typography variant="h6"
                            gutterBottom
                            color="primary"
                            sx={{display: 'flex', alignItems: 'center'}}>
                    {steps[activeStep].icon}
                    <Box component="span" sx={{ml: 1}}>
                        {steps[activeStep].label}
                    </Box>
                </Typography>

                <Divider sx={{mb: 3}}/>

                {getStepContent(activeStep)}
            </Paper>

            {/* Navigation buttons */}
            <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 4, mb: 2}}>
                <Button
                    variant="outlined"
                    onClick={activeStep === 0 ? cancel : handleBack}
                    disabled={loading}
                    startIcon={<CancelIcon/>}
                >
                    {activeStep === 0 ? "Cancel" : "Back"}
                </Button>

                <Button
                    variant="contained"
                    onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                    disabled={loading}
                    startIcon={activeStep === steps.length - 1 ?
                        (loading ? <CircularProgress size={20} color="inherit"/> : <SaveIcon/>) :
                        null
                    }
                >
                    {activeStep === steps.length - 1 ?
                        (loading ? 'Saving...' : (edit ? 'Update Consultant' : 'Create Consultant')) :
                        'Next'
                    }
                </Button>
            </Box>

            {/* Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={closeNotification}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
            >
                <Alert
                    onClose={closeNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{width: '100%'}}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

ConsultantForm.propTypes = {
    values: PropTypes.object.isRequired,
    setValues: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    submit: PropTypes.func.isRequired,
    errors: PropTypes.object,
    edit: PropTypes.bool
};

ConsultantForm.defaultProps = {
    loading: false,
    errors: {},
    edit: false,
    values: {
        active: true,
        roles: []
    }
};

export default ConsultantForm;
