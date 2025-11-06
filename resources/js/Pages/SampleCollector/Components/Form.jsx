import React, { useCallback } from "react";
import {
    Button,
    Container,
    Divider,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";

export default function SampleCollectorForm({
    data,
    setData,
    submit,
    cancel,
    errors,
    setError,
    clearErrors
}) {
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setData(prevState => ({ ...prevState, [name]: value }));
    }, [setData]);

    const validateForm = useCallback(() => {
        clearErrors();
        let isValid = true;

        if (!data?.name) {
            isValid = false;
            setError("name", "Please enter name");
        }

        if (!data?.email) {
            isValid = false;
            setError("email", "Please enter email");
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
                {data.id ? "Edit" : "Add New"} Sample Collector
            </Typography>
            <Divider sx={{ my: "1em" }} />

            <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2} rowSpacing={5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            value={data.name || ""}
                            fullWidth
                            required
                            name="name"
                            label="Name"
                            onChange={handleChange}
                            error={!!errors?.name}
                            helperText={errors?.name}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
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
