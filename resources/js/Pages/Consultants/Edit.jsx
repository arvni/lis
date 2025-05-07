import React, { useEffect, useState, useCallback, useMemo } from "react";
import ConsultantForm, {default_time_table} from "./Components/Form";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router, useForm } from "@inertiajs/react";
import {
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    LinearProgress,
    Box
} from "@mui/material";
import { AssignmentInd as ConsultantIcon, ArrowBack as BackIcon } from '@mui/icons-material';


const EditConsultant = ({ consultant, errors: serverErrors }) => {
    // Handle case where consultant data might be incomplete
    const consultantWithDefaults = useMemo(() => {
        return {
            ...consultant,
            default_time_table: consultant.default_time_table || default_time_table,
            active: consultant.active !== undefined ? consultant.active : true
        };
    }, [consultant]);

    // Store original data for comparison to detect changes
    const [originalData] = useState(JSON.stringify(consultantWithDefaults));

    // Initialize form with consultant data and method
    const { data, setData, post, processing, reset, progress } = useForm({
        ...consultantWithDefaults,
        _method: "put"
    });

    // Local state for UI management
    const [errors, setErrors] = useState(serverErrors || {});
    const [notification, setNotification] = useState({
        open: false,
        message: "",
        type: "info"
    });
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: "",
        message: "",
        confirmAction: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formDirty, setFormDirty] = useState(false);

    // Check if form has been modified
    const hasChanges = useCallback(() => {
        // Compare current form state with original data
        return JSON.stringify(data) !== originalData;
    }, [data, originalData]);

    // Update form dirty state when data changes
    useEffect(() => {
        setFormDirty(hasChanges());
    }, [data, hasChanges]);

    // Update errors when they come from the server
    useEffect(() => {
        if (Object.keys(serverErrors || {}).length) {
            setErrors(serverErrors);
            showNotification("Please correct the errors in the form", "error");
        }
    }, [serverErrors]);

    // Utility function to show notifications
    const showNotification = (message, type = "info") => {
        setNotification({
            open: true,
            message,
            type
        });
    };

    // Form validation function
    const validateForm = useCallback(() => {
        const newErrors = {};

        // More comprehensive validation
        if (!data.name?.trim()) newErrors.name = "Name is required";
        if (data.name?.trim().length < 2) newErrors.name = "Name must be at least 2 characters";

        if (data.email?.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) newErrors.email = "Please enter a valid email address";
        }

        if (data.phone?.trim()) {
            const phoneRegex = /^\+?[0-9\s-()]{8,15}$/;
            if (!phoneRegex.test(data.phone)) newErrors.phone = "Please enter a valid phone number";
        }

        return newErrors;
    }, [data]);

    // Handle form submission
    const handleSubmit = useCallback(() => {
        // Don't submit if no changes
        if (!formDirty) {
            showNotification("No changes to save", "info");
            return;
        }

        // Client-side validation
        const formErrors = validateForm();

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            showNotification("Please correct the errors in the form", "error");
            return;
        }

        setIsSubmitting(true);

        // Submit the form
        post(route('consultants.update', consultant.id), {
            onSuccess: () => {
                showNotification("Consultant updated successfully", "success");
                setFormDirty(false);

                // Redirect after a short delay to allow notification to be seen
                setTimeout(() => {
                    router.visit(route('consultants.index'));
                }, 2000);
            },
            onError: (errors) => {
                setErrors(errors);
                showNotification("Please correct the errors in the form", "error");
                setIsSubmitting(false);
            },
            onFinish: () => {
                setIsSubmitting(false);
            }
        });
    }, [data, formDirty, post, consultant.id, validateForm]);

    // Handle cancel action with confirmation
    const handleCancel = useCallback(() => {
        if (formDirty) {
            setConfirmDialog({
                open: true,
                title: "Discard Changes?",
                message: "You have unsaved changes. Are you sure you want to leave this page? All changes will be lost.",
                confirmAction: () => {
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                    router.visit(route('consultants.index'));
                }
            });
        } else {
            router.visit(route('consultants.index'));
        }
    }, [formDirty]);

    // Handle notification close
    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotification({ ...notification, open: false });
    };

    // Handle dialog close
    const handleCloseDialog = () => {
        setConfirmDialog(prev => ({ ...prev, open: false }));
    };

    // Reset form to original data
    const handleResetForm = useCallback(() => {
        if (formDirty) {
            setConfirmDialog({
                open: true,
                title: "Reset Form?",
                message: "This will revert all changes back to the original values. Continue?",
                confirmAction: () => {
                    reset();
                    setErrors({});
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                    showNotification("Form has been reset to original values", "info");
                }
            });
        }
    }, [formDirty, reset]);

    // Detect unsaved changes before navigation
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (formDirty) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [formDirty]);

    return (
        <>
            {/* Show progress indicator when uploading */}
            {progress && (
                <LinearProgress
                    variant="determinate"
                    value={progress.percentage}
                    sx={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1100,
                        height: 4
                    }}
                />
            )}

            {/* Back button for easier navigation */}
            <Box sx={{ mb: 2 }}>
                <Button
                    variant="outlined"
                    startIcon={<BackIcon />}
                    onClick={() => {
                        if (formDirty) {
                            handleCancel();
                        } else {
                            router.visit(route('consultants.index'));
                        }
                    }}
                    size="small"
                >
                    Back to List
                </Button>
            </Box>

            <ConsultantForm
                values={data}
                errors={errors}
                setValues={setData}
                loading={processing || isSubmitting}
                submit={handleSubmit}
                cancel={handleCancel}
                edit={true}
                onReset={handleResetForm}
                hasChanges={formDirty}
            />

            {/* Notification system */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.type}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDialog.open}
                onClose={handleCloseDialog}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {confirmDialog.title}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        {confirmDialog.message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDialog.confirmAction}
                        color="error"
                        variant="contained"
                        autoFocus
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// Define breadcrumbs for layout with better labels and icons
const getBreadcrumbs = (consultant) => [
    {
        title: "Consultants",
        link: route("consultants.index"),
        icon: <ConsultantIcon fontSize="small" />
    },
    {
        title: consultant?.name ? `Edit: ${consultant.name}` : "Edit Consultant",
        link: null,
        icon: null
    }
];

// Apply layout with dynamic breadcrumbs
EditConsultant.layout = page => {
    const consultant = page.props.consultant || {};

    return (
        <AuthenticatedLayout
            auth={page.props.auth}
            children={page}
            breadcrumbs={getBreadcrumbs(consultant)}
            title={consultant?.name ? `Edit Consultant: ${consultant.name}` : "Edit Consultant"}
        />
    );
};

export default EditConsultant;
