import React, { useEffect, useState, useCallback } from "react";
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
    LinearProgress
} from "@mui/material";
import { AssignmentInd as ConsultantIcon } from '@mui/icons-material';


const Add = ({ errors: initialErrors, auth }) => {
    // Form state initialization with default values and predefined schedule
    const { data, setData, post, processing, reset, progress } = useForm({
        name: "",
        title: "",
        active: true,
        avatar: null,
        default_time_table: default_time_table
    });

    // Local state for UI management
    const [errors, setErrors] = useState(initialErrors || {});
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

    // Track dirty state for the form
    const [formDirty, setFormDirty] = useState(false);

    // Update errors when they come from the server
    useEffect(() => {
        if (initialErrors && Object.keys(initialErrors).length) {
            setErrors(initialErrors);
            showNotification("Please correct the errors in the form", "error");
        }
    }, [initialErrors]);

    // Track form changes to detect dirty state
    useEffect(() => {
        setFormDirty(true);
    }, [data]);

    // Utility function to show notifications
    const showNotification = (message, type = "info") => {
        setNotification({
            open: true,
            message,
            type
        });
    };

    // Validate form before submission
    const validateForm = useCallback(() => {
        const newErrors = {};

        // More comprehensive validation rules
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
        // Client-side validation
        const formErrors = validateForm();

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            showNotification("Please correct the errors in the form", "error");
            return;
        }

        setIsSubmitting(true);

        // Submit form to server
        post(route("consultants.store"), {
            onSuccess: () => {
                showNotification("Consultant created successfully", "success");
                setFormDirty(false);

                // Redirect after short delay to show success message
                setTimeout(() => {
                    router.visit(route("consultants.index"));
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
    }, [data, post, validateForm]);

    // Handle form cancellation with confirmation dialog
    const handleCancel = useCallback(() => {
        // Only show confirmation if form is dirty
        if (formDirty) {
            setConfirmDialog({
                open: true,
                title: "Discard Changes?",
                message: "You have unsaved changes. Are you sure you want to leave this page? All changes will be lost.",
                confirmAction: () => {
                    setConfirmDialog(prev => ({ ...prev, open: false }));
                    router.visit(route("consultants.index"));
                }
            });
        } else {
            router.visit(route("consultants.index"));
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

            <ConsultantForm
                values={data}
                errors={errors}
                setValues={setData}
                loading={processing || isSubmitting}
                submit={handleSubmit}
                cancel={handleCancel}
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
                        Stay on Page
                    </Button>
                    <Button
                        onClick={confirmDialog.confirmAction}
                        color="error"
                        variant="contained"
                        autoFocus
                    >
                        Discard Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// Define breadcrumbs for navigation
const breadCrumbs = [
    { title: "Consultants", link: route("consultants.index"), icon: <ConsultantIcon fontSize="small" /> },
    { title: "Add New Consultant", link: null }
];

// Set component layout
Add.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={breadCrumbs}
        title="Add New Consultant"
        children={page}
    />
);

export default Add;
