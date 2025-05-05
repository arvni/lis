import {
    Checkbox,
    FormControl,
    FormControlLabel,
    Input,
    InputLabel,
    TextField
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import SelectSearch from "@/Components/SelectSearch";
import {FormProvider, useFormState} from "@/Components/FormTemplate.jsx";
import AvatarUpload from "@/Components/AvatarUpload.jsx";
import React from "react";


const AddForm = ({open, onClose, defaultValue}) => {
    const url = defaultValue?.id
        ? route('sections.update', defaultValue.id)
        : route('sections.store');

    const defaultData = {
        name: "",
        description: "",
        section_group: null,
        active: true,
        ...defaultValue
    }

    return <FormProvider onClose={onClose}
                         defaultValue={defaultData}
                         open={open}
                         url={url}
                         generalTitle="Section">
        <FormContent/>
    </FormProvider>
}

const FormContent = () => {
    const {data, setData, errors} = useFormState();
    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setData(prevState => ({...prevState, [name]: type === "checkbox" ? checked : value}));
    };
    const handleIconChange = (v) => {
        setData(prevState => ({...prevState, icon: v?.url}));
    }
    return <>
        <Grid size={{xs: 12}}>
            <AvatarUpload
                value={data.icon}
                name="icon"
                label="Icon"
                onChange={handleIconChange}
                error={Boolean(errors?.icon)}
                helperText={errors?.icon ?? ""}
                uploadUrl={route("upload-public")}
            />
        </Grid>
        <Grid size={{xs: 6, sm: 4}}>
            <TextField label="Title"
                       name="name"
                       fullWidth
                       required
                       error={!!errors?.name}
                       helperText={errors?.name}
                       onChange={handleChange}
                       value={data.name}/>
        </Grid>
        <Grid size={{xs: 6, sm: 4}}>
            <SelectSearch
                filterSelectedOptions
                value={data.section_group}
                label="Group"
                fullWidth
                required
                error={!!errors?.section_group}
                helperText={errors?.section_group}
                onChange={handleChange}
                name="section_group"
                url={route("api.sectionGroups.list")}
            />
        </Grid>
        <Grid size={{xs: 6, sm: 4}}>
            <FormControlLabel control={<Checkbox/>}
                              label="Is Active?"
                              name="active"
                              checked={data?.active}
                              onChange={handleChange}/>
        </Grid>
        <Grid size={{xs: 12}}>
            <FormControl fullWidth
                         variant="outlined">
                <InputLabel
                    id="description"
                    variant="outlined">Description</InputLabel>
                <Input multiline
                       onChange={handleChange}
                       value={data.description}
                       id="description"
                       error={!!errors?.description}
                       helperText={errors?.description}
                       rows={3}
                       name="description"/>
            </FormControl>
        </Grid>
    </>
}

export default AddForm;
