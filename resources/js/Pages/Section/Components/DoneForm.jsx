import React, {useState, useMemo} from "react";
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    FormControl,
    InputLabel,
    Select,
    FormHelperText,
    Button,
    Divider,
    Box,
    Typography,
    Chip,
    Paper,
    useTheme,
    Alert,
    IconButton,
    Tooltip,
    Grid2 as Grid,
    MenuItem
} from "@mui/material";
import {
    Close as CloseIcon,
    CheckCircle,
    ErrorOutline,
    MedicalServices,
    LocalHospital,
    Science,
    ArrowBack,
    Warning
} from "@mui/icons-material";
import Upload from "@/Components/Upload";

// Define the action types
const ACTION_TYPES = {
    COMPLETE: 'finished',
    REJECT: 'rejected',
    UPDATE: 'Update'
};

/**
 * WorkflowActionForm - A unified component for handling both completion and rejection actions
 *
 * @param {Object} props
 * @param {boolean} props.open - Controls whether the dialog is open
 * @param {Function} props.onClose - Handler for closing the dialog
 * @param {Object} props.acceptanceItemState - The current state item
 * @param {Function} props.onChange - Handler for form field changes
 * @param {Function} props.onSubmit - Handler for form submission
 * @param {Array} props.options - Options for the "Return to Section" select (used only for reject)
 * @param {string} props.actionType - Type of action: 'complete' or 'reject'
 */
const WorkflowActionForm = ({
                                open,
                                onClose,
                                acceptanceItemState,
                                onChange,
                                onSubmit,
                                options = [],
                                actionType = ACTION_TYPES.COMPLETE
                            }) => {
    const theme = useTheme();
    const [errors, setErrors] = useState({});

    // Determine if this is a completion or rejection form
    const isReject = actionType === ACTION_TYPES.REJECT;

    // Configure theme elements based on action type
    const actionConfig = useMemo(() => ({
        title: isReject ? "Reject Section" : "Complete Section",
        icon: isReject ? <Warning/> : <CheckCircle/>,
        color: isReject ? "error" : "primary",
        buttonText: isReject ? "Reject Section" : "Complete Section",
        buttonIcon: isReject ? <ErrorOutline/> : <CheckCircle/>,
        headerColor: isReject ? theme.palette.error.main : theme.palette.primary.main,
        headerTextColor: isReject ? theme.palette.error.contrastText : theme.palette.primary.contrastText
    }), [isReject, theme]);

    const handleParametersChange = e => {
            let parameters = acceptanceItemState.parameters;
            let parameterIndex = parameters.findIndex((item) => item.name === e.target.name);
            parameters[parameterIndex] = {...parameters[parameterIndex], value: e.target.value};
            onChange("parameters", parameters);
    };

    const handleFileParameter = (name, value) => {
            let parameters = acceptanceItemState.parameters;
            let parameterIndex = parameters.findIndex((item) => item.name === name);
            parameters[parameterIndex] = {...parameters[parameterIndex], value};
            onChange("parameters", parameters);
    };

    const handleChange = e => onChange(e.target.name, e.target.value);

    const handleSubmit = () => {
        if (check()) onSubmit();
    };

    const check = () => {
        let tmp = {};

        // Common validation
        acceptanceItemState?.parameters?.forEach((item) => {
            if (!item.value && item.required)
                tmp = {...tmp, [item.name]: `Please enter ${item.name} value`};
        });

        // Rejection-specific validation
        if (isReject) {
            if (!acceptanceItemState.details)
                tmp = {...tmp, details: `Please provide rejection details`};

            if (acceptanceItemState.next == null)
                tmp = {...tmp, next: `Please select a section to return to`};
        }

        setErrors(tmp);
        return Object.keys(tmp).length < 1;
    };

    const renderItem = (item) => {
        switch (item.type) {
            case "file":
                return (
                    <Box sx={{mb: 2}}>
                        <Upload
                            value={item?.value}
                            label={item.name}
                            name={item.name}
                            url={route("documents.store", {
                                ownerClass: "Patient",
                                id: acceptanceItemState?.patient?.id
                            })}
                            onChange={handleFileParameter}
                            error={errors.hasOwnProperty(item.name)}
                            helperText={errors[item.name] ?? null}
                            required={item.required}
                        />
                    </Box>
                );
            case "options":
                return (
                    <FormControl
                        required={item.required}
                        fullWidth
                        sx={{
                            mb: 2,
                            p: 2,
                            backgroundColor: theme.palette.background.paper,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`
                        }}
                    >
                        <FormLabel
                            sx={{
                                fontWeight: 'medium',
                                color: theme.palette.primary.main,
                                mb: 1
                            }}
                        >
                            {item.name}
                            {item.required && <span style={{color: theme.palette.error.main}}> *</span>}
                        </FormLabel>
                        <RadioGroup
                            row
                            name={item.name}
                            value={item.value}
                            onChange={handleParametersChange}
                            required={item.required}
                        >
                            {Array.from(new Set(item.options.split(";").map(op => op.trim())))
                                .map((op, idx) => (
                                    <FormControlLabel
                                        key={idx}
                                        value={op}
                                        control={
                                            <Radio
                                                color="primary"
                                                sx={{'& .MuiSvgIcon-root': {fontSize: 20}}}
                                            />
                                        }
                                        label={op}
                                        sx={{mr: 3}}
                                    />
                                ))}
                        </RadioGroup>
                    </FormControl>
                );
            default:
                return (
                    <TextField
                        rows={4}
                        fullWidth
                        multiline={item.type === "text"}
                        name={item.name}
                        label={item.name}
                        type={item.type}
                        value={item?.value ?? ""}
                        onChange={handleParametersChange}
                        error={errors.hasOwnProperty(item.name)}
                        helperText={errors[item.name] ?? null}
                        required={item.required}
                        variant="outlined"
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                    borderColor: theme.palette.primary.main,
                                },
                                borderRadius: 1
                            }
                        }}
                    />
                );
        }
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            slotProps={{
                Paper: {
                    sx: {
                        borderRadius: 2,
                        overflow: 'hidden'
                    }
                }
            }}
        >
            <DialogTitle
                sx={{
                    bgcolor: actionConfig.headerColor,
                    color: actionConfig.headerTextColor,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    {actionConfig.icon}
                    <Typography variant="h6">
                        {actionConfig.title}: {acceptanceItemState?.section?.name}
                    </Typography>
                </Box>
                <Tooltip title="Close">
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={onClose}
                        aria-label="close"
                        sx={{
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.08)'
                            }
                        }}
                    >
                        <CloseIcon/>
                    </IconButton>
                </Tooltip>
            </DialogTitle>

            <DialogContent sx={{p: 3, mt: 2}}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 3,
                        bgcolor: theme.palette.background.default,
                        borderRadius: 1
                    }}
                >
                    <Typography variant="subtitle1" fontWeight="bold" sx={{mb: 2}}>
                        Case Information
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid size={{xs: 12, sm: 6}}>
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                <LocalHospital color="primary" sx={{mr: 1}}/>
                                <Typography variant="body2" color="text.secondary" sx={{mr: 1}}>
                                    Patients ID/Age/Gender:
                                </Typography>
                                {acceptanceItemState?.patients?.map(patient => <Typography
                                    key={patient.id}
                                    variant="body1"
                                    fontWeight="medium">
                                    {`${patient?.id || '-'} / ${patient?.age || '-'} / ${patient?.gender || '-'}`}
                                </Typography>)}
                            </Box>
                        </Grid>

                        <Grid size={{xs: 12, sm: 6}}>
                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                <Science color="primary" sx={{mr: 1}}/>
                                <Typography variant="body2" color="text.secondary" sx={{mr: 1}}>
                                    Sample Type/Date:
                                </Typography>
                                <Typography variant="body1" fontWeight="medium">
                                    {`${acceptanceItemState?.sample?.sampleType || '-'} / ${acceptanceItemState?.sample?.created_at || '-'}`}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid size={{xs: 12}}>
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                <MedicalServices color="primary" sx={{mr: 1}}/>
                                <Typography variant="body2" color="text.secondary" sx={{mr: 1}}>
                                    Test Name:
                                </Typography>
                                <Chip
                                    label={acceptanceItemState?.test?.name || '-'}
                                    color="primary"
                                    size="small"
                                    variant="outlined"
                                    sx={{fontWeight: 'medium'}}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {isReject && (
                    <Alert
                        severity="warning"
                        variant="outlined"
                        sx={{mb: 3, borderRadius: 1}}
                        icon={<ErrorOutline/>}
                    >
                        You are about to reject this section. Please provide all necessary details for the team to
                        understand the reason for rejection.
                    </Alert>
                )}

                {hasErrors && (
                    <Alert
                        severity="error"
                        sx={{mb: 3, borderRadius: 1}}
                    >
                        Please fill in all required fields before submitting.
                    </Alert>
                )}

                <Divider sx={{my: 2}}/>

                <Box sx={{mb: 2}}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {isReject ? "Parameters" : "Required Parameters"}
                    </Typography>
                    {!isReject && (
                        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                            Please fill in all required fields to complete this section.
                        </Typography>
                    )}
                </Box>

                <Box sx={{mb: 3}}>
                    {acceptanceItemState?.parameters?.map((item, index) => (
                        <Box key={index}>
                            {renderItem(item)}
                        </Box>
                    ))}
                </Box>

                {/* Rejection-specific fields */}
                {isReject && (
                    <Box sx={{mb: 3}}>
                        <FormControl
                            fullWidth
                            error={errors.hasOwnProperty("next")}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                    '&:hover fieldset': {
                                        borderColor: theme.palette.primary.main,
                                    },
                                },
                            }}
                        >
                            <InputLabel
                                error={errors.hasOwnProperty("next")}
                                id="next-section-label"
                                sx={{
                                    fontWeight: 'medium',
                                }}
                            >
                                Return to Section *
                            </InputLabel>
                            <Select
                                error={errors.hasOwnProperty("next")}
                                onChange={handleChange}
                                name="next"
                                value={acceptanceItemState.next}
                                labelId="next-section-label"
                                label="Return to Section *"
                                startAdornment={<ArrowBack fontSize="small"
                                                           sx={{ml: 1, mr: 0.5, color: theme.palette.action.active}}/>}
                            >
                                <MenuItem value={""}>Sample Collection</MenuItem>
                                {options.map((item, index) => (
                                    <MenuItem
                                        key={index}
                                        value={item.id}>
                                        {`${(item.order + 1)}- ${item.name}`}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.hasOwnProperty("next") && (
                                <FormHelperText error>
                                    {errors.next}
                                </FormHelperText>
                            )}
                        </FormControl>

                        <TextField
                            multiline
                            name="details"
                            fullWidth
                            onChange={handleChange}
                            label="Rejection Details *"
                            rows={4}
                            required
                            error={errors.hasOwnProperty("details")}
                            value={acceptanceItemState.details || ''}
                            helperText={errors.hasOwnProperty("details") ? errors.details : "Please provide detailed reasons for rejecting this section"}
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1,
                                    '&:hover fieldset': {
                                        borderColor: theme.palette.primary.main,
                                    },
                                },
                            }}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{px: 3, py: 2, bgcolor: theme.palette.background.default}}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="inherit"
                        startIcon={<CloseIcon/>}
                        sx={{borderRadius: 1}}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        color={actionConfig.color}
                        startIcon={actionConfig.buttonIcon}
                        sx={{borderRadius: 1}}
                    >
                        {actionConfig.buttonText}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};

export {WorkflowActionForm, ACTION_TYPES};
