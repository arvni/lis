import React, { useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { RemoveRedEye, Edit as EditIcon } from '@mui/icons-material';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Filter from './Components/Filter';

// Constants for breadcrumbs
const BREADCRUMBS = [
    {
        title: "Reports",
        link: null,
        icon: null
    }
];

// Utility function to format test name
const formatTestName = (acceptanceItem) => {
    const { test, name } = acceptanceItem.method.test;
    const methodName = acceptanceItem.method.name;
    return `${test.name} >> ${methodName}`;
};

const Approving = () => {
    // Destructure page props
    const {
        reports,
        status,
        errors,
        success,
        requestInputs,
        canEdit
    } = usePage().props;

    // Memoized columns to prevent unnecessary re-renders
    const columns = useMemo(() => [
        {
            field: 'patient',
            headerName: 'Patient',
            flex: 1,
            sortable: false,
            renderCell: ({ row }) => row.acceptance_item.patient.fullName
        },
        {
            field: 'test',
            headerName: 'Test',
            flex: 1,
            sortable: false,
            renderCell: ({ row }) => formatTestName(row.acceptance_item)
        },
        {
            field: 'reporter',
            headerName: 'Reporter',
            flex: 0.7,
            sortable: false,
            renderCell: ({ row }) => row.reporter.name
        },
        {
            field: 'reportedAt',
            headerName: 'Reported At',
            type: 'date',
            flex: 0.7,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            type: 'actions',
            sortable: false,
            flex: 0.2,
            getActions: (params) => {
                const actions = [
                    <GridActionsCellItem
                        key={`show-${params.row.id}`}
                        icon={<RemoveRedEye />}
                        label="Show"
                        onClick={() => handleShowReport(params.row.id)}
                    />
                ];

                // Conditionally add edit action based on permissions
                if (canEdit) {
                    actions.push(
                        <GridActionsCellItem
                            key={`edit-${params.row.id}`}
                            icon={<EditIcon />}
                            label="Edit"
                            onClick={() => handleEditReport(params.row.id)}
                        />
                    );
                }

                return actions;
            }
        }
    ], [canEdit]);

    // Handler functions with improved readability
    const handleEditReport = (id) => {
        router.visit(route("reports.edit", id));
    };

    const handleShowReport = (id) => {
        router.visit(route("reports.show", id));
    };

    // Page reload handler with clear parameter naming
    const handlePageReload = (page, filters, sort, pageSize) => {
        router.visit(route('reports.approving'), {
            data: { page, filters, sort, pageSize },
            only: ["reports", "status", "success", "requestInputs"],
            preserveState: true
        });
    };

    return (
        <>
            <Head title="Reports List" />
            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={reports}
                Filter={Filter}
                errors={errors}
            />
        </>
    );
};

// Layout wrapper
Approving.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={BREADCRUMBS}
    >
        {page}
    </AuthenticatedLayout>
);

export default Approving;
