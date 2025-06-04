import {
    Box,
    TextField,
    Paper,
    Typography,
    Divider,
    Alert,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    InputAdornment
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import SelectSearch from "@/Components/SelectSearch";
import {FormProvider, useFormState} from "@/Components/FormTemplate.jsx";
import React, {useState, useEffect} from "react";
import {
    Science,
    Add,
    Remove,
    QrCode,
    CalendarToday,
    Numbers,
    BiotechOutlined,
    DeleteOutline
} from "@mui/icons-material";

const AddForm = ({open, onClose, defaultValue}) => {
    const url = defaultValue?.id
        ? route('materials.update', defaultValue.id)
        : route('materials.store');

    const defaultData = {
        sample_type: null,
        number_of_tubes: 1,
        tubes: [
            {
                tube_barcode: "",
                expire_date: ""
            }
        ],
        ...defaultValue
    };

    return (
        <FormProvider
            onClose={onClose}
            defaultValue={defaultData}
            open={open}
            url={url}
            maxWidth="md"
            generalTitle={defaultValue?.id ? "Edit Material" : " Materials"}>
            <FormContent/>
        </FormProvider>
    );
};

const FormContent = () => {
    const {data, setData, errors} = useFormState();
    const [tubesList, setTubesList] = useState(data.tubes || [{tube_barcode: "", expire_date: ""}]);

    useEffect(() => {
        // Update tubes list when number changes
        const currentCount = tubesList.length;
        const newCount = parseInt(data.number_of_tubes) || 1;

        if (newCount > currentCount) {
            // Add new empty tubes
            const newTubes = [...tubesList];
            for (let i = currentCount; i < newCount; i++) {
                newTubes.push({tube_barcode: "", expire_date: ""});
            }
            setTubesList(newTubes);
            setData(prev => ({...prev, tubes: newTubes}));
        } else if (newCount < currentCount) {
            // Remove excess tubes
            const newTubes = tubesList.slice(0, newCount);
            setTubesList(newTubes);
            setData(prev => ({...prev, tubes: newTubes}));
        }
    }, [data.number_of_tubes]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setData(prevState => ({...prevState, [name]: value}));
    };

    const handleTubeChange = (index, field, value) => {
        const newTubes = [...tubesList];
        newTubes[index] = {
            ...newTubes[index],
            [field]: value
        };
        setTubesList(newTubes);
        setData(prev => ({...prev, tubes: newTubes}));
    };

    const handleDeleteTube = (index) => {
        const newTubes = tubesList.filter((_, i) => i !== index);
        setTubesList(newTubes);
        setData(prev => ({
            ...prev,
            tubes: newTubes,
            number_of_tubes: newTubes.length
        }));
    };

    const incrementTubes = () => {
        const newValue = Math.min(parseInt(data.number_of_tubes || 1) + 1, 100);
        setData(prev => ({...prev, number_of_tubes: newValue}));
    };

    const decrementTubes = () => {
        const newValue = Math.max(parseInt(data.number_of_tubes || 1) - 1, 1);
        setData(prev => ({...prev, number_of_tubes: newValue}));
    };

    return (
        <Grid size={12}>
            {/* Sample Type Selection */}
            <Paper elevation={0} sx={{p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <Science sx={{mr: 1}}/>
                    Sample Type & Quantity
                </Typography>
                <Divider sx={{mb: 3}}/>

                <Grid container spacing={3}>
                    <Grid size={{xs: 12, sm: 8}}>
                        <SelectSearch
                            value={data.sample_type}
                            label="Sample Type (Kit Type)"
                            fullWidth
                            required
                            error={!!errors?.sample_type}
                            helperText={errors?.sample_type || "Select the type of sample kit"}
                            onChange={handleChange}
                            name="sample_type"
                            url={route("api.sampleTypes.list")}
                            variant="outlined"
                            placeholder="Search and select sample type..."
                            getOptionLabel={(option) => option?.name || ''}
                        />
                    </Grid>

                    <Grid size={{xs: 12, sm: 4}}>
                        <TextField
                            label="Number of Tubes"
                            name="number_of_tubes"
                            fullWidth
                            required
                            type="number"
                            variant="outlined"
                            error={!!errors?.number_of_tubes}
                            helperText={errors?.number_of_tubes || "How many tubes?"}
                            onChange={handleChange}
                            value={data.number_of_tubes || 1}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Numbers fontSize="small"/>
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={decrementTubes}
                                                disabled={data.number_of_tubes <= 1}
                                            >
                                                <Remove fontSize="small"/>
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={incrementTubes}
                                                disabled={data.number_of_tubes >= 100}
                                            >
                                                <Add fontSize="small"/>
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                    inputProps: { min: 1, max: 100 }
                                }
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Tubes Input Section */}
            {data.sample_type && (
                <Paper elevation={0} sx={{p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                    <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                        <BiotechOutlined sx={{mr: 1}}/>
                        Tube Details
                        <Chip
                            label={`${tubesList.length} tube${tubesList.length > 1 ? 's' : ''}`}
                            size="small"
                            color="primary"
                            sx={{ml: 1}}
                        />
                    </Typography>
                    <Divider sx={{mb: 3}}/>

                    {tubesList.length > 5 ? (
                        // Table view for many tubes
                        <TableContainer sx={{maxHeight: 400}}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell width={60}>#</TableCell>
                                        <TableCell>Tube Barcode</TableCell>
                                        <TableCell>Expire Date</TableCell>
                                        <TableCell width={50}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tubesList.map((tube, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    placeholder="Enter tube barcode"
                                                    value={tube.tube_barcode}
                                                    onChange={(e) => handleTubeChange(index, 'tube_barcode', e.target.value)}
                                                    error={!!errors?.[`tubes.${index}.tube_barcode`]}
                                                    helperText={errors?.[`tubes.${index}.tube_barcode`]}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    type="date"
                                                    value={tube.expire_date}
                                                    onChange={(e) => handleTubeChange(index, 'expire_date', e.target.value)}
                                                    error={!!errors?.[`tubes.${index}.expire_date`]}
                                                    helperText={errors?.[`tubes.${index}.expire_date`]}
                                                    slotProps={{
                                                        inputLabel: {shrink: true}
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteTube(index)}
                                                    disabled={tubesList.length <= 1}
                                                >
                                                    <DeleteOutline fontSize="small"/>
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        // Card view for few tubes
                        <Grid container spacing={2}>
                            {tubesList.map((tube, index) => (
                                <Grid size={{xs: 12}} key={index}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '8px',
                                            backgroundColor: '#f9f9f9'
                                        }}
                                    >
                                        <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2}}>
                                            <Typography variant="subtitle2" color="primary">
                                                Tube #{index + 1}
                                            </Typography>
                                            {tubesList.length > 1 && (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteTube(index)}
                                                >
                                                    <DeleteOutline fontSize="small"/>
                                                </IconButton>
                                            )}
                                        </Box>
                                        <Grid container spacing={2}>
                                            <Grid size={{xs: 12, sm: 6}}>
                                                <TextField
                                                    label="Tube Barcode"
                                                    fullWidth
                                                    required
                                                    variant="outlined"
                                                    size="small"
                                                    value={tube.tube_barcode}
                                                    onChange={(e) => handleTubeChange(index, 'tube_barcode', e.target.value)}
                                                    error={!!errors?.[`tubes.${index}.tube_barcode`]}
                                                    helperText={errors?.[`tubes.${index}.tube_barcode`] || "Scan or enter tube barcode"}
                                                    slotProps={{
                                                        input: {
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <QrCode fontSize="small"/>
                                                                </InputAdornment>
                                                            ),
                                                        }
                                                    }}
                                                />
                                            </Grid>
                                            <Grid size={{xs: 12, sm: 6}}>
                                                <TextField
                                                    label="Expire Date"
                                                    fullWidth
                                                    required
                                                    type="date"
                                                    variant="outlined"
                                                    size="small"
                                                    value={tube.expire_date}
                                                    onChange={(e) => handleTubeChange(index, 'expire_date', e.target.value)}
                                                    error={!!errors?.[`tubes.${index}.expire_date`]}
                                                    helperText={errors?.[`tubes.${index}.expire_date`] || "Tube expiration date"}
                                                    slotProps={{
                                                        input: {
                                                            startAdornment: (
                                                                <InputAdornment position="start">
                                                                    <CalendarToday fontSize="small"/>
                                                                </InputAdornment>
                                                            ),
                                                        },
                                                        inputLabel: {shrink: true}
                                                    }}
                                                />
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    {errors?.tubes && (
                        <Alert severity="error" sx={{mt: 2}}>
                            {errors.tubes}
                        </Alert>
                    )}
                </Paper>
            )}

            {/* Info Alert */}
            {!data.sample_type && (
                <Alert severity="info" sx={{mt: 2}}>
                    Please select a sample type first to enter tube details.
                </Alert>
            )}
        </Grid>
    );
};

export default AddForm;
