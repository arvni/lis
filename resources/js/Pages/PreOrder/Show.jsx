import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    Alert,
    Badge,
    Box,
    Stack,
    Tab,
    Tabs,
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Header from './Components/Header';
import NextStep from './Components/NextStep';
import CaseTab from './Components/CaseTab';
import TestsTab from './Components/TestsTab';
import RequestsTab from './Components/RequestsTab';
import ThreadTab from './Components/ThreadTab';
import OrdersTab from './Components/OrdersTab';
import HistoryTab from './Components/HistoryTab';
import DocumentsTab from './Components/DocumentsTab';
import FinanceTab from './Components/FinanceTab';

const OPEN_REQUEST = ['open', 'answered', 'awaiting_finance', 'order_created'];
const SAMPLE_STAGES = [
    'AWAITING_PRE_SAMPLES',
    'PRE_RECEIVED',
    'PRE_IN_PROGRESS',
    'PRE_COMPLETED',
    'AWAITING_SAMPLES',
    'BATCH_OPEN',
    'READY_FOR_TESTING',
    'TESTING',
    'TESTING_COMPLETED',
    'RESULTS_RELEASED',
];

/** The tab that matches where the case is, so the page opens on the work at hand. */
const startTab = (preOrder) => {
    if (preOrder.exception?.type === 'finance_rejected') return 'finance';
    if (preOrder.exception?.type === 'sample_issue') return 'orders';
    if (['AWAITING_FINANCE', 'FINANCE_VERIFY'].includes(preOrder.stage.code)) return 'finance';
    if (preOrder.stage.code === 'AWAITING_INFO') return 'requests';
    if (SAMPLE_STAGES.includes(preOrder.stage.code)) return 'orders';
    return 'tests';
};

const Count = ({ n, color = 'warning', children }) => (
    <Badge color={color} badgeContent={n} sx={{ pr: n ? 1.5 : 0 }}>
        {children}
    </Badge>
);

const Show = () => {
    const { preOrder, canQuote, canStartTesting, canReview, errors, status, success } =
        usePage().props;
    const [tab, setTab] = useState(() => startTab(preOrder));
    const [thread, setThread] = useState('messages');
    const openRequests = preOrder.requests.filter((r) => OPEN_REQUEST.includes(r.status)).length;
    const openQuotations = preOrder.quotations.filter((q) => q.status === 'awaiting_center').length;
    const released =
        SAMPLE_STAGES.includes(preOrder.stage.code) || preOrder.orders_to_place?.length > 0;

    return (
        <>
            <Head title={preOrder.code} />
            {errors?.action && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.action}
                </Alert>
            )}
            {success && status && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}
            <Header preOrder={preOrder} />
            <NextStep preOrder={preOrder} onTab={setTab} />
            <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
                <Tab value="tests" label="Case & tests" />
                <Tab value="requests" label={<Count n={openRequests}>Requests</Count>} />
                <Tab value="finance" label={<Count n={openQuotations}>Finance</Count>} />
                <Tab value="documents" label={`Files (${preOrder.documents.length})`} />
                <Tab value="thread" label="Messages & notes" />
                {released && (
                    <Tab
                        value="orders"
                        label={
                            <Badge
                                color="error"
                                variant="dot"
                                invisible={preOrder.exception?.type !== 'sample_issue'}
                            >
                                Samples &amp; orders
                            </Badge>
                        }
                    />
                )}
                <Tab value="history" label="Activity" />
            </Tabs>
            <Box>
                {tab === 'tests' && (
                    <Stack spacing={2}>
                        <TestsTab preOrder={preOrder} />
                        <CaseTab preOrder={preOrder} />
                    </Stack>
                )}
                {tab === 'requests' && <RequestsTab preOrder={preOrder} />}
                {tab === 'finance' && <FinanceTab preOrder={preOrder} canQuote={canQuote} />}
                {tab === 'documents' && <DocumentsTab preOrder={preOrder} canReview={canReview} />}
                {tab === 'thread' && (
                    <Stack spacing={1.5}>
                        <ToggleButtonGroup
                            exclusive
                            size="small"
                            value={thread}
                            onChange={(_, v) => v && setThread(v)}
                        >
                            <ToggleButton value="messages">With the center</ToggleButton>
                            <ToggleButton value="notes">Internal notes (BION only)</ToggleButton>
                        </ToggleButtonGroup>
                        <ThreadTab key={thread} preOrder={preOrder} internal={thread === 'notes'} />
                    </Stack>
                )}
                {tab === 'orders' && released && (
                    <OrdersTab preOrder={preOrder} canStartTesting={canStartTesting} />
                )}
                {tab === 'history' && <HistoryTab preOrder={preOrder} />}
            </Box>
        </>
    );
};

Show.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            { title: 'Pre-orders', link: route('pre-orders.index'), icon: null },
            { title: page.props.preOrder.code, link: null, icon: null },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Show;
