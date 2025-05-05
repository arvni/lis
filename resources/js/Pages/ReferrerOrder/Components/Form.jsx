import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import PatientForm from "@/Pages/Patient/Components/PatientForm";
import DialogActions from "@mui/material/DialogActions";
import {Button} from "@mui/material";
import Box from "@mui/material/Box";
import {makeId} from "@/Services/helper";
import {useForm} from "@inertiajs/react";

const Form = ({defaultValues, open, onClose, id}) => {
    const {data, setData, errors, post, reset} = useForm({...defaultValues, idNo: makeId(10)})
    const handleSubmit = () => post(route('referrerOrders.patient', id), {onSuccess: handleClose});
    const handleChange = (e) => setData(e.target.name, e.target.value);
    const handleClose = () => {
        reset();
        onClose();
    }
    return <Dialog open={open} fullWidth maxWidth="md">
        <DialogTitle>Add Patient</DialogTitle>
        <DialogContent>
            <Box component="form" onSubmit={handleSubmit}>
                <PatientForm data={data} onChange={handleChange} errors={errors} editable={true}/>
            </Box>
        </DialogContent>
        <DialogActions>
            <Button type="reset" onClick={handleClose}>Cancel</Button>
            <Button variant="contained" type="submit" onClick={handleSubmit}>Submit</Button>
        </DialogActions>
    </Dialog>
}
export default Form;
