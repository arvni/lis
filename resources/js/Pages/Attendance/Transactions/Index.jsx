import { useCallback, useMemo, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Alert, AlertTitle, Box, Button, Chip, Tooltip, Typography } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';

import TableLayout from '@/Layouts/TableLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import Filter from './Components/Filter';
import ImportForm from './Components/ImportForm';

const IMPORT = 'Attendance.Transactions.Import Transactions';

// Long files can reject many rows; the first ones are enough to see what is wrong.
const SHOWN_IMPORT_ERRORS = 50;

// Keeps chips vertically centred in the compact grid rows instead of sitting on the text baseline.
const CellContent = ({ children }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>{children}</Box>
);

export const UserCell = ({ user }) => (
    <CellContent>
        {user ? (
            <Typography variant="body2">{user.name}</Typography>
        ) : (
            <Tooltip title="No user has this attendance number. Set it on the person's user page.">
                <Chip size="small" color="warning" variant="outlined" label="Unmatched" />
            </Tooltip>
        )}
    </CellContent>
);

export const SourceCell = ({ punch }) => (
    <CellContent>
        {punch.imported_by ? (
            <Tooltip title={`Imported from Excel by ${punch.imported_by} on ${punch.imported_at}`}>
                <Chip size="small" color="info" variant="outlined" label="Imported" />
            </Tooltip>
        ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                HikCentral
            </Typography>
        )}
    </CellContent>
);

export const ImportErrors = ({ errors, onClose }) => (
    <Alert severity="warning" onClose={onClose} sx={{ mb: 2 }}>
        <AlertTitle>Rows skipped by the last import</AlertTitle>
        {errors.slice(0, SHOWN_IMPORT_ERRORS).map((error) => (
            <Typography key={error} variant="body2">
                {error}
            </Typography>
        ))}
        {errors.length > SHOWN_IMPORT_ERRORS && (
            <Typography variant="body2" sx={{ mt: 1 }}>
                …and {errors.length - SHOWN_IMPORT_ERRORS} more.
            </Typography>
        )}
    </Alert>
);

const TransactionIndex = () => {
    const { transactions, status, errors, success, requestInputs, auth, import_errors } =
        usePage().props;
    const canImport = (auth?.permissions ?? []).includes(IMPORT);

    const [importOpen, setImportOpen] = useState(false);
    const [dismissedErrors, setDismissedErrors] = useState(null);

    const handlePageReload = useCallback((page, filters, sort, pageSize) => {
        router.visit(route('attendance.transactions.index'), {
            data: { page, filters, sort, pageSize },
            only: ['transactions', 'status', 'success', 'requestInputs'],
        });
    }, []);

    const handleOpenImport = useCallback(() => setImportOpen(true), []);
    const handleCloseImport = useCallback(() => setImportOpen(false), []);
    const handleDismissErrors = useCallback(
        () => setDismissedErrors(import_errors),
        [import_errors],
    );

    const columns = useMemo(
        () => [
            {
                field: 'access_date_and_time',
                headerName: 'Punched At',
                type: 'string',
                flex: 0.7,
                renderCell: (params) => (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {params.value}
                    </Typography>
                ),
            },
            {
                field: 'attendance_id',
                headerName: 'Employee ID',
                type: 'string',
                flex: 0.5,
                sortable: false,
                renderCell: (params) => (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {params.value}
                    </Typography>
                ),
            },
            {
                field: 'user',
                headerName: 'User',
                flex: 1,
                minWidth: 140,
                sortable: false,
                renderCell: (params) => <UserCell user={params.value} />,
            },
            {
                field: 'imported_by',
                headerName: 'Source',
                flex: 0.4,
                minWidth: 120,
                sortable: false,
                renderCell: (params) => <SourceCell punch={params.row} />,
            },
        ],
        [],
    );

    const showImportErrors = import_errors?.length > 0 && import_errors !== dismissedErrors;

    return (
        <>
            <Head title="Punches" />
            <PageHeader
                title="Punches"
                subtitle="Door punches written by HikCentral or imported from Excel. First and last punch of a day become check-in and check-out."
                actions={
                    canImport && (
                        <Button
                            startIcon={<UploadFileIcon />}
                            variant="outlined"
                            onClick={handleOpenImport}
                        >
                            Import
                        </Button>
                    )
                }
            />

            {showImportErrors && (
                <ImportErrors errors={import_errors} onClose={handleDismissErrors} />
            )}

            <TableLayout
                defaultValues={requestInputs}
                success={success}
                status={status}
                reload={handlePageReload}
                columns={columns}
                data={transactions}
                Filter={Filter}
                errors={errors}
                autoHeight
                density="compact"
                disableSelectionOnClick
            />

            {canImport && <ImportForm open={importOpen} onClose={handleCloseImport} />}
        </>
    );
};

const breadcrumbs = [
    {
        title: 'Dashboard',
        link: route('dashboard'),
        icon: null,
    },
    {
        title: 'Punches',
        link: null,
        icon: null,
    },
];

TransactionIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default TransactionIndex;
