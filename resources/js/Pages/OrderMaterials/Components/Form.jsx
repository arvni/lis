import {
    Box,
    TextField,
    Paper,
    Typography,
    Divider,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    InputAdornment,
    CircularProgress,
    Fade,
    Badge
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import {FormProvider, useFormState} from "@/Components/FormTemplate.jsx";
import React, {useState, useEffect} from "react";
import {
    Science,
    QrCode,
    BiotechOutlined,
    CheckCircle,
} from "@mui/icons-material";
import axios from 'axios';

const Form = ({open, onClose, defaultValue}) => {
    const defaultData = {
        sample_type: null,
        amount: defaultValue.amount, // Changed from number_of_materials to amount
        materials: [],
        ...defaultValue
    };

    return (
        <FormProvider
            onClose={onClose}
            defaultValue={defaultData}
            open={open}
            url={route('orderMaterials.update', defaultValue.id)}
            maxWidth="md"
            generalTitle="Order Materials">
            <FormContent/>
        </FormProvider>
    );
};

const FormContent = () => {
    const {data, setData, errors, clearErrors, setError} = useFormState();
    const [materialsList, setMaterialsList] = useState(data.materials || []);
    const [validatingIds, setValidatingIds] = useState({});

    useEffect(() => {
        // Update materials list when number changes
        const currentCount = materialsList.length;
        const newCount = parseInt(data.amount) || 1;

        if (newCount > currentCount) {
            // Add new empty materials
            const newMaterials = [...materialsList];
            for (let i = currentCount; i < newCount; i++) {
                newMaterials.push({id: "", barcode: ""});
            }
            setMaterialsList(newMaterials);
            setData(prev => ({...prev, materials: newMaterials}));
        } else if (newCount < currentCount) {
            // Remove excess materials
            const newMaterials = materialsList.slice(0, newCount);
            setMaterialsList(newMaterials);
            setData(prev => ({...prev, materials: newMaterials}));
        }
    }, [data.amount, materialsList.length, setData]); // Added missing dependencies

    const handleMaterialChange = (index, field, value) => {
        const newMaterials = [...materialsList];
        newMaterials[index] = {
            ...newMaterials[index],
            [field]: value
        };
        setMaterialsList(newMaterials);
        setData(prev => ({...prev, materials: newMaterials}));
    };

    const checkBarcode = (id, index) => async (e) => {
        // If the field is required, validate it
        if (e.target.required && e.target.value) {

            // Check for duplicates first (client-side validation)
            const duplicateIndex = materialsList.findIndex((material, idx) =>
                idx !== index && material.barcode.trim() === e.target.value
            );

            if (duplicateIndex !== -1) {
                setError(`materials.${index}.barcode`, `Duplicate barcode. Already used in Material #${duplicateIndex + 1}`);
                setValidatingIds(prev => ({...prev, [index]: false}));
                return;
            }

            try {
                // Set validating state
                setValidatingIds(prev => ({...prev, [index]: true}));

                // Clear previous errors - handle both error formats
                clearErrors(`materials[${index}].barcode`);
                clearErrors(`materials.${index}.barcode`);

                // Build URL params
                const params = new URLSearchParams({
                    sample_id: data.sample_type_id || '',
                    barcode: e.target.value,
                }).toString();

                // Call API to validate
                const response = await axios.get(`${route("api.materials.check")}?${params}`);

                // Clear validating state
                setValidatingIds(prev => ({...prev, [index]: false}));
                handleMaterialChange(index, 'id', response.data.material.id);

            } catch (error) {
                // Set error message - use the bracket format for consistency with validation service
                setError(`materials.${index}.barcode`, error.response?.data?.message || 'Invalid Barcode');

                // Clear validating state
                setValidatingIds(prev => ({...prev, [index]: false}));
            }
        }
    };

    // Helper function to check if field has error
    const hasError = (field, index) => {
        return !!errors?.[`materials.${index}.${field}`] || !!errors?.[`materials[${index}].${field}`];
    };

    // Check if component is disabled (this variable was referenced but not defined)
    const disabled = false; // You may need to get this from props or state

    return (
        <Grid size={12}>
            {/* Sample Type Selection */}
            <Paper elevation={0} sx={{p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <Science sx={{mr: 1}}/>
                    {data.sample_type_name}
                </Typography>
                <Divider sx={{mb: 3}}/>
            </Paper>

            {/* Materials Input Section */}
            <Paper elevation={0} sx={{p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0'}}>
                <Typography variant="h6" gutterBottom sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                    <BiotechOutlined sx={{mr: 1}}/>
                    Material Details
                    <Chip
                        label={`${materialsList.length} material${materialsList.length > 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        sx={{ml: 1}}
                    />
                </Typography>
                <Divider sx={{mb: 3}}/>

                {materialsList.length > 5 ? (
                    // Table view for many materials
                    <TableContainer sx={{maxHeight: 400}}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell width={60}>#</TableCell>
                                    <TableCell>Barcode</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {materialsList.map((material, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                onChange={(e) => handleMaterialChange(index, 'barcode', e.target.value)}
                                                value={material.barcode}
                                                name="barcode"
                                                placeholder="Enter material barcode"
                                                label="Barcode"
                                                onBlur={checkBarcode(data.sample_id, index)}
                                                error={hasError('barcode', index)}
                                                disabled={disabled || validatingIds[index]}
                                                helperText={errors?.[`materials.${index}.barcode`] || errors?.[`materials[${index}].barcode`]}
                                                id={`field-materials.${index}.barcode`} // Fixed ID
                                                slotProps={{
                                                    input: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Badge color="primary"/>
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: validatingIds[index] ? (
                                                            <InputAdornment position="end">
                                                                <CircularProgress size={20}/>
                                                            </InputAdornment>
                                                        ) : !hasError('barcode', index) && material.barcode ? (
                                                            <InputAdornment position="end">
                                                                <Fade in={true}>
                                                                    <CheckCircle color="success" fontSize="small"/>
                                                                </Fade>
                                                            </InputAdornment>
                                                        ) : null,
                                                        sx: {
                                                            borderRadius: 1.5,
                                                            transition: 'all 0.2s ease-in-out',
                                                            '&:hover': {
                                                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                            },
                                                            '&.Mui-focused': {
                                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                            }
                                                        }
                                                    }
                                                }}
                                                required
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 1.5,
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    // Card view for few materials
                    <Grid container spacing={2}>
                        {materialsList.map((material, index) => (
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
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        mb: 2
                                    }}>
                                        <Typography variant="subtitle2" color="primary">
                                            Material #{index + 1}
                                        </Typography>
                                    </Box>
                                    <Grid container spacing={2}>
                                        <Grid size={{xs: 12, sm: 6}}>
                                            <TextField
                                                label="Barcode"
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                required
                                                value={material.barcode}
                                                onChange={(e) => handleMaterialChange(index, 'barcode', e.target.value)}
                                                onBlur={checkBarcode(data.sample_id, index)}
                                                error={hasError('barcode', index)}
                                                helperText={errors?.[`materials.${index}.barcode`] || errors?.[`materials[${index}].barcode`] || "Scan or enter material barcode"}
                                                disabled={disabled || validatingIds[index]}
                                                slotProps={{
                                                    input: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <QrCode fontSize="small"/>
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: validatingIds[index] ? (
                                                            <InputAdornment position="end">
                                                                <CircularProgress size={20}/>
                                                            </InputAdornment>
                                                        ) : !hasError('barcode', index) && material.barcode ? (
                                                            <InputAdornment position="end">
                                                                <Fade in={true}>
                                                                    <CheckCircle color="success" fontSize="small"/>
                                                                </Fade>
                                                            </InputAdornment>
                                                        ) : null,
                                                    }
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {errors?.materials && (
                    <Alert severity="error" sx={{mt: 2}}>
                        {errors.materials}
                    </Alert>
                )}
            </Paper>
        </Grid>
    );
};

export default Form;
