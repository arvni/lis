import React, {useState, useCallback} from "react";
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
    const handleChange = useCallback((field, value) => {
        setData(prevState => ({...prevState, [field]: value}));
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
        if (validateForm()) submit();
    }, [validateForm, submit]);

    return (
        <Container sx={{p: "1em"}}>
            <Typography variant="h4">
                {data.id ? "Edit" : "Add New"} Collect Request
            </Typography>
            <Divider sx={{my: "1em"}}/>

            <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2} rowSpacing={3}>
                    {/* Sample Collector */}
                    <Grid size={{xs: 12, sm: 6}}>
                        <Autocomplete
                            options={sampleCollectors}
                            getOptionLabel={(option) => option.name || ""}
                            value={sampleCollectors.find(sc => sc.id === data.sample_collector_id) || null}
                            onChange={(e, newValue) => handleChange('sample_collector_id', newValue?.id || null)}
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

                    {/* Referrer */}
                    <Grid size={{xs: 12, sm: 6}}>
                        <Autocomplete
                            options={referrers}
                            getOptionLabel={(option) => option.name || option.fullName || ""}
                            value={referrers.find(r => r.id === data.referrer_id) || null}
                            onChange={(e, newValue) => handleChange('referrer_id', newValue?.id || null)}
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

                    {/* Preferred Date & Time */}
                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            fullWidth
                            label="Preferred Date & Time"
                            type="datetime-local"
                            value={data.preferred_date
                                ? new Date(data.preferred_date).toISOString().slice(0, 16)
                                : ""}
                            onChange={(e) => handleChange('preferred_date', e.target.value || null)}
                            error={!!errors?.preferred_date}
                            helperText={errors?.preferred_date}
                            slotProps={{inputLabel: {shrink: true}}}
                        />
                    </Grid>

                    {/* Note */}
                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Note"
                            value={data.note || ""}
                            onChange={(e) => handleChange('note', e.target.value)}
                            error={!!errors?.note}
                            helperText={errors?.note}
                        />
                    </Grid>

                    {/* Actions */}
                    <Grid size={{xs: 12}}>
                        <Stack spacing={2} direction="row">
                            <Button onClick={cancel} variant="outlined">Cancel</Button>
                            <Button variant="contained" type="submit">Submit</Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}
