import React, { useCallback } from "react";
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
    CircularProgress
} from "@mui/material";
import AvatarUpload from "@/Components/AvatarUpload";
import SelectSearch from "@/Components/SelectSearch.jsx";
import PageHeader from "@/Components/PageHeader.jsx";

const UserForm = ({ values, setValues, cancel, loading, submit, errors, edit }) => {
    const handleChange = useCallback((e) => {
        const { name, value, checked, type } = e.target;
        setValues((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }, [setValues]);

    const handleFileChange = useCallback((name) => ({ data }) => {
        setValues((prev) => ({ ...prev, [name]: data }));
    }, [setValues]);

    const renderTextField = (name, label, type = "text", required = false) => (
        <TextField
            fullWidth
            type={type}
            name={name}
            label={label}
            required={required}
            value={values[name] || ""}
            onChange={handleChange}
            error={Boolean(errors?.[name])}
            helperText={errors?.[name] ?? ""}
            variant="outlined"
            margin="normal"
            size="medium"
        />
    );

    return (
        <Container maxWidth="lg">
            <PageHeader title={edit ? "Edit User" : "Add User"} />

            <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                    User Information
                </Typography>

                <Grid container spacing={3}>
                    <Grid size={{xs:12, sm:6, md:4}}>
                        {renderTextField("name", "Full Name", "text", true)}
                    </Grid>
                    <Grid size={{xs:12, sm:6, md:4}}>
                        {renderTextField("username", "Username", "text", true)}
                    </Grid>
                    <Grid size={{xs:12, sm:6, md:4}}>
                        {renderTextField("email", "Email Address", "email", true)}
                    </Grid>
                    <Grid size={{xs:12, sm:6, md:4}}>
                        {renderTextField("mobile", "Phone Number", "text", true)}
                    </Grid>
                    <Grid size={{xs:12, sm:6, md:4}}>
                        {renderTextField("title", "Title Under Signature")}
                    </Grid>
                    <Grid size={{xs:12, sm:6, md:4}}>
                        <Box sx={{ pt: 2 }}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={values?.is_active || false}
                                        onChange={handleChange}
                                        name="is_active"
                                        color="primary"
                                    />
                                }
                                label="User is active"
                            />
                            <Typography variant="caption" display="block" color="text.secondary">
                                Inactive users cannot log in to the system
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                    User Roles & Permissions
                </Typography>

                <Grid container spacing={3}>
                    <Grid  size={{xs:12,}}>
                        <SelectSearch
                            error={Boolean(errors?.["roles"])}
                            helperText={errors?.roles || "Select one or more roles for this user"}
                            label="User Roles"
                            name="roles"
                            multiple
                            sx={{ width: "100%" }}
                            fullWidth
                            value={values.roles || []}
                            url={route("api.roles.list")}
                            onChange={handleChange}
                            required
                            variant="outlined"
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                    Signature & Stamp
                </Typography>

                <Grid container spacing={3}>
                    <Grid  size={{xs:12, sm:6}}>
                        <AvatarUpload
                            value={values.signature}
                            name="signature"
                            tag="SIGNATURE"
                            label="User Signature"
                            onChange={handleFileChange("signature")}
                            error={Boolean(errors?.signature)}
                            helperText={errors?.signature ?? "Upload user's signature image"}
                            uploadUrl={route("documents.store")}
                        />
                    </Grid>
                    <Grid  size={{xs:12, sm:6}}>
                        <AvatarUpload
                            value={values.stamp}
                            name="stamp"
                            tag="STAMP"
                            label="User Stamp"
                            onChange={handleFileChange("stamp")}
                            error={Boolean(errors?.stamp)}
                            helperText={errors?.stamp ?? "Upload user's official stamp image"}
                            uploadUrl={route("documents.store")}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {!edit && (
                <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom color="primary">
                        Password
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid  size={{xs:12, sm:6}}>
                            {renderTextField("password", "Password", "password", true)}
                            <Typography variant="caption" color="text.secondary">
                                Password must be at least 8 characters long
                            </Typography>
                        </Grid>
                        <Grid  size={{xs:12, sm:6}}>
                            {renderTextField("password_confirmation", "Confirm Password", "password", true)}
                        </Grid>
                    </Grid>
                </Paper>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, mb: 2 }}>
                <Button
                    onClick={cancel}
                    disabled={loading}
                    variant="outlined"
                    sx={{ mr: 2 }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={submit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {loading ? 'Saving...' : edit ? 'Update User' : 'Create User'}
                </Button>
            </Box>
        </Container>
    );
};

UserForm.propTypes = {
    values: PropTypes.object.isRequired,
    setValues: PropTypes.func.isRequired,
    cancel: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    submit: PropTypes.func.isRequired,
    errors: PropTypes.object,
    edit: PropTypes.bool
};

UserForm.defaultProps = {
    loading: false,
    errors: {},
    edit: false,
    values: {
        is_active: true,
        roles: []
    }
};

export default UserForm;
