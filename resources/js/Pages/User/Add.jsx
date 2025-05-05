import React, { useEffect, useState, useCallback } from "react";
import UserForm from "@/Pages/User/Components/Form";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router, useForm } from "@inertiajs/react";
import { Snackbar, Alert } from "@mui/material";

const Add = ({ errors: initialErrors }) => {
    // Form state initialization with default values
    const { data, setData, post, processing, reset } = useForm({
        name: "",
        username: "",
        mobile: "",
        email: "",
        title: "",
        is_active: true,
        signature: null,
        stamp: null,
        roles: [],
        password: "",
        password_confirmation: ""
    });

    // Local state for errors and notifications
    const [errors, setErrors] = useState(initialErrors || {});
    const [notification, setNotification] = useState({
        open: false,
        message: "",
        type: "info"
    });

    // Update errors when they come from the server
    useEffect(() => {
        if (initialErrors && Object.keys(initialErrors).length) {
            setErrors(initialErrors);
            setNotification({
                open: true,
                message: "Please correct the errors in the form",
                type: "error"
            });
        }
    }, [initialErrors]);

    // Validate form before submission
    const validateForm = () => {
        const newErrors = {};

        // Basic validation example (can be extended)
        if (!data.name) newErrors.name = "Name is required";
        if (!data.username) newErrors.username = "Username is required";
        if (!data.email) newErrors.email = "Email is required";
        if (data.email && !/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "Invalid email format";
        if (!data.mobile) newErrors.mobile = "Mobile number is required";
        if (!data.roles || data.roles.length === 0) newErrors.roles = "At least one role must be selected";
        if (!data.password) newErrors.password = "Password is required";
        if (data.password && data.password.length < 8) newErrors.password = "Password must be at least 8 characters";
        if (data.password !== data.password_confirmation) newErrors.password_confirmation = "Passwords do not match";

        return newErrors;
    };

    // Handle form submission
    const handleSubmit = useCallback(() => {
        // Client-side validation
        const formErrors = validateForm();

        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            setNotification({
                open: true,
                message: "Please correct the errors in the form",
                type: "error"
            });
            return;
        }

        // Submit form to server
        post(route("users.store"), {
            onSuccess: () => {
                setNotification({
                    open: true,
                    message: "User created successfully",
                    type: "success"
                });

                // Redirect after short delay to show success message
                setTimeout(() => {
                    router.visit(route("users.index"));
                }, 1500);
            },
            onError: (errors) => {
                setErrors(errors);
                setNotification({
                    open: true,
                    message: "Please correct the errors in the form",
                    type: "error"
                });
            }
        });
    }, [data, post]);

    // Handle form cancellation
    const handleCancel = useCallback(() => {
        // Check if form has any data entered
        const hasData = Object.values(data).some(value => {
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'boolean') return false; // Skip boolean values like is_active
            return value !== null && value !== "";
        });

        if (hasData) {
            if (window.confirm("Are you sure you want to discard this new user?")) {
                router.visit(route("users.index"));
            }
        } else {
            router.visit(route("users.index"));
        }
    }, [data]);

    // Handle notification close
    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return;
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

const breadCrumbs = [
    { title: "Users", link: route("users.index") },
    { title: "Add New User", link: null }
];

Add.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Add;
