import React, { useEffect, useState, useCallback } from "react";
import UserForm from "@/Pages/User/Components/Form";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router, useForm } from "@inertiajs/react";
import { Snackbar, Alert } from "@mui/material";

const EditUser = ({ user, errors: serverErrors, auth }) => {
    // Initialize form with user data and method
    const { data, setData, post, processing, reset } = useForm({
        ...user,
        _method: "put"
    });

    // Local state for client-side errors and notifications
    const [errors, setErrors] = useState({});
    const [notification, setNotification] = useState({
        open: false,
        message: "",
        type: "info"
    });

    // Update errors when they come from the server
    useEffect(() => {
        if (Object.keys(serverErrors || {}).length) {
            setErrors(serverErrors);
            setNotification({
                open: true,
                message: "Please correct the errors in the form",
                type: "error"
            });
        }
    }, [serverErrors]);

    // Handle form submission
    const handleSubmit = useCallback(() => {
        // Clear any previous errors
        setErrors({});

        // Custom form validation can be added here
        const formErrors = {};

        if (Object.keys(formErrors).length) {
            setErrors(formErrors);
            setNotification({
                open: true,
                message: "Please correct the errors in the form",
                type: "error"
            });
            return;
        }

        // Submit the form
        post(route('users.update', user.id), {
            onSuccess: () => {
                setNotification({
                    open: true,
                    message: "User updated successfully",
                    type: "success"
                });

                // Redirect after a short delay to allow notification to be seen
                setTimeout(() => {
                    router.visit(route('users.index'));
                }, 1500);
            }
        });
    }, [data, post, user.id]);

    // Handle cancel action
    const handleCancel = useCallback(() => {
        // Confirm if user has made changes
        if (JSON.stringify(user) !== JSON.stringify(data)) {
            if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
                router.visit(route('users.index'));
            }
        } else {
            router.visit(route('users.index'));
        }
    }, [data, user]);

    // Handle notification close
    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setNotification({ ...notification, open: false });
    };

    return (
        <>
            <UserForm
                values={data}
                errors={errors}
                setValues={setData}
                loading={processing}
                submit={handleSubmit}
                cancel={handleCancel}
                edit
            />

            {/* Notification system */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
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
        </>
    );
};

// Define breadcrumbs for layout
const breadcrumbs = [
    {
        title: "Users",
        link: route("users.index"),
        icon: null
    },
    {
        title: "Edit User",
        link: null,
        icon: null
    }
];

// Apply layout with breadcrumbs
EditUser.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadcrumbs}
    />
);

export default EditUser;
