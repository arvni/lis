import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import {DialogActions, DialogContent, Select} from "@mui/material";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";

const InvoiceEditForm = ({invoice, onSubmit, open, onCancel, onChange}) => {
    const handleChange = e => onChange(e.target.name, e.target.value);
    return <Dialog open={open}>
        <DialogTitle title={`Update Dialog #${invoice.id}`}>{`Update Dialog #${invoice.id}`}</DialogTitle>
        <DialogContent>
            <Grid container sx={{paddingTop: 2}}>
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">Status</InputLabel>
                        <Select fullWidth
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={invoice.status}
                                name="status"
                                label="Status"
                                onChange={handleChange}>
                            <MenuItem value="waiting for payment">waiting for payment</MenuItem>
                            <MenuItem value="Paid">Paid</MenuItem>
                            <MenuItem value="Partially Paid">Partially Paid</MenuItem>
                            <MenuItem value="Canceled">Canceled</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button variant="contained" onClick={onSubmit}>Submit</Button>
            <Button onClick={onCancel}>Cancel</Button>
        </DialogActions>
    </Dialog>
}
export default InvoiceEditForm;