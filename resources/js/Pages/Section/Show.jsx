import { useMemo, useState, useCallback } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableLayout from '@/Layouts/TableLayout';
import Filter from './Components/ShowFilter';
import EnteringForm from '@/Pages/Section/Components/EnteringForm';
import { ACTION_TYPES, WorkflowActionForm } from '@/Pages/Section/Components/DoneForm';
import { Card, useTheme } from '@mui/material';
import { ACCEPTANCE_ITEM_STATES_STATUS, getNestedParents } from './Show/constants.jsx';
import { buildColumns } from './Show/columns.jsx';
import SectionHeader from './Show/SectionHeader.jsx';
import StatsDashboard from './Show/StatsDashboard.jsx';
import BulkActions from './Show/BulkActions.jsx';

const Show = () => {
    const theme = useTheme();
    const { post, setData, data, reset, processing } = useForm({});
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    const [openEnteringForm, setOpenEnteringForm] = useState(false);
    const [openDoneForm, setOpenDoneForm] = useState(false);

    const { section, acceptanceItemStates, status, errors, success, requestInputs, stats } =
        usePage().props;

    const getSelectionIds = (selection) => {
        if (!selection) return [];
        if (Array.isArray(selection)) return selection;
        if (selection.ids) {
            // In MUI X v7+, selection can be an object with a Set or Array in .ids
            if (typeof selection.ids.forEach === 'function') {
                const ids = [];
                selection.ids.forEach((id) => ids.push(id));
                return ids;
            }
            if (Array.isArray(selection.ids)) return selection.ids;
            if (typeof selection.ids === 'object') return Object.keys(selection.ids);
        }
        return [];
    };

    const isCompatible = useMemo(() => {
        const selection = getSelectionIds(selectedRows);
        if (selection.length <= 1) return true;

        const dataRows = acceptanceItemStates?.data || [];
        const rows = dataRows.filter((row) => selection.includes(row.id));
        if (rows.length === 0) return true;

        const firstRow = rows[0];
        return rows.every(
            (row) =>
                row.acceptance_item?.test?.id === firstRow.acceptance_item?.test?.id &&
                row.acceptance_item?.method?.test?.id ===
                    firstRow.acceptance_item?.method?.test?.id,
        );
    }, [selectedRows, acceptanceItemStates]);

    const handleOpenForm = useCallback(
        (id, type) => () => {
            setLoading(true);
            axios
                .get(route('acceptanceItemStates.show', id))
                .then((res) => setData({ ...res.data.data, actionType: type, _method: 'put' }))
                .then(() => {
                    setLoading(false);
                    setOpenDoneForm(true);
                });
        },
        [setData],
    );

    const handleOpenRejectForm = useCallback(
        (id) => async () => {
            setLoading(true);
            axios
                .get(route('acceptanceItemStates.prevSections', id))
                .then((res) => {
                    setOptions(res.data.sections);
                })
                .then(() => axios.get(route('acceptanceItemStates.show', id)))
                .then((res) =>
                    setData({
                        ...res.data.data,
                        next: null,
                        actionType: ACTION_TYPES.REJECT,
                        _method: 'put',
                    }),
                )
                .then(() => {
                    setOpenDoneForm(true);
                    setLoading(false);
                });
        },
        [setData],
    );

    const columns = useMemo(
        () => buildColumns(theme, handleOpenForm, handleOpenRejectForm),
        [theme, handleOpenForm, handleOpenRejectForm],
    );

    const onSuccess = () => {
        setOpenEnteringForm(false);
        setOpenDoneForm(false);
        setSelectedRows([]);
        reset();
    };

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('sections.show', section.id), {
            data: { page, filters, sort, pageSize },
            only: ['acceptanceItemStates', 'section', 'status', 'success', 'requestInputs'],
            preserveState: true,
            queryStringArrayFormat: 'indices',
        });
    };

    const handleBarcodeChange = (e) => setData({ barcode: e.target.value });

    const handleEntering = () => post(route('sections.enter', section.id), { onSuccess });

    const handleOpenEnteringForm = () => {
        setData({ barcode: '' });
        setOpenEnteringForm(true);
    };

    const handleCloseEnteringForm = () => {
        reset();
        setOpenEnteringForm(false);
    };

    const handleCloseDoneForm = () => {
        reset();
        setOpenDoneForm(false);
    };

    const handleChange = (name, value) => setData((prevData) => ({ ...prevData, [name]: value }));

    const handleSubmit = () => {
        if (data.ids && data.ids.length > 0) {
            post(route('acceptanceItemStates.bulkUpdate'), { onSuccess });
        } else {
            post(route('acceptanceItemStates.update', data.id), { onSuccess });
        }
    };

    const handleOpenBulkForm = (type) => () => {
        const selection = getSelectionIds(selectedRows);
        if (selection.length === 0) return;

        // Find the first selected row to use its parameters as a template
        const firstSelectedRow = acceptanceItemStates.data.find((row) => row.id === selection[0]);
        if (!firstSelectedRow) return;

        setLoading(true);
        axios
            .get(route('acceptanceItemStates.show', firstSelectedRow.id))
            .then((res) =>
                setData({
                    ...res.data.data,
                    ids: selection,
                    actionType: type,
                    _method: 'put',
                }),
            )
            .then(() => {
                setLoading(false);
                setOpenDoneForm(true);
            });
    };

    const handleOpenBulkRejectForm = () => async () => {
        const selection = getSelectionIds(selectedRows);
        if (selection.length === 0) return;

        const firstSelectedRow = acceptanceItemStates.data.find((row) => row.id === selection[0]);
        if (!firstSelectedRow) return;

        setLoading(true);
        axios
            .get(route('acceptanceItemStates.prevSections', firstSelectedRow.id))
            .then((res) => {
                setOptions(res.data.sections);
            })
            .then(() => axios.get(route('acceptanceItemStates.show', firstSelectedRow.id)))
            .then((res) =>
                setData({
                    ...res.data.data,
                    ids: selection,
                    next: null,
                    actionType: ACTION_TYPES.REJECT,
                    _method: 'put',
                }),
            )
            .then(() => {
                setOpenDoneForm(true);
                setLoading(false);
            });
    };

    return (
        <>
            <Head title={section.name} />

            <SectionHeader
                section={section}
                requestInputs={requestInputs}
                onAddSample={handleOpenEnteringForm}
                onRefresh={pageReload}
            />

            <StatsDashboard stats={stats} />

            {/* Main Table */}
            <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableLayout
                    defaultValues={requestInputs}
                    success={success}
                    status={status}
                    reload={pageReload}
                    columns={columns}
                    data={acceptanceItemStates}
                    loading={processing || loading}
                    Filter={Filter}
                    errors={errors}
                    checkboxSelection
                    onRowSelectionModelChange={(newSelection) =>
                        setSelectedRows(newSelection || [])
                    }
                    isRowSelectable={(params) =>
                        params.row.status === ACCEPTANCE_ITEM_STATES_STATUS.PROCESSING
                    }
                    headerActions={
                        <BulkActions
                            selectionCount={getSelectionIds(selectedRows).length}
                            isCompatible={isCompatible}
                            onBulkDone={handleOpenBulkForm(ACTION_TYPES.COMPLETE)}
                            onBulkReject={handleOpenBulkRejectForm()}
                        />
                    }
                />
            </Card>

            {/* Modals */}
            <EnteringForm
                onChange={handleBarcodeChange}
                open={openEnteringForm && !processing}
                submit={handleEntering}
                barcode={data.barcode}
                onClose={handleCloseEnteringForm}
            />

            <WorkflowActionForm
                actionType={data.actionType}
                onClose={handleCloseDoneForm}
                open={openDoneForm && !processing && !loading}
                acceptanceItemState={data}
                onChange={handleChange}
                onSubmit={handleSubmit}
                options={options}
            />
        </>
    );
};

Show.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            ...getNestedParents(page.props.section.section_group),
            {
                title: page.props.section.name,
                link: null,
                icon: null,
            },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Show;
