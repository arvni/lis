import {
    Alert,
    Box,
    Typography,
    Paper,
    Tooltip,
    IconButton,
    Fade,
    useTheme,
} from "@mui/material";
import React, {useState, useEffect} from "react";
import AddMethodForm from "@/Pages/Test/Components/AddMethodForm";
import DeleteForm from "@/Components/DeleteForm";
import {makeId} from "@/Services/helper";
import MethodsList from "@/Pages/Test/Components/MethodsList.jsx";
import SelectMethodForm from "@/Pages/Test/Components/SelectMethodForm.jsx";
import {Info} from "@mui/icons-material";

const MethodField = ({
                         onChange,
                         error,
                         name,
                         label,
                         methodTests = [],
                         type = '1',
                         description
                     }) => {
    const theme = useTheme();
    const [methodTest, setMethodTest] = useState({
        method: {
            price_type: "Fix",
            referrer_price_type: "Fix",
            no_patient: 1,
            no_sample: 1,
        },
        status: true
    });
    const [errors, setErrors] = useState({});
    const [openAddForm, setOpenAddForm] = useState(false);
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [showAlert, setShowAlert] = useState(Boolean(error));

    // Reset alert visibility when error changes
    useEffect(() => {
        setShowAlert(Boolean(error));
    }, [error]);

    // Hide error alert after 5 seconds
    useEffect(() => {
        let timer;
        if (showAlert && error) {
            timer = setTimeout(() => {
                setShowAlert(false);
            }, 5000);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [showAlert, error]);

    const handleAdd = () => {
        resetMethodTest();
        setOpenAddForm(true);
    };

    const handleEdit = (id) => () => {
        const index = findIndex(id);
        if (index >= 0) {
            setMethodTest(methodTests[index]);
            setOpenAddForm(true);
        }
    };

    const handleDelete = (id) => () => {
        const index = findIndex(id);
        if (index >= 0) {
            setMethodTest(methodTests[index]);
            setOpenDeleteForm(true);
        }
    };

    const submitDeleteMethod = () => {
        const tmp = [...methodTests];
        const index = findIndex(methodTest.id);
        if (index >= 0) {
            tmp.splice(index, 1);
            onChange(name, tmp);
        }
        cancelDeleteMethod();
    };

    const cancelDeleteMethod = () => {
        setOpenDeleteForm(false);
        resetMethodTest();
    };

    const resetMethodTest = () => setMethodTest({
        method: {
            price_type: "Fix",
            referrer_price_type: "Fix",
        },
        status: true
    });

    const handleCloseAddForm = () => {
        setOpenAddForm(false);
        setErrors({});
        resetMethodTest();
    };

    const handleChange = (key, value) => setMethodTest(prevMethod => ({...prevMethod, [key]: value}));

    const handleMethodChange = (key, value) => handleChange("method", {...methodTest?.method || {}, [key]: value});

    const handleSubmit = () => {
        if (validateForm()) {
            const tmp = [...methodTests];
            if (methodTest.id) {
                const index = findIndex(methodTest.id);
                if (index >= 0) {
                    tmp[index] = methodTest;
                }
            } else {
                tmp.push({...methodTest, id: makeId(5)});
            }
            onChange(name, tmp);
            setOpenAddForm(false);
            resetMethodTest();
        }
    };

    const findIndex = id => methodTests.findIndex(item => item.id === id);

    const validateForm = () => {
        let validationErrors = {};

        if (type !== 'PANEL') {
            // Validation for method name
            if (!methodTest?.method?.name) {
                validationErrors.name = "Please enter method name";
            } else if (methodTest.method.name.trim().length < 2) {
                validationErrors.name = "Method name must be at least 2 characters";
            }

            // Validation for price
            if (!methodTest?.method?.price) {
                validationErrors.price = "Please enter method price";
            } else if (methodTest?.method?.price < 1) {
                validationErrors.price = "Method price must be greater than 0";
            }

            // Validation for price
            if (!methodTest?.method?.referrer_price) {
                validationErrors.referrer_price = "Please enter method referrer price";
            } else if (methodTest?.method?.referrer_price < 1) {
                validationErrors.referrer_price = "Method referrer price must be greater than 0";
            }

            if (type === 'TEST') {
                // Validation for turnaround time
                if (!methodTest.method?.turnaround_time) {
                    validationErrors.turnaround_time = "Please enter method turnaround time";
                } else if (methodTest?.method?.turnaround_time < 1) {
                    validationErrors.turnaround_time = "Method turnaround time must be greater than 0";
                }

                // Validation for workflow
                if (!methodTest?.method?.workflow?.id) {
                    validationErrors.workflow = "Please select a workflow";
                }

                // Validation for barcode group
                if (!methodTest?.method?.barcode_group?.id) {
                    validationErrors.barcode_group = "Please select a barcode group";
                }
            }
        } else {
            // Validation for selected method
            if (!methodTest?.method || !methodTest?.method?.id) {
                validationErrors.method = "Please select a method";
            }
        }

        setErrors(validationErrors);
        return Object.keys(validationErrors).length === 0;
    };

    const handleStatusChange = (id) => (e) => {
        const tmp = [...methodTests];
        const index = findIndex(id);
        if (index >= 0) {
            tmp[index] = {...tmp[index], status: e.target.checked};
            onChange(name, tmp);
        }
    };

    return (
        <Paper
            elevation={0}
            variant="outlined"
            sx={{
                p: 3,
                mb: 4,
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper
            }}
        >
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2
            }}>
                <Typography
                    variant="h5"
                    align="center"
                    sx={{
                        fontWeight: 'medium',
                        position: 'relative',
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: -8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '40px',
                            height: '3px',
                            backgroundColor: theme.palette.primary.main,
                            borderRadius: '2px'
                        }
                    }}
                >
                    {label}
                </Typography>
                {description && (
                    <Tooltip title={description}>
                        <IconButton size="small" sx={{ml: 1, mt: -1}}>
                            <Info fontSize="small" color="action"/>
                        </IconButton>
                    </Tooltip>
                )}
            </Box>

            {error && (
                <Fade in={showAlert}>
                    <Alert
                        severity="error"
                        sx={{mb: 2}}
                        onClose={() => setShowAlert(false)}
                    >
                        {error}
                    </Alert>
                </Fade>
            )}

            <MethodsList
                methodTests={methodTests}
                type={type}
                onStatusChange={handleStatusChange}
                handleAdd={handleAdd}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
            />

            {type !== "PANEL" ? (
                <AddMethodForm
                    onChange={handleMethodChange}
                    method={methodTest.method}
                    onSubmit={handleSubmit}
                    open={openAddForm}
                    type={type}
                    onClose={handleCloseAddForm}
                    errors={errors}
                />
            ) : (
                <SelectMethodForm
                    onChange={handleChange}
                    method={methodTest.method}
                    onSubmit={handleSubmit}
                    open={openAddForm}
                    errors={errors}
                    onClose={handleCloseAddForm}
                />
            )}

            <DeleteForm
                title={`Delete ${methodTest?.method?.name || 'Method'}`}
                confirmText={`Are you sure you want to delete the method "${methodTest?.method?.name || ''}"? This action cannot be undone.`}
                confirmButtonText="Delete Method"
                cancelButtonText="Cancel"
                agreeCB={submitDeleteMethod}
                disAgreeCB={cancelDeleteMethod}
                openDelete={openDeleteForm}
            />
        </Paper>
    );
};

export default MethodField;
