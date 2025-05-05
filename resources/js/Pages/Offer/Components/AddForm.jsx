import {
    Box,
    FormControl,
    FormControlLabel,
    FormLabel,
    InputAdornment,
    TextField,
    Radio,
    RadioGroup,
    Paper,
    Typography,
    Divider,
    Tooltip,
    Switch,
    Alert
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import SelectSearch from "@/Components/SelectSearch";
import {FormProvider, useFormState} from "@/Components/FormTemplate.jsx";
import React, {useState, useEffect} from "react";
import {
    ReceiptLong,
    Science,
    ViewInAr,
    Description,
    Event,
    Percent as PercentIcon,
    AttachMoney,
    Info,
    CheckCircle
} from "@mui/icons-material";
import {LocateFixedIcon} from "lucide-react";

const AddForm = ({open, onClose, defaultValue}) => {
    const url = defaultValue?.id
        ? route('offers.update', defaultValue.id)
        : route('offers.store');

    const defaultData = {
        name: "",
        description: "",
        offer_group: null,
        type: "PERCENTAGE", // Default selection
        amount: "",
        tests: [],
        referrers: [],
        started_at: "",
        ended_at: "",
        active: true,
        ...defaultValue
    };

    return (
        <FormProvider
            onClose={onClose}
            defaultValue={defaultData}
            open={open}
            url={url}
            generalTitle={defaultValue?.id ? "Edit Offer" : "Create New Offer"}>
            <FormContent/>
        </FormProvider>
    );
};

const FormContent = () => {
    const {data, setData, errors} = useFormState();
    const [dateError, setDateError] = useState(false);

    useEffect(() => {
        // Validate that end date is after start date
        if (data.started_at && data.ended_at && new Date(data.ended_at) <= new Date(data.started_at)) {
            setDateError(true);
        } else {
            setDateError(false);
        }
    }, [data.started_at, data.ended_at]);

    const handleChange = (e) => {
        const {name, value, type, checked} = e.target;
        setData(prevState => ({...prevState, [name]: type === "checkbox" ? checked : value}));
    };

    const handleTypeChange = (e, v) => setData(prevState => ({...prevState, type: v}));

    return (
        <Box sx={{p: 1}}>
            {/* Main Info Section */}
            <Paper elevation={0} sx={{p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <ViewInAr sx={{mr: 1}}/>
                    Basic Information
                </Typography>
                <Divider sx={{mb: 3}}/>

                <Grid container spacing={3}>
                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            label="Offer Title"
                            name="title"
                            fullWidth
                            required
                            variant="outlined"
                            error={!!errors?.title}
                            helperText={errors?.title || "Enter a descriptive title for this offer"}
                            onChange={handleChange}
                            value={data.title}
                            slotProps={{
                                input:{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <ReceiptLong fontSize="small"/>
                                        </InputAdornment>
                                    ),
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={{xs: 12, sm: 6}}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={data?.active}
                                    onChange={handleChange}
                                    name="active"
                                    color="success"
                                />
                            }
                            label={
                                <Box sx={{display: 'flex', alignItems: 'center'}}>
                                    <CheckCircle fontSize="small" color={data?.active ? "success" : "disabled"}
                                                 sx={{mr: 1}}/>
                                    <Typography>{data?.active ? "Active Offer" : "Inactive Offer"}</Typography>
                                </Box>
                            }
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Offer Details Section */}
            <Paper elevation={0} sx={{p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <AttachMoney sx={{mr: 1}}/>
                    Offer Details
                </Typography>
                <Divider sx={{mb: 3}}/>

                <Grid container spacing={3}>
                    <Grid size={{xs: 12, sm: 6}}>
                        <FormControl sx={{width: '100%'}} required>
                            <FormLabel id="offer-type-label" sx={{mb: 1}}>Offer Type</FormLabel>
                            <RadioGroup
                                row
                                aria-labelledby="offer-type-label"
                                name="type"
                                onChange={handleTypeChange}
                                value={data.type}
                                sx={{mb: 1}}
                            >
                                <FormControlLabel
                                    value="PERCENTAGE"
                                    control={<Radio color="primary"/>}
                                    label={
                                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                                            <PercentIcon fontSize="small" sx={{mr: 0.5}}/>
                                            Percentage
                                        </Box>
                                    }
                                />
                                <FormControlLabel
                                    value="FIXED"
                                    control={<Radio color="primary"/>}
                                    label={
                                        <Box sx={{display: 'flex', alignItems: 'center'}}>
                                            <LocateFixedIcon size={18} style={{marginRight: '4px'}}/>
                                            Fixed Amount
                                        </Box>
                                    }
                                />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            label="Amount"
                            name="amount"
                            fullWidth
                            required
                            type="number"
                            variant="outlined"
                            error={!!errors?.amount}
                            helperText={errors?.amount || (data.type === "PERCENTAGE" ? "Enter percentage value (0-100)" : "Enter fixed amount")}
                            onChange={handleChange}
                            value={data.amount}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            {data.type === "PERCENTAGE" ? "%" : "$"}
                                        </InputAdornment>
                                    ),
                                }
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Date Range Section */}
            <Paper elevation={0} sx={{p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <Event sx={{mr: 1}}/>
                    Date Range
                </Typography>
                <Divider sx={{mb: 3}}/>

                <Grid container spacing={3}>
                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            label="Start Date"
                            name="started_at"
                            type="date"
                            fullWidth
                            variant="outlined"
                            error={!!errors?.started_at}
                            helperText={errors?.started_at || "When this offer becomes available"}
                            onChange={handleChange}
                            value={data.started_at || ""}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Event fontSize="small"/>
                                        </InputAdornment>
                                    ),
                                },
                                inputLabel: {shrink: true,}
                            }}
                        />
                    </Grid>

                    <Grid size={{xs: 12, sm: 6}}>
                        <TextField
                            label="End Date"
                            name="ended_at"
                            type="date"
                            fullWidth
                            variant="outlined"
                            error={!!errors?.ended_at || dateError}
                            helperText={errors?.ended_at || (dateError ? "End date must be after start date" : "When this offer expires")}
                            onChange={handleChange}
                            value={data.ended_at || ""}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Event fontSize="small"/>
                                        </InputAdornment>
                                    ),
                                },
                                inputLabel: {shrink: true}
                            }}
                        />
                    </Grid>

                    {dateError && (
                        <Grid size={{xs: 12,}}>
                            <Alert severity="error">
                                End date must be after start date
                            </Alert>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* Relationships Section */}
            <Paper elevation={0} sx={{p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <Science sx={{mr: 1}}/>
                    Relationships
                    <Tooltip title="Select which tests and referrers this offer applies to" arrow>
                        <Info fontSize="small" sx={{ml: 1, color: 'text.secondary'}}/>
                    </Tooltip>
                </Typography>
                <Divider sx={{mb: 3}}/>

                <Grid container spacing={3}>
                    <Grid size={{xs: 12, sm: 6}}>
                        <SelectSearch
                            filterSelectedOptions
                            value={data.tests}
                            label="Tests"
                            fullWidth
                            multiple
                            error={!!errors?.tests}
                            helperText={errors?.tests || "Select tests applicable to this offer"}
                            onChange={handleChange}
                            name="tests"
                            url={route("api.tests.list")}
                            variant="outlined"
                            placeholder="Search and select tests..."
                        />
                    </Grid>

                    <Grid size={{xs: 12, sm: 6}}>
                        <SelectSearch
                            filterSelectedOptions
                            value={data.referrers}
                            label="Referrers"
                            fullWidth
                            multiple
                            error={!!errors?.referrers}
                            helperText={errors?.referrers || "Select referrers for this offer"}
                            onChange={handleChange}
                            name="referrers"
                            url={route("api.referrers.list")}
                            variant="outlined"
                            placeholder="Search and select referrers..."
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Description Section */}
            <Paper elevation={0} sx={{p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <Description sx={{mr: 1}}/>
                    Description
                    <Tooltip title="Provide detailed information about this offer" arrow>
                        <Info fontSize="small" sx={{ml: 1, color: 'text.secondary'}}/>
                    </Tooltip>
                </Typography>
                <Divider sx={{mb: 3}}/>

                <Grid container spacing={3}>
                    <Grid size={{xs: 12,}}>
                        <TextField
                            label="Description"
                            name="description"
                            fullWidth
                            multiline
                            rows={4}
                            variant="outlined"
                            error={!!errors?.description}
                            helperText={errors?.description || "Enter any additional details about this offer"}
                            onChange={handleChange}
                            value={data.description || ""}
                            placeholder="Describe the offer, its conditions, and any other relevant information..."
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default AddForm;
