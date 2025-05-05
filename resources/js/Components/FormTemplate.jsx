import {createContext, useContext, useEffect} from "react";
import {useForm} from "@inertiajs/react";
import {
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    Button,
    Container,
    CircularProgress
} from "@mui/material";
import Grid from "@mui/material/Grid2";

const FormContext = createContext();
export const useFormState = () => useContext(FormContext);


export const FormProvider = ({open, onClose, url, children, defaultValue = {}, generalTitle = "",maxWidth="sm"}) => {
    const {data, setData, post, processing, errors, reset, clearErrors} = useForm(defaultValue);

    useEffect(() => {
        setData(defaultValue);
    }, [defaultValue]);

    // Clear form on close
    const handleClose = () => {
        if (!processing) {
            reset();
            clearErrors();
            onClose();
        }
    };

    // Submit the form
    const handleSubmit = (e) => {
        e.preventDefault();
        post(url,
            {
                onSuccess: handleClose,
                preserveScroll: true,
            });
    };

    const isEditing = !!data?.id;
    const formTitle = isEditing ? "Edit" : "Add New";


    return (
        <FormContext.Provider value={{data, setData, errors, processing}}>
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth={maxWidth}
                aria-labelledby="dialog-title"
            >
                <DialogTitle id="dialog-title">
                    {formTitle} {generalTitle}
                </DialogTitle>

                <form onSubmit={handleSubmit}>
                    <DialogContent sx={{p: 3}}>
                        <Container>
                            <Grid container spacing={3}>
                                {children}
                            </Grid>
                        </Container>
                    </DialogContent>

                    <DialogActions sx={{px: 3, pb: 2}}>
                        <Button
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            disabled={processing}
                            startIcon={processing && <CircularProgress size={20} color="inherit"/>}
                        >
                            {processing ? "Submitting..." : "Submit"}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </FormContext.Provider>
    );
};

