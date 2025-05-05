import {Checkbox, FormControlLabel, TextField} from "@mui/material";
import Grid from "@mui/material/Grid2";
import SelectSearch from "@/Components/SelectSearch";
import {FormProvider, useFormState} from "@/Components/FormTemplate";
import {useEffect} from "react";

const AddForm = ({open, onClose, defaultData:defaultData}) => {
    const url = defaultData?.id
        ? route('sectionGroups.update', defaultData.id)
        : route('sectionGroups.store');

    const defaultValue = {
        name: "",
        parent: null,
        active:true,
        ...defaultData
    }
    return <FormProvider onClose={onClose}
                         defaultValue={defaultValue}
                         open={open}
                         url={url}
                         generalTitle="Section">
        <FormContent/>
    </FormProvider>
}

const FormContent = () => {
    const { data, setData, errors, processing } = useFormState();
    const handleChange = (e) => setData(prevState => ({...prevState, [e.target.name]: e.target.value}));
    const handleActiveChange = (_, v) => setData(prevValues => ({...prevValues, active: v}));
    return <>
        <Grid size={{xs: 6, sm: 4}}>
            <TextField label="Title"
                       name="name"
                       error={Boolean(errors?.name)}
                       helperText={errors?.name}
                       onChange={handleChange}
                       value={data?.name}/>
        </Grid>
        <Grid size={{xs: 6, sm: 4}}>
            <SelectSearch filterSelectedOptions
                          value={data?.parent}
                          label="Parent"
                          fullWidth
                          error={Boolean(errors?.parent)}
                          helperText={errors?.parent}
                          onChange={handleChange}
                          name="parent"
                          url={route("api.sectionGroups.list")}/>
        </Grid>
        <Grid size={{xs: 6, sm: 4}}>
            <FormControlLabel control={<Checkbox/>}
                              label="Is Active?"
                              name="active"
                              checked={data?.active}
                              onChange={handleActiveChange}/>
        </Grid>
    </>
}

export default AddForm;
