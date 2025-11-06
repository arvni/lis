import React, { useState, useCallback } from "react";
import {
    Button,
    Container,
    Divider,
    Stack,
    Switch,
    TextField,
    Typography,
    Chip,
    IconButton
} from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import FormControlLabel from "@mui/material/FormControlLabel";
import AddIcon from "@mui/icons-material/Add";
import LogisticsMap from "@/Components/LogisticsMap";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ReferrerForm({ data, setData, submit, cancel, errors, setError, clearErrors }) {
    const [emailInput, setEmailInput] = useState("");

    // Memoized handlers
    const handleChange = useCallback((e) => {
        const { name, type, checked, value } = e.target;
        onChange(name, type === "checkbox" ? checked : value);
    }, []);

    const handleBillingInfoChange = useCallback((e) => {
        const { name, value } = e.target;
        onChange("billingInfo", {
            ...data.billingInfo,
            [name]: value
        });
    }, [data.billingInfo]);

    const handleLogisticInfoChange = useCallback((e) => {
        const { name, value } = e.target;
        onChange("logisticInfo", {
            ...data.logisticInfo,
            [name]: value
        });
    }, [data.logisticInfo]);

    const handleLocationChange = useCallback(({ latitude, longitude }) => {
        onChange("logisticInfo", {
            ...data.logisticInfo,
            latitude,
            longitude
        });
    }, [data.logisticInfo]);

    const onChange = useCallback((key, value) => {
        setData(prevState => ({ ...prevState, [key]: value }));
    }, [setData]);

    // Report receivers handlers
    const validateEmail = (email) => EMAIL_REGEX.test(email);

    const handleAddEmail = useCallback(() => {
        const trimmedEmail = emailInput.trim();

        if (!trimmedEmail) {
            return;
        }

        if (!validateEmail(trimmedEmail)) {
            setError("reportReceivers", "Please enter a valid email address");
            return;
        }

        const currentEmails = data.reportReceivers || [];

        if (currentEmails.includes(trimmedEmail)) {
            setError("reportReceivers", "This email is already added");
            return;
        }

        onChange("reportReceivers", [...currentEmails, trimmedEmail]);
        setEmailInput("");
        clearErrors("reportReceivers");
    }, [emailInput, data.reportReceivers, onChange, setError, clearErrors]);

    const handleRemoveEmail = useCallback((emailToRemove) => {
        const currentEmails = data.reportReceivers || [];
        onChange("reportReceivers", currentEmails.filter(email => email !== emailToRemove));
    }, [data.reportReceivers, onChange]);

    const handleEmailKeyPress = useCallback((e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddEmail();
        }
    }, [handleAddEmail]);

    // Form validation
    const validateForm = useCallback(() => {
        clearErrors();
        let isValid = true;

        const validations = [
            { field: "phoneNo", value: data?.phoneNo, message: "Please Enter Phone No." },
            { field: "fullName", value: data?.fullName, message: "Please Enter Name" },
            { field: "email", value: data?.email, message: "Please Enter Email" }
        ];

        validations.forEach(({ field, value, message }) => {
            if (!value) {
                isValid = false;
                setError(field, message);
            }
        });

        return isValid;
    }, [data, clearErrors, setError]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (validateForm()) {
            submit();
        }
    }, [validateForm, submit]);

    return (
        <Container sx={{ p: "1em" }}>
            <Typography variant="h4">
                {data.id ? "Edit" : "Add New"} Referrer
            </Typography>
            <Divider sx={{ my: "1em" }} />

            <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2} rowSpacing={5}>
                    {/* Basic Information */}
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={data.fullName || ""}
                            fullWidth
                            required
                            name="fullName"
                            label="Name"
                            onChange={handleChange}
                            error={!!errors?.fullName}
                            helperText={errors?.fullName}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={data.email || ""}
                            fullWidth
                            required
                            type="email"
                            name="email"
                            label="Email"
                            onChange={handleChange}
                            error={!!errors?.email}
                            helperText={errors?.email}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={data.phoneNo || ""}
                            fullWidth
                            required
                            type="tel"
                            name="phoneNo"
                            label="Phone No."
                            onChange={handleChange}
                            error={!!errors?.phoneNo}
                            helperText={errors?.phoneNo}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControlLabel
                            label="Status"
                            labelPlacement="start"
                            name="isActive"
                            checked={!!data.isActive}
                            onChange={handleChange}
                            control={<Switch />}
                        />
                    </Grid>

                    {/* Report Receivers Section */}
                    <Grid size={{ xs: 12 }}>
                        <Divider>Report Receivers</Divider>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <TextField
                                value={emailInput}
                                fullWidth
                                type="email"
                                name="reportReceiversInput"
                                label="Add Email Address"
                                placeholder="Enter email and press Add or Enter"
                                onChange={(e) => setEmailInput(e.target.value)}
                                onKeyPress={handleEmailKeyPress}
                                error={!!errors?.reportReceivers}
                                helperText={errors?.reportReceivers}
                            />
                            <IconButton
                                color="primary"
                                onClick={handleAddEmail}
                                sx={{ mt: 1 }}
                                aria-label="Add email"
                            >
                                <AddIcon />
                            </IconButton>
                        </Box>

                        {data.reportReceivers?.length > 0 && (
                            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {data.reportReceivers.map((email, index) => (
                                    <Chip
                                        key={`${email}-${index}`}
                                        label={email}
                                        onDelete={() => handleRemoveEmail(email)}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        )}
                    </Grid>

                    {/* Billing Information Section */}
                    <Grid size={{ xs: 12 }}>
                        <Divider>Billing Information</Divider>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={data.billingInfo?.name || ""}
                            fullWidth
                            name="name"
                            label="Name"
                            onChange={handleBillingInfoChange}
                            error={!!errors?.["billingInfo.name"]}
                            helperText={errors?.["billingInfo.name"]}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={data.billingInfo?.email || ""}
                            fullWidth
                            type="email"
                            name="email"
                            label="Email"
                            onChange={handleBillingInfoChange}
                            error={!!errors?.["billingInfo.email"]}
                            helperText={errors?.["billingInfo.email"]}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={data.billingInfo?.phone || ""}
                            fullWidth
                            type="tel"
                            name="phone"
                            label="Phone"
                            onChange={handleBillingInfoChange}
                            error={!!errors?.["billingInfo.phone"]}
                            helperText={errors?.["billingInfo.phone"]}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={data.billingInfo?.vatIn || ""}
                            fullWidth
                            name="vatIn"
                            label="VatIn"
                            onChange={handleBillingInfoChange}
                            error={!!errors?.["billingInfo.vatIn"]}
                            helperText={errors?.["billingInfo.vatIn"]}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={data.billingInfo?.city || ""}
                            fullWidth
                            name="city"
                            label="City"
                            onChange={handleBillingInfoChange}
                            error={!!errors?.["billingInfo.city"]}
                            helperText={errors?.["billingInfo.city"]}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={data.billingInfo?.country || ""}
                            fullWidth
                            name="country"
                            label="Country"
                            onChange={handleBillingInfoChange}
                            error={!!errors?.["billingInfo.country"]}
                            helperText={errors?.["billingInfo.country"]}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            multiline
                            rows={3}
                            value={data.billingInfo?.address || ""}
                            fullWidth
                            name="address"
                            label="Address"
                            onChange={handleBillingInfoChange}
                            error={!!errors?.["billingInfo.address"]}
                            helperText={errors?.["billingInfo.address"]}
                        />
                    </Grid>
                    {/* Logistic Information Section */}
                    <Grid size={{ xs: 12 }}>
                        <Divider>Logistic Information</Divider>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            multiline
                            rows={3}
                            value={data.logisticInfo?.address || ""}
                            fullWidth
                            name="address"
                            label="Logistics Address"
                            onChange={handleLogisticInfoChange}
                            error={!!errors?.["logisticInfo.address"]}
                            helperText={errors?.["logisticInfo.address"]}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            value={data.logisticInfo?.latitude || ""}
                            fullWidth
                            type="number"
                            name="latitude"
                            label="Latitude"
                            onChange={handleLogisticInfoChange}
                            error={!!errors?.["logisticInfo.latitude"]}
                            helperText={errors?.["logisticInfo.latitude"]}
                            inputProps={{ step: "any", min: -90, max: 90 }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            value={data.logisticInfo?.longitude || ""}
                            fullWidth
                            type="number"
                            name="longitude"
                            label="Longitude"
                            onChange={handleLogisticInfoChange}
                            error={!!errors?.["logisticInfo.longitude"]}
                            helperText={errors?.["logisticInfo.longitude"]}
                            inputProps={{ step: "any", min: -180, max: 180 }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <LogisticsMap
                            latitude={data.logisticInfo?.latitude}
                            longitude={data.logisticInfo?.longitude}
                            onLocationChange={handleLocationChange}
                            editable={true}
                            height={400}
                        />
                    </Grid>

                    {/* Form Actions */}
                    <Grid size={{ xs: 12 }}>
                        <Stack spacing={2} direction="row">
                            <Button onClick={cancel} variant="outlined">
                                Cancel
                            </Button>
                            <Button variant="contained" type="submit">
                                Submit
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}
