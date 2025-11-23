import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { GridActionsCellItem } from "@mui/x-data-grid";
import Filter from "./Components/Filter";
import TableLayout from "@/Layouts/TableLayout";
import { useState, useEffect } from "react";
import { RemoveRedEye, Assignment } from "@mui/icons-material";
import { router, useForm, usePage } from "@inertiajs/react";
import { Tooltip, Chip } from "@mui/material";

const Index = () => {
    const { referrerOrders, status, success, requestInputs } = usePage().props;
    console.log(referrerOrders);
    const [processing, setProcessing] = useState(false);
    const [filter, setFilter] = useState(requestInputs?.filters || {});

    // Status indicator colors for better visual feedback
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'cancelled':
                return 'error';
            default:
                return 'default';
        }
    };

    const columns = [
        {
            field: 'id',
            headerName: 'ID',
            type: "number",
            width: 70,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'referrer.name',
            headerName: 'Referrer',
            type: "string",
            width: 200,
            flex: 1,
            renderCell: ({ row }) => (
                row?.referrer?.fullName ? (
                    <Tooltip title={`Email: ${row?.referrer?.email || 'N/A'}`}>
                        <span>{row?.referrer?.fullName}</span>
                    </Tooltip>
                ) : 'N/A'
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            type: "string",
            width: 140,
            renderCell: ({ row }) => (
                <Chip
                    label={row.status || 'Unknown'}
                    color={getStatusColor(row.status)}
                    size="small"
                    variant="outlined"
                />
            )
        },
        {
            field: 'patient.fullName',
            headerName: 'Patient',
            type: "string",
            width: 200,
            flex: 1,
            renderCell: ({ row }) => (
                row?.patient?.fullName ? (
                    <Tooltip title={`Patient ID: ${row?.patient?.id || 'N/A'}`}>
                        <span>{row?.patient?.fullName}</span>
                    </Tooltip>
                ) : 'N/A'
            )
        },
        {
            field: 'created_at',
            headerName: 'Created',
            type: "date",
            width: 130,
            valueFormatter: (value ) => {
                if (!value) return 'N/A';
                return new Date(value).toLocaleDateString();
            }
        },
        {
            field: 'action',
            headerName: 'Action',
            type: 'actions',
            width: 120,
            sortable: false,
            getActions: (params) => [
                <GridActionsCellItem
                    icon={<RemoveRedEye />}
                    label="View Details"
                    onClick={handleViewOrder(params.row.id)}
                    showInMenu={false}
                />,
                <GridActionsCellItem
                    icon={<Assignment />}
                    label="View Report"
                    onClick={handleViewReport(params.row.id)}
                    showInMenu={true}
                />
            ]
        }
    ];

    const handleViewOrder = (id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        setProcessing(true);
        router.visit(route('referrer-orders.show', id), {
            onFinish: () => setProcessing(false)
        });
    };

    const handleViewReport = (id) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Add report viewing functionality here
        console.log(`View report for order ${id}`);
    };

    const pageReload = (page, filters, sort, pageSize) => {
        setProcessing(true);
        setFilter(filters);

        router.visit(route("referrer-orders.index"), {
            data: { page, filters, sort, pageSize },
            only: ["referrerOrders", "status", "success", "requestInputs"],
            preserveState: true,
            onFinish: () => setProcessing(false),
            onError: () => setProcessing(false)
        });
    };

    // Reset processing state on unmount or if there's an error
    useEffect(() => {
        return () => setProcessing(false);
    }, []);

    useEffect(() => {
        // Update filter state when requestInputs change
        if (requestInputs?.filters) {
            setFilter(requestInputs.filters);
        }
    }, [requestInputs]);

    return (
        <div className="referrer-orders-container">
            <TableLayout
                defaultValues={requestInputs}
                columns={columns}
                data={referrerOrders}
                reload={pageReload}
                Filter={Filter}
                loading={processing}
                success={success}
                status={status}
                title="Referrer Orders"
                filterState={filter}
                onFilterChange={setFilter}
                rowsPerPageOptions={[10, 25, 50, 100]}
                disableSelectionOnClick
                disableDensitySelector
            />
        </div>
    );
};

const breadCrumbs = [
    {
        title: "Referrers",
        link: route("referrers.index"),
        icon: null
    },
    {
        title: "Referrer Orders",
        link: null,
        icon: null
    }
];

Index.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default Index;
