import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import PatientForm from "@/Pages/Patient/Components/PatientForm";
import DialogActions from "@mui/material/DialogActions";
import {Button} from "@mui/material";
import Box from "@mui/material/Box";
import {makeId} from "@/Services/helper";
import {useForm} from "@inertiajs/react";
import {useEffect} from "react";

const Form = ({defaultValues, open, onClose, id, withRelative = false, mainPatientId = null}) => {
    const initialData = {
        ...defaultValues,
        idNo: defaultValues?.idNo || makeId(10),
        // If this is a relative, set the relationship fields
        ...(withRelative && mainPatientId ? {
            patient_id: mainPatientId,  // Main patient ID for relative
            relationship: [],
            referrer_order_id: id,  // Store referrer order ID for later update
            relative_id: null
        } : {})
    };

    const {data, setData, errors, post, reset} = useForm(initialData);

    useEffect(() => {
        if (withRelative && mainPatientId && mainPatientId !== "") {
        }
        setData(prevData => ({
            ...prevData,
            patient_id: mainPatientId,
            relationship: [],
            referrer_order_id: id,
            relative_id: null
        }));
    }, [mainPatientId]);
    const handleSubmit = () => {
        console.log(data);
        // Use different route based on whether it's a relative or main patient
        const submitRoute = withRelative
            ? route('relatives.store')
            : route('referrerOrders.patient', id);

        post(submitRoute, {onSuccess: handleClose});
    };
    const handleChange = (e) => setData(e.target.name, e.target.value);
    const handleClose = () => {
        reset();
        onClose();
    }

    return <Dialog open={open} fullWidth maxWidth="md">
        <DialogTitle>
            {withRelative ? 'Add Relative Patient' : 'Add Patient'}
        </DialogTitle>
        <DialogContent>
            <Box component="form" onSubmit={handleSubmit}>
                <PatientForm
                    data={data}
                    onChange={handleChange}
                    errors={errors}
                    editable={true}
                    withRelative={withRelative}
                />
            </Box>
        </DialogContent>
        <DialogActions>
            <Button type="reset" onClick={handleClose}>Cancel</Button>
            <Button variant="contained" type="submit" onClick={handleSubmit}>Submit</Button>
        </DialogActions>
    </Dialog>
}
export default Form;
