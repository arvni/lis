import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { Delete, Edit, ContentCopy, Download, Add } from '@mui/icons-material';
import {
    Alert,
    Snackbar,
    Tooltip,
    CircularProgress,
    Box,
    Typography
} from '@mui/material';

import TableLayout from '@/Layouts/TableLayout';
import Filter from './Filter';
import AddPrice from '@/Pages/Referrer/Components/AddPrice';
import DeleteForm from '@/Components/DeleteForm';
import PageHeader from "@/Components/PageHeader.jsx";
import Button from "@mui/material/Button";
import CopyForm from "@/Pages/Referrer/Components/CopyFrom.jsx";

const ReferrerTestsTab = ({ referrer }) => {
    // State management with improved structure
    const [referrerTests, setReferrerTests] = useState({
        data: [],
        total: 0,
        current_page: 1,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const [requestInputs, setRequestInputs] = useState({
        filters: {},
        page: 1,
        pageSize: 10,
        sort: {
            field: 'id',
            type: 'asc',
        },
    });

    const [referrerTest, setReferrerTest] = useState({
        test: null,
        price: 0,
        price_type: 'Fix',
        methods: [],
        referrer: { id: referrer.id },
    });

    // Dialog states
    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);
    const [openCopyForm, setOpenCopyForm] = useState(false);

    // Load data on referrer change
    useEffect(() => {
        if (referrer?.id) {
            pageReload();
        }
    }, [referrer?.id]);

    // Enhanced column definition with better UX
    const columns = useMemo(() => [
        {
            field: 'test',
            headerName: 'Test Name',
            type: 'string',
            width: 250,
            sortable: false,
            renderCell: ({ row }) => (
                <Box>
                    <Typography variant="body2" fontWeight="medium">
                        {row?.test?.name || 'N/A'}
                    </Typography>
                    {row?.test?.code && (
                        <Typography variant="caption" color="text.secondary">
                            Code: {row.test.code}
                        </Typography>
                    )}
                </Box>
            ),
        },
        {
            field: 'test_type',
            headerName: 'Type',
            type: 'string',
            width: 100,
            sortable: false,
            renderCell: ({ row }) => (
                <Typography
                    variant="body2"
                    sx={{
                        color: row?.test?.type === 'PANEL' ? 'primary.main' : 'text.secondary',
                        fontWeight: row?.test?.type === 'PANEL' ? 'medium' : 'normal'
                    }}
                >
                    {row?.test?.type || 'N/A'}
                </Typography>
            ),
        },
        {
            field: 'price',
            headerName: 'Price',
            type: 'number',
            width: 120,
            renderCell: ({ row }) => {
                if (row?.test?.type === 'PANEL') {
                    return (
                        <Typography variant="body2" fontWeight="medium">
                            OMR {Number(row?.price*1)?.toFixed(2) || '0.00'}
                        </Typography>
                    );
                }
                return (
                    <Typography variant="body2" color="text.secondary">
                        -
                    </Typography>
                );
            },
        },
        {
            field: 'price_type',
            headerName: 'Price Type',
            type: 'string',
            width: 100,
            sortable: false,
            renderCell: ({ row }) => (
                <Typography variant="body2">
                    {row?.price_type || 'N/A'}
                </Typography>
            ),
        },
        {
            field: 'id',
            headerName: 'Actions',
            type: 'actions',
            width: 120,
            sortable: false,
            getActions: (params) => [
                <GridActionsCellItem
                    key="edit"
                    icon={
                        <Tooltip title="Edit test">
                            <Edit />
                        </Tooltip>
                    }
                    label="Edit"
                    onClick={editReferrerTest(params.row.id)}
                    disabled={loading}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={
                        <Tooltip title="Delete test">
                            <Delete />
                        </Tooltip>
                    }
                    label="Delete"
                    onClick={deleteReferrerTest(params.row.id)}
                    disabled={loading}
                />,
            ],
        },
    ], [loading]);

    // Enhanced error handling
    const handleError = useCallback((error, customMessage = '') => {
        console.error('API Error:', error);
        const errorMessage = customMessage ||
            error?.response?.data?.message ||
            error?.message ||
            'An unexpected error occurred';
        setError(errorMessage);
        setLoading(false);
    }, []);

    // Enhanced success handling
    const handleSuccess = useCallback((message) => {
        setSuccessMessage(message);
        setError(null);
    }, []);

    // Enhanced page reload function
    const pageReload = useCallback(
        async (
            page = requestInputs.page,
            filters = requestInputs.filters,
            sort = requestInputs.sort,
            pageSize = requestInputs.pageSize
        ) => {
            if (!referrer?.id) return;

            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(
                    route('referrer-tests.index', {
                        referrer: { id: referrer.id },
                        page,
                        filters,
                        sort,
                        pageSize,
                    })
                );

                setReferrerTests(response.data.referrerTests);
                setRequestInputs(response.data.requestInputs);
            } catch (error) {
                handleError(error, 'Failed to load referrer tests');
            } finally {
                setLoading(false);
            }
        },
        [referrer?.id, requestInputs, handleError]
    );

    // Enhanced edit handler
    const editReferrerTest = useCallback((id) => async (e) => {
        e.preventDefault();
        e.stopPropagation();

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(route('referrer-tests.show', id));
            console.log(response.data);
            setReferrerTest({
                ...response?.data?.data,
                referrer: { id: referrer.id },
                _method: 'put'
            });
            setOpenAddForm(true);
        } catch (error) {
            handleError(error, 'Failed to load test details');
        } finally {
            setLoading(false);
        }
    }, [referrer?.id, handleError]);

    // Enhanced delete handler
    const deleteReferrerTest = useCallback((id) => () => {
        const testToDelete = referrerTests.data.find((item) => item.id === id);
        if (testToDelete) {
            setReferrerTest({ ...testToDelete, _method: 'delete' });
            setOpenDeleteForm(true);
        }
    }, [referrerTests.data]);

    // Reset form state
    const resetReferrerTest = useCallback(() => {
        setReferrerTest({
            test: null,
            methods: [],
            price: 0,
            price_type: 'Fix',
            referrer: { id: referrer.id },
        });
    }, [referrer.id]);

    // Enhanced form close handlers
    const closeDeleteForm = useCallback(() => {
        setOpenDeleteForm(false);
        resetReferrerTest();
    }, [resetReferrerTest]);

    const deleteMethod = useCallback(() => {
        router.post(
            route('referrer-tests.destroy', referrerTest.id),
            { _method: 'delete' },
            {
                onSuccess: () => {
                    closeDeleteForm();
                    pageReload();
                    handleSuccess('Test deleted successfully');
                },
                onError: (errors) => {
                    console.error('Delete failed:', errors);
                    handleError(new Error('Failed to delete test'));
                },
            }
        );
    }, [referrerTest.id, closeDeleteForm, pageReload, handleSuccess, handleError]);

    const handleOpenAddNewForm = useCallback(() => {
        resetReferrerTest();
        setOpenAddForm(true);
    }, [resetReferrerTest]);

    const handleOpenCopyForm = useCallback(() => {
        setOpenCopyForm(true);
    }, []);

    const handleAddFormClose = useCallback((shouldReload = true) => {
        setOpenAddForm(false);
        resetReferrerTest();
        if (shouldReload) {
            pageReload();
            handleSuccess('Test updated successfully');
        }
    }, [resetReferrerTest, pageReload, handleSuccess]);

    const handleCopyFormClose = useCallback((shouldReload = true) => {
        setOpenCopyForm(false);
        if (shouldReload) {
            pageReload();
            handleSuccess('Tests copied successfully');
        }
    }, [pageReload, handleSuccess]);

    // Enhanced action buttons with better UX
    const actionButtons = useMemo(() => [
        <Button
            key="copy"
            startIcon={<ContentCopy />}
            onClick={handleOpenCopyForm}
            disabled={loading}
            variant="outlined"
            sx={{ mr: 1 }}
        >
            Copy From Other Referrer
        </Button>,
        <Button
            key="add"
            startIcon={<Add />}
            onClick={handleOpenAddNewForm}
            disabled={loading}
            variant="contained"
            sx={{ mr: 1 }}
        >
            Add New Test
        </Button>,
        <Button
            key="download"
            startIcon={<Download />}
            href={route("referrer.export-tests", referrer)}
            target="_blank"
            disabled={loading}
            variant="outlined"
        >
            Export List
        </Button>,
    ], [loading, handleOpenCopyForm, handleOpenAddNewForm, referrer]);

    return (
        <>
            <PageHeader
                title={`Tests for ${referrer?.name || 'Referrer'}`}
                actions={actionButtons}
            />

            {/* Loading overlay */}
            {loading && (
                <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                </Box>
            )}

            {/* Empty state */}
            {!loading && referrerTests.data.length === 0 && (
                <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        No tests found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Start by adding a new test or copying from another referrer
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleOpenAddNewForm}
                    >
                        Add First Test
                    </Button>
                </Box>
            )}

            {/* Data table */}
            {referrerTests.data.length > 0 && (
                <TableLayout
                    defaultValues={requestInputs}
                    columns={columns}
                    data={referrerTests}
                    reload={pageReload}
                    Filter={Filter}
                    loading={loading}
                />
            )}

            {/* Forms */}
            <AddPrice
                defaultValue={referrerTest}
                onClose={handleAddFormClose}
                open={openAddForm}
            />

            <CopyForm
                referrer={referrer}
                onClose={handleCopyFormClose}
                open={openCopyForm}
            />

            <DeleteForm
                title={`Delete "${referrerTest?.test?.name}"`}
                message="Are you sure you want to delete this test? This action cannot be undone."
                openDelete={openDeleteForm}
                agreeCB={deleteMethod}
                disAgreeCB={closeDeleteForm}
            />

            {/* Error Snackbar */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    severity="error"
                    onClose={() => setError(null)}
                    variant="filled"
                >
                    {error}
                </Alert>
            </Snackbar>

            {/* Success Snackbar */}
            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage('')}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    severity="success"
                    onClose={() => setSuccessMessage('')}
                    variant="filled"
                >
                    {successMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ReferrerTestsTab;
