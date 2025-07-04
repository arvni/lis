import React, {useState, useCallback, useMemo, useEffect} from 'react';
import axios from 'axios';
import {router} from '@inertiajs/react';
import {GridActionsCellItem} from '@mui/x-data-grid';
import {Delete, Edit} from '@mui/icons-material';

import TableLayout from '@/Layouts/TableLayout';
import Filter from './Filter';
import AddPrice from '@/Pages/Referrer/Components/AddPrice';
import DeleteForm from '@/Components/DeleteForm';
import PageHeader from "@/Components/PageHeader.jsx";
import Button from "@mui/material/Button";


const ReferrerTestsTab = ({referrer}) => {

    useEffect(() => {
        pageReload();
    }, [referrer]);

    // State management with improved typing
    const [referrerTests, setReferrerTests] = useState({
        data: [],
        total: 0,
        current_page: 1,
    });

    const [loading, setLoading] = useState(false);
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
        methods:[],
        referrer: {id: referrer.id},
    });

    const [openDeleteForm, setOpenDeleteForm] = useState(false);
    const [openAddForm, setOpenAddForm] = useState(false);

    // Memoized column definition to prevent unnecessary re-renders
    const columns = useMemo(() => [
        {
            field: 'test',
            headerName: 'Test',
            type: 'string',
            width: 200,
            sortable: false,
            renderCell: ({row}) => row?.test?.name,
        },
        {
            field: 'price',
            headerName: 'Price',
            type: 'number',
            width: 100,
            renderCell: ({row}) => row?.test.type === 'PANEL' ? row?.price : "-",
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            width: 100,
            sortable: false,
            getActions: (params) => [
                <GridActionsCellItem
                    key="edit"
                    icon={<Edit/>}
                    label="Edit"
                    onClick={editReferrerTest(params.row.id)}
                />,
                <GridActionsCellItem
                    key="delete"
                    icon={<Delete/>}
                    label="Delete"
                    onClick={deleteReferrerTest(params.row.id)}
                />,
            ],
        },
    ], []);

    // Memoized page reload function to prevent unnecessary re-renders
    const pageReload = useCallback(
        (
            page = requestInputs.page,
            filters = requestInputs.filters,
            sort = requestInputs.sort,
            pageSize = requestInputs.pageSize
        ) => {
            setLoading(true);
            axios
                .get(
                    route('referrer-tests.index', {
                        referrer: {id: referrer.id},
                        page,
                        filters,
                        sort,
                        pageSize,
                    })
                )
                .then((res) => {
                    setReferrerTests(res.data.referrerTests);
                    setRequestInputs(res.data.requestInputs);
                })
                .catch((error) => {
                    console.error('Error fetching referrer methods:', error);
                    // Optional: Add user-friendly error handling
                })
                .finally(() => setLoading(false));
        },
        [referrer.id]
    );

    // Edit handler with error handling
    const editReferrerTest = useCallback((id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        setLoading(true);
        axios
            .get(route('referrer-tests.show', id))
            .then((res) => {
                setReferrerTest({...res?.data?.data, referrer:{id:referrer.id}, _method: 'put'});
                setOpenAddForm(true);
            })
            .catch((error) => {
                console.error('Error fetching referrer method:', error);
                // Optional: Add user-friendly error handling
            })
            .finally(() => setLoading(false));
    }, []);

    // Delete handler
    const deleteReferrerTest = useCallback((id) => () => {
        const methodToDelete = referrerTests.data.find((item) => item.id === id);
        if (methodToDelete) {
            setReferrerTest({...methodToDelete, _method: 'delete'});
            setOpenDeleteForm(true);
        }
    }, [referrerTests.data]);

    // Close delete form and reset method
    const closeDeleteForm = useCallback(() => {
        setOpenDeleteForm(false);
        setReferrerTest({
            test: null,
            methods: [],
            price: 0,
            referrer: {id: referrer.id},
        });
    }, [referrer.id]);

    // Delete method with error handling
    const deleteMethod = useCallback(() => {
        router.post(
            route('referrer-tests.destroy', referrerTest.id),
            {_method: 'delete'},
            {
                onSuccess: () => {
                    closeDeleteForm();
                    pageReload();
                },
                onError: (errors) => {
                    console.error('Delete method failed:', errors);
                    // Optional: Add user-friendly error handling
                },
            }
        );
    }, [referrerTest.id, closeDeleteForm, pageReload]);

    // Open add new form
    const handleOpenAddNewForm = useCallback(() => {
        setOpenAddForm(true);
    }, [referrer.id]);

    // Close add form and reload page
    const handleAddFormClose = useCallback(() => {
        setOpenAddForm(false);
        setReferrerTest({
            test:null,
            methods: [],
            price: 0,
            referrer: {id: referrer.id},
        });
        pageReload();
    }, [referrer.id, pageReload]);

    return (
        <>
            <PageHeader actions={[
                <Button onClick={handleOpenAddNewForm}>Add New</Button>,
                <Button href={route("referrer.export-tests",referrer)} target="_blank">Download List</Button>
            ]}/>
            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={referrerTests}
                reload={pageReload}
                Filter={Filter}
                loading={loading}
            />
            <AddPrice
                defaultValue={referrerTest}
                onClose={handleAddFormClose}
                open={openAddForm}
            />
            <DeleteForm
                title={referrerTest?.test?.name}
                openDelete={openDeleteForm}
                agreeCB={deleteMethod}
                disAgreeCB={closeDeleteForm}
            />
        </>
    );
};

export default ReferrerTestsTab;
