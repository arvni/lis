import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid2 as Grid,
    TextField,
    Typography,
    Fade,
    Box,
    CircularProgress,
    Tooltip,
    IconButton
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SelectSearch from "@/Components/SelectSearch";
import {useState, useEffect} from "react";

/**
 * SignerAddForm Component - An enhanced form for adding signers with improved UX
 *
 * @param {Object} props - Component props
 * @param {Object} props.data - Form data object
 * @param {Function} props.onChange - Function to handle input changes
 * @param {Function} props.onSubmit - Function to handle form submission
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onClose - Function to handle dialog close
 */
const SignerAddForm = ({data, onChange, onSubmit, open, onClose}) => {
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState({});

    // Reset errors when dialog opens/closes
    useEffect(() => {
        if (open) {
            setErrors({});
            setTouched({});
        }
    }, [open]);

    // Handle form submission
    const handleSubmit = () => {
        if (validateForm()) {
            setIsSubmitting(true);
            try {
                onSubmit();
            } catch (error) {
                console.error("Submission error:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    // Handle input changes
    const handleChange = (e) => {
        const {name, value} = e.target;
        if (name === "user") {
            axios.get(route("api.users.show", value.id),).then().then(res => {
                onChange(name, res.data.data);
            })
        } else {
            onChange(name, value);
        }
        // Mark field as touched
        setTouched(prev => ({...prev, [name]: true}));

        // Validate field on change if it was previously touched
        if (touched[name]) {
            validateField(name, value);
        }
    };

    // Validate a single field
    const validateField = (name, value) => {
        if (name === "user" && !value) {
            setError(name, "Please select a user");
            return false;
        }
        if (name === "title" && (!value || value.trim() === "")) {
            setError(name, "Please enter a title");
            return false;
        }

        // Clear error if validation passes
        setError(name, null);
        return true;
    };

    // Validate entire form
    const validateForm = () => {
        let isValid = true;

        // Mark all fields as touched
        setTouched({
            user: true,
            title: true
        });

        // Validate user field
        if (!data?.user) {
            isValid = false;
            setError("user", "Please select a user");
        } else {
            setError("user", null);
        }

        // Validate title field
        if (!data?.title || data.title.trim() === "") {
            isValid = false;
            setError("title", "Please enter a title");
        } else {
            setError("title", null);
        }

        return isValid;
    };

    // Set a specific error
    const setError = (key, value) => {
        setErrors(prevErrors => ({
            ...prevErrors,
            [key]: value
        }));
    };

    // Handle field blur
    const handleBlur = (e) => {
        const {name, value} = e.target;
        setTouched(prev => ({...prev, [name]: true}));
        validateField(name, value);
    };

    return (
        <Dialog
            open={open}
            maxWidth="sm"
            fullWidth
            TransitionComponent={Fade}
            transitionDuration={300}
            onClose={!isSubmitting ? onClose : undefined}
        >
            <DialogTitle sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Typography variant="h6">Add Signer</Typography>
                <Tooltip title="Close">
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="close"
                    >
                        <CloseIcon/>
                    </IconButton>
                </Tooltip>
            </DialogTitle>

            <DialogContent dividers>
                <Grid container spacing={3} sx={{mt: 0.5}}>
                    <Grid item xs={12}>
                        <Box sx={{display: 'flex', alignItems: 'flex-start'}}>
                            <SelectSearch
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={Boolean(errors?.user)}
                                name="user"
                                label="Select User"
                                value={data?.user}
                                helperText={errors?.user}
                                url={route("api.users.list")}
                                required
                                fullWidth
                                placeholder="Search and select a user"
                            />
                            <Tooltip title="Select the user who will sign documents">
                                <IconButton size="small" sx={{ml: 1, mt: 1}}>
                                    <HelpOutlineIcon fontSize="small"/>
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Grid>

                    {data?.user && (
                        <Grid item xs={12}>
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                p: 2,
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                boxShadow: 1
                            }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Signature Preview
                                </Typography>
                                {data?.signature ? (
                                    <Box
                                        component="img"
                                        src={data.signature}
                                        alt="User Signature"
                                        sx={{
                                            maxWidth: '200px',
                                            maxHeight: '100px',
                                            objectFit: 'contain',
                                            mt: 1
                                        }}
                                    />
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{fontStyle: 'italic'}}>
                                        No signature available
                                    </Typography>
                                )}
                            </Box>
                        </Grid>
                    )}

                    <Grid item xs={12}>
                        <Box sx={{display: 'flex', alignItems: 'flex-start'}}>
                            <TextField
                                fullWidth
                                label="Title"
                                name="title"
                                value={data?.title || ''}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={Boolean(errors?.title)}
                                helperText={errors?.title || "Enter the signer's title or position"}
                                required
                                variant="outlined"
                                placeholder="e.g., CEO, Director, Manager"
                            />
                            <Tooltip title="The title will appear alongside the signature">
                                <IconButton size="small" sx={{ml: 1, mt: 1}}>
                                    <HelpOutlineIcon fontSize="small"/>
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{padding: 2, justifyContent: 'space-between'}}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit"/> : null}
                >
                    {isSubmitting ? 'Submitting...' : 'Add Signer'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SignerAddForm;
