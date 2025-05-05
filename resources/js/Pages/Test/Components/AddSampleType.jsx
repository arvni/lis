import React, {useEffect, useState} from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Grid from "@mui/material/Grid2";
import Button from "@mui/material/Button";
import SelectSearch from "@/Components/SelectSearch";
import {FormControlLabel, FormHelperText, Input, Switch} from "@mui/material";

const AddSampleType = ({open, onClose, sampleType, onChange, setSampleType}) => {
    const [sampleTypeErrors, setSampleTypeErrors] = useState({});
    useEffect(() => {
        setSampleTypeErrors({});
    }, [open]);

    const sampleTypeChange = (e, v) => {
        setSampleType(prevState => ({
            ...prevState,
            [e.target.name]: v ?? e.target.value
        }))
    }

    const checkForm = () => {
        let tmp = {};
        if (!sampleType.sample_type)
            Object.assign(tmp, {sample_type: "Please Select A SampleType"});
        if (!sampleType.description)
            Object.assign(tmp, {description: "Please Enter Description"});
        setSampleTypeErrors(tmp);
        return !Object.keys(tmp).length;
    }
    const submit = () => {
        if (checkForm())
            onChange();
    }
    return <Dialog open={open} onClose={onClose} maxWidth={"md"} fullWidth>
        <DialogTitle>Add Sample Type To Test</DialogTitle>
        <DialogContent>
            <Grid container
                  sx={{py: "1em"}}
                  spacing={2}
                  rowSpacing={5}>
                <Grid size={{xs:6}}>
                    <SelectSearch url={route('api.sampleTypes.list')}
                                  label="Sample Type"
                                  fullWidth
                                  error={sampleTypeErrors.hasOwnProperty("sample_type")}
                                  helperText={sampleTypeErrors.sample_type}
                                  name="sample_type"
                                  onChange={sampleTypeChange}
                                  value={sampleType.sample_type}/>
                </Grid>
                <Grid size={{xs:6}}>
                    <FormControlLabel
                        control={<Switch color="primary"
                                         name="defaultType"
                                         checked={sampleType.defaultType}
                                         onChange={sampleTypeChange}/>}
                        label="Default"
                        labelPlacement="start"
                    />
                </Grid>
                <Grid size={{xs:12}}>
                    <FormControl error={sampleTypeErrors.hasOwnProperty("description")}
                                 fullWidth
                                 variant="outlined">
                        <InputLabel error={sampleTypeErrors.hasOwnProperty("description")}
                                    id="description"
                                    variant="outlined">Description</InputLabel>
                        <Input multiline
                               onChange={sampleTypeChange}
                               value={sampleType.description}
                               error={sampleTypeErrors.hasOwnProperty("description")}
                               name="description"/>
                        <FormHelperText error={sampleTypeErrors.hasOwnProperty("description")}>
                            {sampleTypeErrors.description}
                        </FormHelperText>
                    </FormControl>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button variant={"contained"} onClick={submit}>Submit</Button>
            <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
    </Dialog>
}
export default AddSampleType;
