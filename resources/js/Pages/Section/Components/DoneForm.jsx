import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Button,
    Divider,
    Box,
    Typography,
    useTheme,
    Alert,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Close as CloseIcon,
    CheckCircle,
    ErrorOutlined as ErrorOutline,
    Warning,
} from '@mui/icons-material';
import { ACTION_TYPES } from './DoneForm/constants';
import { validateWorkflowAction } from './DoneForm/validation';
import ParameterField from './DoneForm/ParameterField';
import CaseInfoPanel from './DoneForm/CaseInfoPanel';
import RejectionFields from './DoneForm/RejectionFields';

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
    actionType = ACTION_TYPES.COMPLETE,
}) => {
    const theme = useTheme();
    const [errors, setErrors] = useState({});

    // Determine if this is a completion or rejection form
    const isReject = actionType === ACTION_TYPES.REJECT;

    // Configure theme elements based on action type
    const actionConfig = useMemo(
        () => ({
            title: isReject ? 'Reject Section' : 'Complete Section',
            icon: isReject ? <Warning /> : <CheckCircle />,
            color: isReject ? 'error' : 'primary',
            buttonText: isReject ? 'Reject Section' : 'Complete Section',
            buttonIcon: isReject ? <ErrorOutline /> : <CheckCircle />,
            headerColor: isReject ? theme.palette.error.main : theme.palette.primary.main,
            headerTextColor: isReject
                ? theme.palette.error.contrastText
                : theme.palette.primary.contrastText,
        }),
        [isReject, theme],
    );

    const handleParametersChange = (e) => {
        let parameters = acceptanceItemState.parameters;
        let parameterIndex = parameters.findIndex((item) => item.name === e.target.name);
        parameters[parameterIndex] = { ...parameters[parameterIndex], value: e.target.value };
        onChange('parameters', parameters);
    };

    const handleFileParameter = (name, value) => {
        let parameters = acceptanceItemState.parameters;
        let parameterIndex = parameters.findIndex((item) => item.name === name);
        parameters[parameterIndex] = { ...parameters[parameterIndex], value };
        onChange('parameters', parameters);
    };

    const handleChange = (e) => onChange(e.target.name, e.target.value);

    const handleSubmit = () => {
        const validationErrors = validateWorkflowAction(acceptanceItemState, isReject);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length < 1) onSubmit();
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
                        overflow: 'hidden',
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    bgcolor: actionConfig.headerColor,
                    color: actionConfig.headerTextColor,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {actionConfig.icon}
                    <Typography variant="h6" component="span">
                        {acceptanceItemState?.ids?.length > 1
                            ? `Bulk ${actionConfig.title}`
                            : actionConfig.title}
                        : {acceptanceItemState?.section?.name}
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
                                bgcolor: 'rgba(255, 255, 255, 0.08)',
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </DialogTitle>

            <DialogContent sx={{ p: 3, mt: 2 }}>
                <CaseInfoPanel acceptanceItemState={acceptanceItemState} />

                {isReject && (
                    <Alert
                        severity="warning"
                        variant="outlined"
                        sx={{ mb: 3, borderRadius: 1 }}
                        icon={<ErrorOutline />}
                    >
                        You are about to reject this section. Please provide all necessary details
                        for the team to understand the reason for rejection.
                    </Alert>
                )}

                {hasErrors && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>
                        Please fill in all required fields before submitting.
                    </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {isReject ? 'Parameters' : 'Required Parameters'}
                    </Typography>
                    {!isReject && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Please fill in all required fields to complete this section.
                        </Typography>
                    )}
                </Box>

                <Box sx={{ mb: 3 }}>
                    {acceptanceItemState?.parameters?.map((item, index) => (
                        <Box key={index}>
                            <ParameterField
                                item={item}
                                errors={errors}
                                patientId={acceptanceItemState?.patient?.id}
                                onParameterChange={handleParametersChange}
                                onFileParameter={handleFileParameter}
                            />
                        </Box>
                    ))}
                </Box>

                {/* Rejection-specific fields */}
                {isReject && (
                    <RejectionFields
                        acceptanceItemState={acceptanceItemState}
                        options={options}
                        errors={errors}
                        onChange={handleChange}
                    />
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, bgcolor: theme.palette.background.default }}>
                <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="inherit"
                        startIcon={<CloseIcon />}
                        sx={{ borderRadius: 1 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        color={actionConfig.color}
                        startIcon={actionConfig.buttonIcon}
                        sx={{ borderRadius: 1 }}
                    >
                        {actionConfig.buttonText}
                    </Button>
                </Stack>
            </DialogActions>
        </Dialog>
    );
};

export { WorkflowActionForm, ACTION_TYPES };
