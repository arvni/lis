import {TextField, Paper, Typography, Divider, InputAdornment} from "@mui/material";
import Grid from "@mui/material/Grid";
import SelectSearch from "@/Components/SelectSearch";
import {FormProvider, useFormState} from "@/Components/FormTemplate.jsx";
import React from "react";
import {Science, QrCode, CalendarToday, Numbers, Person} from "@mui/icons-material";

const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

const EditForm = ({open, onClose, defaultValue}) => {
    const defaultData = {
        id: defaultValue?.id,
        _method: "put",
        sample_type: defaultValue?.sample_type_id
            ? {id: defaultValue.sample_type_id, name: defaultValue.sample_type_name}
            : null,
        packing_series: defaultValue?.packing_series ?? "",
        tube_series: defaultValue?.tube_series ?? "",
        barcode: defaultValue?.barcode ?? "",
        tube_barcode: defaultValue?.tube_barcode ?? "",
        manufactured_date: toDateInput(defaultValue?.manufactured_date),
        expire_date: toDateInput(defaultValue?.expire_date),
        assigned_at: toDateInput(defaultValue?.assigned_at),
        referrer: defaultValue?.referrer
            ? {id: defaultValue.referrer.id, name: defaultValue.referrer.name ?? defaultValue.referrer.fullName}
            : null,
    };

    return (
        <FormProvider
            onClose={onClose}
            defaultValue={defaultData}
            open={open}
            url={route('materials.update', defaultValue?.id)}
            maxWidth="md"
            generalTitle="Material">
            <FormContent/>
        </FormProvider>
    );
};

const FormContent = () => {
    const {data, setData, errors} = useFormState();

    const handleChange = (e) => {
        const {name, value} = e.target;
        setData(prev => ({...prev, [name]: value}));
    };

    return (
        <Grid size={12}>
            {/* Material details */}
            <Paper elevation={0} sx={{p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <Science sx={{mr: 1}}/>
                    Material Details
                </Typography>
                <Divider sx={{mb: 3}}/>

                <Grid container spacing={3}>
                    <Grid size={{xs: 12, sm: 6}}>
                        <SelectSearch
                            value={data.sample_type}
                            label="Sample Type (Kit Type)"
                            fullWidth
                            required
                            error={!!errors?.["sample_type.id"]}
                            helperText={errors?.["sample_type.id"]}
                            onChange={handleChange}
                            name="sample_type"
                            defaultData={{orderable: true}}
                            url={route("api.sampleTypes.list")}
                            getOptionLabel={(option) => option?.name || ''}
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            label="Barcode"
                            name="barcode"
                            fullWidth
                            required
                            value={data.barcode || ""}
                            onChange={handleChange}
                            error={!!errors?.barcode}
                            helperText={errors?.barcode}
                            slotProps={{input: {startAdornment: (<InputAdornment position="start"><QrCode fontSize="small"/></InputAdornment>)}}}
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            label="Tube Barcode"
                            name="tube_barcode"
                            fullWidth
                            value={data.tube_barcode || ""}
                            onChange={handleChange}
                            error={!!errors?.tube_barcode}
                            helperText={errors?.tube_barcode}
                            slotProps={{input: {startAdornment: (<InputAdornment position="start"><QrCode fontSize="small"/></InputAdornment>)}}}
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            label="Packing Series"
                            name="packing_series"
                            fullWidth
                            required
                            value={data.packing_series || ""}
                            onChange={handleChange}
                            error={!!errors?.packing_series}
                            helperText={errors?.packing_series}
                            slotProps={{input: {startAdornment: (<InputAdornment position="start"><Numbers fontSize="small"/></InputAdornment>)}}}
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            label="Tube Series"
                            name="tube_series"
                            fullWidth
                            value={data.tube_series || ""}
                            onChange={handleChange}
                            error={!!errors?.tube_series}
                            helperText={errors?.tube_series}
                            slotProps={{input: {startAdornment: (<InputAdornment position="start"><Numbers fontSize="small"/></InputAdornment>)}}}
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            label="Manufactured Date"
                            name="manufactured_date"
                            type="date"
                            fullWidth
                            value={data.manufactured_date || ""}
                            onChange={handleChange}
                            error={!!errors?.manufactured_date}
                            helperText={errors?.manufactured_date}
                            slotProps={{
                                input: {startAdornment: (<InputAdornment position="start"><CalendarToday fontSize="small"/></InputAdornment>)},
                                inputLabel: {shrink: true}
                            }}
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            label="Expire Date"
                            name="expire_date"
                            type="date"
                            fullWidth
                            value={data.expire_date || ""}
                            onChange={handleChange}
                            error={!!errors?.expire_date}
                            helperText={errors?.expire_date}
                            slotProps={{
                                input: {startAdornment: (<InputAdornment position="start"><CalendarToday fontSize="small"/></InputAdornment>)},
                                inputLabel: {shrink: true}
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Assignment */}
            <Paper elevation={0} sx={{p: 2, mb: 1, borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <Person sx={{mr: 1}}/>
                    Assignment
                </Typography>
                <Divider sx={{mb: 3}}/>

                <Grid container spacing={3}>
                    <Grid size={{xs: 12, sm: 6}}>
                        <SelectSearch
                            value={data.referrer}
                            label="Assigned Referrer"
                            fullWidth
                            error={!!errors?.["referrer.id"]}
                            helperText={errors?.["referrer.id"] || "Leave empty to unassign"}
                            onChange={handleChange}
                            name="referrer"
                            url={route("api.referrers.list")}
                            getOptionLabel={(option) => option?.name || ''}
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            label="Assigned Date"
                            name="assigned_at"
                            type="date"
                            fullWidth
                            disabled={!data.referrer}
                            value={data.assigned_at || ""}
                            onChange={handleChange}
                            error={!!errors?.assigned_at}
                            helperText={errors?.assigned_at || (data.referrer ? "Defaults to now if left empty" : "Select a referrer first")}
                            slotProps={{
                                input: {startAdornment: (<InputAdornment position="start"><CalendarToday fontSize="small"/></InputAdornment>)},
                                inputLabel: {shrink: true}
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Grid>
    );
};

export default EditForm;
