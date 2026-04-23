import {TextField} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {FormProvider, useFormState} from "@/Components/FormTemplate.jsx";

const AddForm = ({open, onClose, defaultValue = {}}) => {
    const url = defaultValue?.id
        ? route("inventory.units.update", defaultValue.id)
        : route("inventory.units.store");

    return (
        <FormProvider
            open={open}
            generalTitle="Unit of Measure"
            url={url}
            onClose={onClose}
            defaultValue={{name: "", abbreviation: "", description: "", ...defaultValue}}
        >
            <FormContent/>
        </FormProvider>
    );
};

const FormContent = () => {
    const {data, setData, errors} = useFormState();
    const handleChange = (e) => setData((prev) => ({...prev, [e.target.name]: e.target.value}));

    return (
        <>
            <Grid size={{xs: 12, sm: 6}}>
                <TextField
                    name="name" label="Unit Name" fullWidth required
                    value={data?.name || ""} onChange={handleChange}
                    error={!!errors?.name} helperText={errors?.name}
                />
            </Grid>
            <Grid size={{xs: 12, sm: 6}}>
                <TextField
                    name="abbreviation" label="Abbreviation" fullWidth required
                    value={data?.abbreviation || ""} onChange={handleChange}
                    error={!!errors?.abbreviation} helperText={errors?.abbreviation}
                />
            </Grid>
            <Grid size={{xs: 12}}>
                <TextField
                    name="description" label="Description" fullWidth
                    value={data?.description || ""} onChange={handleChange}
                />
            </Grid>
        </>
    );
};

export default AddForm;
