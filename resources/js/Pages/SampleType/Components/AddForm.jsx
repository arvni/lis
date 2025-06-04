import {Switch, TextField} from "@mui/material";
import Grid from "@mui/material/Grid2";

import {FormProvider, useFormState} from "@/Components/FormTemplate.jsx";
import FormControlLabel from "@mui/material/FormControlLabel";


const AddForm = ({open, defaultValue = {}, onClose}) => {

    const url = defaultValue?.id
        ? route('sampleTypes.update', defaultValue.id)
        : route('sampleTypes.store');

    return (<FormProvider url={url}
                          onClose={onClose}
                          defaultValue={{
                              name: "",
                              description: "",
                              ...defaultValue
                          }}
                          generalTitle="Sample Type"
                          open={open}>
            <FormContent/>
        </FormProvider>
    );
};

const FormContent = () => {
    const {data, setData, errors, processing} = useFormState();
    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setData((prevState) => ({
            ...prevState,
            [name]: type === "checkbox" ? checked : value
        }));
    };


    return (<>
            <Grid size={{sm: 6, xs: 12}}>
                <TextField
                    label="Title"
                    name="name"
                    onChange={handleChange}
                    value={data.name || ""}
                    error={!!errors.name}
                    helperText={errors.name}
                    fullWidth
                    required
                    autoFocus
                    disabled={processing}
                    variant="outlined"
                />
            </Grid>
            <Grid size={{sm: 6, xs: 12}}>
                <FormControlLabel label="Orderable"
                                  control={<Switch/>}
                                  labelPlacement="start"
                                  name="orderable"
                                  onChange={handleChange}
                                  checked={data.orderable}/>
            </Grid>
            <Grid size={{xs: 12}}>
                <TextField
                    label="Description"
                    name="description"
                    onChange={handleChange}
                    value={data.description || ""}
                    error={!!errors.description}
                    helperText={errors.description}
                    fullWidth
                    multiline
                    rows={4}
                    disabled={processing}
                    variant="outlined"
                />
            </Grid>

        </>
    )
}

export default AddForm;
