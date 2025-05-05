import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout.jsx";
import TableLayout from "@/Layouts/TableLayout.jsx";
import React, {useCallback, useMemo, useState} from "react";
import PrintIcon from "@mui/icons-material/Print";
import AddForm from "@/Pages/Sample/Components/AddForm";
import IconButton from "@mui/material/IconButton";
import {router, useForm, usePage} from "@inertiajs/react";
import PageHeader from '@/Components/PageHeader';
import Filter from './Components/Filter';


const Index = () => {
    // Destructure props with type safety
    const {acceptances, status, success, requestInputs} = usePage().props;

    const [openPrint, setOpenPrint] = useState(false);
    const [loading, setLoading] = useState(false);
    const [barcodes, setBarcodes] = useState({barcodes:[]});

    const print = (id) => () => {
        if (id) {
            setLoading(true);
            axios.get(route("api.sampleCollection.list", id)).then(res => {
                setBarcodes(res.data);
            }).then(() => {
                setLoading(false);
                setOpenPrint(true)
            });
        }
    }
    const handleCloseBarcodes = () => {
        setOpenPrint(false);
      setBarcodes({barcodes:[]});
      pageReload();
    }
    // Page reload handler with explicit parameters
    const pageReload = useCallback((
        page=1,
        filters=[],
        sort={field: 'id', sort: 'desc'},
        pageSize=20
    ) => {
        router.visit(route('sampleCollection'), {
            data: {page, filters, sort, pageSize},
            only: ['acceptances', 'status', 'success', 'requestInputs'],
        });
    }, []);


    // Columns definition with improved type safety
    const columns = useMemo(() => [
        {
            field: 'patient_fullname',
            headerName: 'Name',
            type: "string",
            width: 200,
        },
        {
            field: 'patient_idno',
            headerName: 'ID No./Passport No.',
            type: "string",
            width: 150,
        },
        {
            field: 'status',
            headerName: 'Status',
            type: "string",
            width: 150,
        },

        {
            field: 'created_at',
            headerName: 'Added Date',
            type: "datetime",
            valueGetter: (value) => value && new Date(value),
            width: 170
        },
        {
            field: 'id',
            headerName: 'Action',
            type: 'actions',
            width: 100,
            sortable: false,
            renderCell: (params) => <IconButton onClick={print(params.row.id)}><PrintIcon/></IconButton>,
        }
    ], [print]);


    return (
        <>
            <PageHeader
                title="Sample Collection"
            />
            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                processing={loading}
                data={acceptances}
                reload={pageReload}
                Filter={Filter}
                success={success}
                status={status}
            />
            {openPrint && <AddForm open={openPrint} defaultValue={barcodes} onClose={handleCloseBarcodes}/>}
        </>
    );
};

// Layout wrapper
Index.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            {
                title: 'Sample Collection',
                link: null,
                icon: null
            }
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Index;

