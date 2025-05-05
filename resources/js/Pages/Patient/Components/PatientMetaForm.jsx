import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import {FormControlLabel, FormGroup, Input, ToggleButton, ToggleButtonGroup} from "@mui/material";

const PatientMetaForm = ({data, onChange, errors}) => {
    const handleSwitchChange = (e, v) => {
        onChange({...e, target: {...e.target, name: "maritalStatus", value: v}});
    };
    return <Grid container rowSpacing={4} spacing={1} sx={{width: "100%"}}>
        <Grid item xs={12} sm={6} md={2} >
            <TextField value={data?.profession} fullWidth name={"profession"} label={"Profession"}
                       onChange={onChange} error={errors.hasOwnProperty('profession')} helperText={errors?.profession}/>
        </Grid>
        <Grid item xs={12} sm={6} md={2} >
            <TextField value={data?.company} fullWidth name={"company"} label={"Company"} onChange={onChange}
                       error={errors.hasOwnProperty('company')} helperText={errors?.company}/>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
            <TextField value={data?.email} fullWidth name={"email"} label={"Email"} type={"email"} onChange={onChange}
                       error={errors.hasOwnProperty('email')} helperText={errors?.email}/>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
            <FormGroup>
                <FormControlLabel label="Marital Status" labelPlacement={"start"}
                                  control={<ToggleButtonGroup exclusive onChange={handleSwitchChange}
                                                              sx={{marginLeft: "1em"}} aria-label="Marital Status">
                                      <ToggleButton selected={data?.maritalStatus == 1} name={"maritalStatus"}
                                                    value="1" aria-label="Female">
                                          Married
                                      </ToggleButton>
                                      <ToggleButton selected={data?.maritalStatus == 0} name={"maritalStatus"}
                                                    value="0" aria-label="centered">
                                          Single
                                      </ToggleButton>
                                      <ToggleButton selected={data?.maritalStatus == null} name={"maritalStatus"}
                                                    value={null} aria-label="centered">
                                          Unknown
                                      </ToggleButton>
                                  </ToggleButtonGroup>}/>
            </FormGroup>
        </Grid>
        <Grid item xs={12}>
            <FormGroup>
                <FormControlLabel labelPlacement={"top"} sx={{width: "100%"}} label={"Details"}
                                  control={<Input name={"details"} multiline sx={{width: "100%"}} onChange={onChange}
                                                  value={data.patientMeta?.details}/>}/>
            </FormGroup>
        </Grid>

    </Grid>
}
export default PatientMetaForm;
