import React, { useState, useCallback, useEffect } from "react";
import {
    Button,
    Container,
    Divider,
    Stack,
    TextField,
    Typography,
    Autocomplete
} from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import { router } from "@inertiajs/react";

export default function CollectRequestForm({
    data,
    setData,
    submit,
    cancel,
    errors,
    setError,
    clearErrors,
    sampleCollectors = [],
    referrers = []
}) {
    const [logisticFields, setLogisticFields] = useState({
        address: data.logistic_information?.address || "",
        city: data.logistic_information?.city || "",
        phone: data.logistic_information?.phone || "",
        notes: data.logistic_information?.notes || "",
    });

    const handleChange = useCallback((field, value) => {
        setData(prevState => ({ ...prevState, [field]: value }));
    }, [setData]);

    const handleLogisticChange = useCallback((e) => {
        const { name, value } = e.target;
        setLogisticFields(prev => {
            const updated = { ...prev, [name]: value };
            setData(prevData => ({
                ...prevData,
                logistic_information: updated
            }));
            return updated;
        });
    }, [setData]);

    const validateForm = useCallback(() => {
        clearErrors();
        let isValid = true;

        if (!data?.sample_collector_id) {
            isValid = false;
            setError("sample_collector_id", "Please select a sample collector");
        }

        if (!data?.referrer_id) {
            isValid = false;
            setError("referrer_id", "Please select a referrer");
        }

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
                {data.id ? "Edit" : "Add New"} Collect Request
            </Typography>
            <Divider sx={{ my: "1em" }} />

            <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2} rowSpacing={5}>
                    {/* Sample Collector Selection */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                            options={sampleCollectors}
                            getOptionLabel={(option) => option.name || ""}
                            value={sampleCollectors.find(sc => sc.id === data.sample_collector_id) || null}
                            onChange={(e, newValue) => {
                                handleChange('sample_collector_id', newValue?.id || null);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Sample Collector"
                                    required
                                    error={!!errors?.sample_collector_id}
                                    helperText={errors?.sample_collector_id}
                                />
                            )}
                        />
                    </Grid>

                    {/* Referrer Selection */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                            options={referrers}
                            getOptionLabel={(option) => option.name || option.fullName || ""}
                            value={referrers.find(r => r.id === data.referrer_id) || null}
                            onChange={(e, newValue) => {
                                handleChange('referrer_id', newValue?.id || null);
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Referrer"
                                    required
                                    error={!!errors?.referrer_id}
                                    helperText={errors?.referrer_id}
                                />
                            )}
                        />
                    </Grid>

                    {/* Logistic Information Section */}
                    <Grid size={{ xs: 12 }}>
                        <Divider>Logistic Information</Divider>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={logisticFields.address}
                            fullWidth
                            name="address"
                            label="Address"
                            onChange={handleLogisticChange}
                            error={!!errors?.["logistic_information.address"]}
                            helperText={errors?.["logistic_information.address"]}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={logisticFields.city}
                            fullWidth
                            name="city"
                            label="City"
                            onChange={handleLogisticChange}
                            error={!!errors?.["logistic_information.city"]}
                            helperText={errors?.["logistic_information.city"]}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            value={logisticFields.phone}
                            fullWidth
                            type="tel"
                            name="phone"
                            label="Phone"
                            onChange={handleLogisticChange}
                            error={!!errors?.["logistic_information.phone"]}
                            helperText={errors?.["logistic_information.phone"]}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            multiline
                            rows={3}
                            value={logisticFields.notes}
                            fullWidth
                            name="notes"
                            label="Notes"
                            onChange={handleLogisticChange}
                            error={!!errors?.["logistic_information.notes"]}
                            helperText={errors?.["logistic_information.notes"]}
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
