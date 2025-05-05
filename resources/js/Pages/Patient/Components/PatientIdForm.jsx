import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";

const PatientIdForm = ({onChange, data}) => {
    return (
        <Grid container>
            <Grid item xs={12}>
                <TextField sx={{minWidth: "300px"}} value={data?.idNo} name={"idNo"} label={"ID Cart No / Passport No"}
                           onChange={onChange} required/>
            </Grid>
        </Grid>
    )
}
export default PatientIdForm
