import {
    Dialog,
    DialogActions,
    DialogContent, FormControlLabel,
    FormGroup,
    FormHelperText, FormLabel,
    InputLabel, Radio, RadioGroup,
    Select,
    Stack,
    TextField
} from "@mui/material";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import Upload from "@/Components/Upload";
import Button from "@mui/material/Button";
import {useEffect, useState} from "react";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";

const DoneForm = ({open, onClose, acceptanceItemState, onChange, onSubmit, options = []}) => {
    const handleParametersChange = e => {
        let parameters = acceptanceItemState.parameters;
        let parameterIndex = parameters.findIndex((item) => item.name === e.target.name);
        parameters[parameterIndex] = {...parameters[parameterIndex], value: e.target.value};
        onChange("parameters", parameters);
    };
    const handleFileParameter = (name, value) => {
        let parameters = acceptanceItemState.parameters;
        let parameterIndex = parameters.findIndex((item) => item.name === name);
        parameters[parameterIndex] = {...parameters[parameterIndex], value};
        onChange("parameters", parameters);
    };
    const handleChange = (e, v) => {
        onChange(e.target.name, e.target.value)
    };
    const [errors, setErrors] = useState({});
    const handleSubmit = () => {
        if (check())
            onSubmit()
    }
    const check = () => {
        let tmp = {}
        acceptanceItemState.parameters.forEach((item) => {
            if (!item.value && item.required)
                tmp = {...tmp, [item.name]: `Please Enter ${item.name} Value`};

        });
        if (!acceptanceItemState.details)
            tmp = {...tmp, details: `Please Enter Details`};
        if (acceptanceItemState.next == null)
            tmp = {...tmp, next: `Please Select Return To Section`};
        setErrors(tmp);
        return Object.keys(tmp).length < 1;
    }

    const renderItem = (item) => {
        switch (item.type) {
            case "file":
                return <Upload value={item?.value} label={item.name} name={item.name}
                               url={route("documents.upload", {
                                   ownerClass: "Patient",
                                   id: acceptanceItemState.patient.id
                               })} onChange={handleFileParameter}
                               error={errors.hasOwnProperty(item.name)}
                               helperText={errors[item.name] ?? null} required={item.required}/>
            case "options":
                return <FormControl required={item.required}>
                    <FormLabel>{item.name}</FormLabel>
                    <RadioGroup row name={item.name} value={item.value} onChange={handleParametersChange}
                                required={item.required}>
                        {Array.from(new Set(item.options.split(";").map(op => op.trim()))).map(op => <FormControlLabel
                            value={op} control={<Radio/>} label={op}/>)}
                    </RadioGroup>
                </FormControl>
            default:
                return <TextField rows={4} fullWidth multiline={item.type === "text"} name={item.name} label={item.name}
                                  type={item.type === "number" ? item.type : "text"} value={item?.value ?? ""}
                                  onChange={handleParametersChange} error={errors.hasOwnProperty(item.name)}
                                  helperText={errors[item.name] ?? null} required={item.required}/>;

        }
    }
    return <Dialog open={open} onClose={onClose}>
        <DialogTitle>
            Please fill form below to submit the section {acceptanceItemState?.section?.name} has been done
            <Divider/>
        </DialogTitle>
        <DialogContent>
            <Grid container spacing={2}>
                <Grid item>
                    Patient Information(ID/Age/Gender)
                    : {`${acceptanceItemState.patient?.id} / ${acceptanceItemState.patient?.age} / ${acceptanceItemState.patient?.gender}`}
                </Grid>
                <Grid item>
                    Sample Information(Type/Sampled At)
                    : {`${acceptanceItemState.sample?.sampleType} / ${acceptanceItemState.sample?.createdAt}`}
                </Grid>
                <Grid item>
                    Test Name : {acceptanceItemState.test?.name}
                </Grid>
            </Grid>
            <Grid container sx={{mt: "1em"}} spacing={3}>
                {acceptanceItemState?.parameters?.map((item, index) => <Grid item key={index} xs={12}>
                    {renderItem(item)}
                </Grid>)}
                <Grid item xs={12}>
                    <FormControl fullWidth error={errors.hasOwnProperty("next")}>
                        <InputLabel error={errors.hasOwnProperty("next")}
                                    id={"next-section-label"}>Return to Section</InputLabel>
                        <Select error={errors.hasOwnProperty("next")} onChange={handleChange} name={"next"}
                                value={acceptanceItemState.nextId} labelId={"next-section-label"}
                                label={"Return to Section"}>
                            <MenuItem value={0}>Sample Collection</MenuItem>
                            {options.map((item, index) => <MenuItem key={index} value={item}>
                                {(item.order + 1) + "- " + item.name}
                            </MenuItem>)}
                        </Select>
                        {errors.hasOwnProperty("next") ?
                            <FormHelperText error={errors.hasOwnProperty("next")}>{errors.next}</FormHelperText> : null}
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <TextField multiline name={"details"} fullWidth onChange={handleChange} label={"Reject Details"}
                               rows={4}
                               error={errors.hasOwnProperty("details")} value={acceptanceItemState.details}
                               helperText={errors.hasOwnProperty("details") ? errors.details : ""}/>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Stack direction={"row"} spacing={1}>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant={"contained"} onClick={handleSubmit}>Submit</Button>
            </Stack>
        </DialogActions>
    </Dialog>
}

export default DoneForm;
