import {
    TextField,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";

import Upload from "@/Components/Upload";
import {FormProvider, useFormState} from "@/Components/FormTemplate.jsx";

const AddForm = ({ open, onClose, defaultValue }) => {
    const url = defaultValue?.id
        ? route('consentForms.update', defaultValue.id)
        : route('consentForms.store');
    const defaultData = {
        name: "",
        document: null,
        ...defaultValue
    };

    return (
        <FormProvider
            open={open}
            onClose={onClose}
            defaultValue={defaultData}
            generalTitle="Consent Form"
            url={url}
            maxWidth="sm"
        >
            <FormContent />
        </FormProvider>
    );
};

const FormContent = () => {
    const { data, setData } = useFormState();
    const handleChange = (e) => setData(prevState => ({ ...prevState, [e.target.name]: e.target.value }));

    return (
        <>
            <Grid size={12}>
                <TextField
                    fullWidth
                    label="Title"
                    name="name"
                    onChange={handleChange}
                    value={data?.name || ""}
                    placeholder="Enter a descriptive title for this consent form"
                    required
                    helperText="This title will be displayed to users when selecting consent forms"
                />
            </Grid>

            <Grid size={12}>
                <Typography variant="subtitle2" gutterBottom>
                    Document
                </Typography>
                <Upload
                    value={data?.document}
                    name="document"
                    editable
                    onChange={setData}
                    required
                    accept=".pdf,application/pdf"
                    url={route("documents.store")}
                />
                <Typography variant="caption" color="text.secondary" sx={{display: 'block', mt: 1}}>
                    Accepted formats: .pdf
                </Typography>
            </Grid>
        </>);
};

export default AddForm;
