
import {TextField} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {FormProvider, useFormState} from "@/Components/FormTemplate.jsx";

const AddForm = ({open, onClose, defaultValue}) => {
    const url = defaultValue?.id
        ? route('testGroups.update', defaultValue.id)
        : route('testGroups.store');

    const defaultData = {
        name: "",
        ...defaultValue
    }

    return <FormProvider onClose={onClose}
                         defaultValue={defaultData}
                         open={open}
                         url={url}
                         generalTitle="Test Group">
        <FormContent/>
    </FormProvider>
}

const FormContent = () => {
    const {data, setData, errors} = useFormState();
    const handleChange = (e) => setData(prevState => ({...prevState, [e.target.name]: e.target.value}));
    return <Grid item>
        <TextField label="Title"
                   name="name"
                   error={!!errors?.name}
                   helperText={errors?.name}
                   onChange={handleChange}
                   value={data?.name ?? ""}/>
    </Grid>
}

export default AddForm;
