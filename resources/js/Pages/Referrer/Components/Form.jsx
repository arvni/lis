import React from "react";
import {Button, Container, Divider, Stack, Switch, TextField, Typography} from "@mui/material";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import FormControlLabel from "@mui/material/FormControlLabel";

export default function ({data, setData, submit, cancel, errors, setError, clearErrors}) {
    const handleChange = (e) => onChange(e.target.name, e.target.type === "checkbox" ? e.target.checked : e.target.value);

    const handleBillingInfoChange = (e) => onChange("billingInfo", {
        ...data.billingInfo,
        [e.target.name]: e.target.value
    });


    const onChange = (key, value) => setData(prevState => ({...prevState, [key]: value}))

    const check = () => {
        clearErrors();
        let output = true;
        if (!data?.phoneNo) {
            output = false;
            setError("phoneNo", "Please Enter Phone No.")
        }
        if (!data?.fullName) {
            output = false;
            setError("fullName", "Please Enter Name")
        }
        if (!data?.email) {
            output = false;
            setError("email", "Please Enter Email")
        }
        return output;
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (check())
            submit();
    }
    return (
        <Container sx={{p: "1em"}}>
            <Typography variant="h4">
                {data.id ? "Edit" : "Add New"} Referrer
            </Typography>
            <Divider sx={{my: "1em"}}/>
            <Box component="form" onSubmit={handleSubmit}>
                <Grid
                    container
                    spacing={2}
                    rowSpacing={5}>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <TextField
                            value={data.fullName}
                            fullWidth
                            required
                            name="fullName"
                            label="Name"
                            onChange={handleChange}
                            error={errors?.fullName}
                            helperText={errors?.fullName}/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <TextField
                            value={data.email}
                            fullWidth
                            required
                            name="email"
                            label="Email"
                            onChange={handleChange}
                            error={errors?.email}
                            helperText={errors?.email}/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <TextField
                            value={data.phoneNo}
                            fullWidth
                            required
                            name="phoneNo"
                            label="Phone No."
                            onChange={handleChange}
                            error={errors?.phoneNo}
                            helperText={errors?.phoneNo}/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <FormControlLabel label="Status"
                                          labelPlacement="start"
                                          name="isActive"
                                          checked={data.isActive}
                                          onChange={handleChange}
                                          control={<Switch/>}/>
                    </Grid>
                    <Grid size={{xs: 12}}>
                        <Divider>Billing Information</Divider>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <TextField
                            value={data.billingInfo.name}
                            fullWidth
                            name="name"
                            label="Name"
                            onChange={handleBillingInfoChange}
                            error={errors["billingInfo.name"]}
                            helperText={errors["billingInfo.name"]}/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <TextField
                            value={data.billingInfo.email}
                            fullWidth
                            name="email"
                            label="Email"
                            onChange={handleBillingInfoChange}
                            error={errors["billingInfo.email"]}
                            helperText={errors["billingInfo.email"]}/>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            value={data.billingInfo.phone}
                            fullWidth
                            name="phone"
                            label="Phone"
                            onChange={handleBillingInfoChange}
                            error={errors["billingInfo.phone"]}
                            helperText={errors["billingInfo.phone"]}/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <TextField
                            value={data.billingInfo.vatIn}
                            fullWidth
                            name="vatIn"
                            label="VatIn"
                            onChange={handleBillingInfoChange}
                            error={errors["billingInfo.vatIn"]}
                            helperText={errors["billingInfo.vatIn"]}/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <TextField
                            value={data.billingInfo.city}
                            fullWidth
                            name="city"
                            label="City"
                            onChange={handleBillingInfoChange}
                            error={errors["billingInfo.city"]}
                            helperText={errors["billingInfo.city"]}/>
                    </Grid>
                    <Grid size={{xs: 12, sm: 6, md: 3}}>
                        <TextField
                            value={data.billingInfo.country}
                            fullWidth
                            name="country"
                            label="Country"
                            onChange={handleBillingInfoChange}
                            error={errors["billingInfo.country"]}
                            helperText={errors["billingInfo.country"]}/>
                    </Grid>
                    <Grid size={{xs: 12}}>
                        <TextField
                            multiline
                            rows={3}
                            value={data.billingInfo.address}
                            fullWidth
                            name="address"
                            label="Address"
                            onChange={handleBillingInfoChange}
                            error={errors["billingInfo.address"]}
                            helperText={errors["billingInfo.address"]}/>
                    </Grid>
                    <Grid size={{xs: 12}}>
                        <Stack spacing={2} direction="row">
                            <Button onClick={cancel}>Cancel</Button>
                            <Button variant="contained" type="submit">Submit</Button>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
}
