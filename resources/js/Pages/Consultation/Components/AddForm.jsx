import React, {useCallback, useEffect, useState} from "react";
import {useForm} from "@inertiajs/react";
import axios from "axios";

// MUI Components
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Container,
    Grid2 as Grid,
    FormGroup,
    FormHelperText,
    Radio,
    RadioGroup,
    FormControlLabel,
    CircularProgress,
    Typography,
    TextField,
    Paper,
    Divider,
    Box,
    Alert,
    Snackbar, Tooltip
} from "@mui/material";

// Icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// Components
import SelectSearch from "@/Components/SelectSearch";
import Autocomplete from "@mui/material/Autocomplete";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import BadgeIcon from "@mui/icons-material/Badge";

const AddForm = ({openAdd, onClose}) => {
    const [times, setTimes] = useState([]);
    const [waiting, setWaiting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    // Format current date properly
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // +1 because months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = new Date();
    const formattedDate = formatDate(today);

    const {data, setData, processing, post, errors, setError, reset} = useForm({
        consultant: "",
        dueDate: formattedDate,
        time: null,
        customer: {
            phone: "",
            name: "",
            email: ""
        },
        note:"",
    });

    useEffect(() => {
        if (data.consultant && data.dueDate) {
            setWaiting(true);
            getTimes();
        } else {
            setTimes([]);
        }
    }, [data.consultant, data.dueDate]);

    const getTimes = () => {
        axios
            .get(
                route("list-reservation-times", {
                    consultant: data.consultant?.id,
                    date: data.dueDate
                })
            )
            .then(({data}) => setTimes(data.data))
            .then(() => setWaiting(false))
            .catch((error) => {
                console.error("Error fetching times:", error);
                setWaiting(false);
            });
    };

    const handleChange = (e) =>
        setData((previousData) => ({
            ...previousData,
            [e.target.name]: e.target.value
        }));

    const handleSubmit = () => {
        if (check()) {
            post(route("book-an-appointment"), {
                onSuccess: () => {
                    setShowSuccess(true);
                        onClose();
                        reset();
                }
            });
        }
    };

    const check = () => {
        let isValid = true;

        if (!data.consultant) {
            setError("consultant", "Please select a consultant");
            isValid = false;
        }

        if (!data.dueDate) {
            setError("dueDate", "Please select a date");
            isValid = false;
        }

        if (!data.time) {
            setError("time", "Please select a time slot");
            isValid = false;
        }
        if (!data.customer.phone)
            setError("customer.phone", "Please Enter customer phone number");
        if (!data.customer.name)
            setError("customer.phone", "Please Enter customer name");
        return isValid;
    };


    const fetchData = useCallback((_, search) => {
        setLoading(true);
        setData(prevData => ({...prevData, customer: {phone: search}}));
        fetch(route("api.customers.list", {search}))
            .then(response => response.json())
            .then(data => {
                setOptions(data.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching customers:", error);
                setLoading(false);
                setOptions([]);
            });

    }, [open])

    // Handle customer selection
    const handleCustomerSelect = (event, newValue) => {
        setData(previousData => ({
            ...previousData,
            customer: newValue || {
                phone: "",
                name: "",
                email: ""
            }
        }))
    };

    const handleCustomerChange=(field,value)=>setData(previousData => ({...previousData,customer: {...previousData.customer,[field]:value}}))


    return (
        <>
            <Dialog
                open={openAdd && !processing}
                onClose={onClose}
                maxWidth="md"
                fullWidth
                slotProps={{
                    Paper: {
                        elevation: 3,
                        sx: {borderRadius: 2}
                    }
                }}
            >
                <DialogTitle sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    py: 2
                }}>
                    <Typography variant="h5" fontWeight="500">
                        Schedule New Reservation
                    </Typography>
                </DialogTitle>
                <Divider/>

                <DialogContent sx={{p: 3, mt: 1}}>
                    <Container>

                        <Box>
                            <Typography variant="subtitle1" fontWeight="medium" sx={{mb: 2}}>
                                Referring Customer Information
                            </Typography>

                            <Grid container spacing={3}>
                                <Grid size={{xs: 12, sm: 6, md: 4}}>
                                    <Box sx={{display: "flex", alignItems: "flex-start"}}>
                                        <Autocomplete
                                            id="doctor-autocomplete"
                                            open={open}
                                            onOpen={() => setOpen(true)}
                                            onClose={() => setOpen(false)}
                                            value={data.customer || ""}
                                            onChange={handleCustomerSelect}
                                            onInputChange={fetchData}
                                            isOptionEqualToValue={(option, value) => option.id === value.id}
                                            getOptionLabel={(option) => option.phone || ''}
                                            options={options}
                                            loading={loading}
                                            fullWidth
                                            freeSolo
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    name="phone"
                                                    label="Phone Number"
                                                    value={data.customer?.phone || ""}
                                                    placeholder="Search or enter phone"
                                                    slotProps={{
                                                        input: {
                                                            ...params.InputProps,
                                                            startAdornment: <MedicalServicesIcon color="action" sx={{mr: 1}}/>,
                                                            endAdornment: loading ? <CircularProgress size="small"/> : null
                                                        },
                                                    }}
                                                />
                                            )}
                                        />
                                        <Tooltip title="Search for an existing customer or enter a new phone">
                                            <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                                        </Tooltip>
                                    </Box>
                                </Grid>

                                <Grid size={{xs: 12, sm: 6, md: 4}}>
                                    <Box sx={{display: "flex", alignItems: "flex-start"}}>
                                        <TextField
                                            name="name"
                                            label="Name"
                                            value={data?.customer?.name || ""}
                                            onChange={e => handleCustomerChange('name', e.target.value)}
                                            fullWidth
                                            required
                                            placeholder="e.g. Ali"
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <LocalHospitalIcon color="action" sx={{mr: 1}}/>
                                                    ),
                                                }
                                            }}
                                        />
                                        <Tooltip title="Customer Full Name">
                                            <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                                        </Tooltip>
                                    </Box>
                                </Grid>


                                <Grid size={{xs: 12, sm: 6, md: 4}}>
                                    <Box sx={{display: "flex", alignItems: "flex-start"}}>
                                        <TextField
                                            name="email"
                                            label="Email"
                                            value={data.customer?.email || ""}
                                            onChange={e => handleCustomerChange('email', e.target.value)}
                                            fullWidth
                                            placeholder="example@example.com"
                                            slotProps={{
                                                input: {
                                                    startAdornment: (
                                                        <BadgeIcon color="action" sx={{mr: 1}}/>
                                                    ),
                                                }
                                            }}
                                        />
                                        <Tooltip title="Customer Email">
                                            <HelpOutlineIcon fontSize="small" color="action" sx={{ml: 1, mt: 2}}/>
                                        </Tooltip>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        <Grid container spacing={3} sx={{mt:2}}>
                            {/* Consultant Selection */}
                            <Grid size={{xs: 12, md: 6}}>
                                <Paper elevation={0}
                                       sx={{p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2}}>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <PersonIcon color="primary" sx={{mr: 1}}/>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            Select Consultant
                                        </Typography>
                                    </Box>

                                    <SelectSearch
                                        onChange={handleChange}
                                        value={data.consultant}
                                        url={route("list-consultants")}
                                        name="consultant"
                                        label="Consultant"
                                        error={Boolean(errors.consultant)}
                                        helperText={errors?.consultant}
                                        fullWidth
                                    />
                                </Paper>
                            </Grid>

                            {/* Date Selection */}
                            <Grid size={{xs: 12, md: 6}}>
                                <Paper elevation={0}
                                       sx={{p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2}}>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <CalendarTodayIcon color="primary" sx={{mr: 1}}/>
                                        <Typography variant="subtitle1" fontWeight="medium">
                                            Select Date
                                        </Typography>
                                    </Box>

                                    <FormGroup>
                                        <TextField
                                            type="date"
                                            name="dueDate"
                                            value={data.dueDate}
                                            onChange={handleChange}
                                            fullWidth
                                            slotProps={{inputLabel: {shrink: true}, input: {min: formattedDate}}}
                                            error={errors.hasOwnProperty("dueDate")}
                                            helperText={errors?.dueDate}
                                        />
                                    </FormGroup>
                                </Paper>
                            </Grid>

                            {/* Time Selection */}
                            {(times.length > 0 || waiting) && (
                                <Grid size={{xs: 12}}>
                                    <Paper elevation={0}
                                           sx={{p: 2, border: "1px solid", borderColor: "divider", borderRadius: 2}}>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <AccessTimeIcon color="primary" sx={{mr: 1}}/>
                                            <Typography variant="subtitle1" fontWeight="medium">
                                                Available Time Slots
                                            </Typography>
                                        </Box>

                                        {waiting ? (
                                            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                                                <CircularProgress size={40}/>
                                                <Typography variant="body2" color="text.secondary" ml={2}>
                                                    Loading available times...
                                                </Typography>
                                            </Box>
                                        ) : times.length > 0 ? (
                                            <>
                                                <RadioGroup
                                                    name="time"
                                                    value={data.time}
                                                    onChange={handleChange}
                                                    sx={{display: "flex", flexDirection: "row", flexWrap: "wrap"}}
                                                >
                                                    {times.map((item, index) => (
                                                        <FormControlLabel
                                                            key={index}
                                                            value={item.value}
                                                            label={item.label}
                                                            disabled={item.disabled}
                                                            control={
                                                                <Radio
                                                                    color="primary"
                                                                    disabled={item.disabled}
                                                                    checkedIcon={<CheckCircleIcon/>}
                                                                />
                                                            }
                                                            sx={{
                                                                border: "1px solid",
                                                                borderColor: data.time === item.value ? "primary.main" : "divider",
                                                                borderRadius: "8px",
                                                                m: 0.5,
                                                                p: 0.5,
                                                                pr: 1.5,
                                                                transition: "all 0.2s",
                                                                bgcolor: data.time === item.value ? "action.selected" : "background.paper",
                                                                "&:hover": {
                                                                    bgcolor: "action.hover",
                                                                    borderColor: "primary.light"
                                                                }
                                                            }}
                                                        />
                                                    ))}
                                                </RadioGroup>

                                                {errors.time && (
                                                    <FormHelperText error>{errors.time}</FormHelperText>
                                                )}
                                            </>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary" textAlign="center"
                                                        py={2}>
                                                No available time slots. Please try another date or consultant.
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            )}
                            <Grid size={{xs: 12}}>
                                    <TextField
                                        name="note"
                                        label="Note"
                                        value={data?.note || ""}
                                        onChange={handleChange}
                                        fullWidth
                                        multiline
                                        rows={3}
                                    />
                            </Grid>
                        </Grid>
                    </Container>
                </DialogContent>

                <Divider/>

                <DialogActions sx={{px: 3, py: 2, justifyContent: "space-between"}}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        color="inherit"
                        sx={{borderRadius: 2}}
                    >
                        Cancel
                    </Button>

                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disableElevation
                        disabled={processing}
                        startIcon={processing ? <CircularProgress size={20} color="inherit"/> : null}
                        sx={{
                            borderRadius: 2,
                            px: 3
                        }}
                    >
                        {processing ? "Scheduling..." : "Schedule Consultation"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={showSuccess}
                autoHideDuration={2000}
                anchorOrigin={{vertical: 'top', horizontal: 'center'}}
            >
                <Alert severity="success" variant="filled">
                    Consultation scheduled successfully!
                </Alert>
            </Snackbar>
        </>
    );
};

export default AddForm;
