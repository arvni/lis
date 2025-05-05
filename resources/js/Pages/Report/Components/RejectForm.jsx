import Grid from "@mui/material/Grid";
import Editor from "@/Components/Editor";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import {Dialog, DialogActions, DialogContent, TextField, Typography} from "@mui/material";


const RejectForm = ({data, onSubmit, open, onChange, onCancel}) => {

    return <Dialog open={open} onClose={onCancel} fullWidth maxWidth={"lg"}>
        <DialogTitle>Reject Form</DialogTitle>
        <DialogContent>
            <Grid container spacing={3} sx={{pt: "1em"}} justifyContent={"end"}>
                <Grid item xs={12}>
                    <TextField fullWidth multiline rows={4} label={"Comment"} onChange={onChange}
                               value={data.comment} name={"comment"}/>
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={onCancel}>Cancel</Button>
            <Button onClick={onSubmit} variant={"contained"} color={"error"}>Reject</Button>
        </DialogActions>
    </Dialog>;
}
export default RejectForm;
