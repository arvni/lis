import { TextField } from "@mui/material";
import Grid from "@mui/material/Grid2";

import { FormProvider, useFormState } from "@/Components/FormTemplate.jsx";

const AddForm = ({ open, onClose, defaultValue = {} }) => {

    const url = defaultValue?.id
        ? route("barcodeGroups.update", defaultValue.id)
        : route("barcodeGroups.store");

    return (
        <FormProvider
            open={open}
            generalTitle="Barcode Group"
            url={url}
            onClose={onClose}
            defaultValue={{ name: "", abbr: "", ...defaultValue }}
        >
            <FormContent />
        </FormProvider>
    );
};

const FormContent = () => {
    const { data, setData, errors, processing } = useFormState();
    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevState) => ({ ...prevState, [name]: value }));
    };

    return (
        <>
            <Grid xs={12} sm={6}>
                <TextField
                    label="Title"
                    name="name"
                    onChange={handleChange}
                    value={data?.name || ""}
                    error={!!errors?.name}
                    helperText={errors?.name}
                    fullWidth
                    required
                    autoFocus
                    disabled={processing}
                />
            </Grid>
            <Grid xs={12} sm={6}>
                <TextField
                    label="Abbreviation"
                    name="abbr"
                    onChange={handleChange}
                    value={data?.abbr || ""}
                    error={!!errors?.abbr}
                    helperText={errors?.abbr}
                    fullWidth
                    required
                    disabled={processing}
                />
            </Grid>
        </>
    );
};

export default AddForm;
