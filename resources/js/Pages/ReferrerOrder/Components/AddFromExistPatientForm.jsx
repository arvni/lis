import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import SelectSearch from "@/Components/SelectSearch";
import {useForm} from "@inertiajs/react";

const AddFromExistPatientForm = ({open, referrerOrder, onClose}) => {
    const {data, setData, post, reset, errors} = useForm({referrerOrder})
    const submit = () => {
        post(route('referrerOrders.patient', referrerOrder.id), {onSuccess: handleClose})
    }
    const handleClose = () => {
        reset();
        onClose();
    }
    const handleChange = (e) => setData(e.target.name, e.target.value);
    return <Dialog open={open} fullWidth maxWidth="sm">
        <DialogTitle>Select Patient From Exist Patients</DialogTitle>
        <DialogContent>
            <Grid container>
                <Grid item>
                    <SelectSearch value={data.patient}
                                  sx={{width: "300px", mt: 2}}
                                  onChange={handleChange}
                                  url={route("api.patients.list")}
                                  label="Select Patient"
                                  error={errors?.patient}
                                  helperText={errors?.patient}
                                  name="patient"/>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button variant="contained" onClick={submit}>
                Submit
            </Button>
            <Button onClick={handleClose}>
                Cancel
            </Button>
        </DialogActions>
    </Dialog>
}

export default AddFromExistPatientForm;
