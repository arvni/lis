import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Alert, Badge, Box, Tab, Tabs } from '@mui/material';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Header from './Components/Header';
import CaseTab from './Components/CaseTab';
import TestsTab from './Components/TestsTab';
import RequestsTab from './Components/RequestsTab';
import ThreadTab from './Components/ThreadTab';
import OrdersTab from './Components/OrdersTab';
import HistoryTab from './Components/HistoryTab';
import DocumentsTab from './Components/DocumentsTab';
import FinanceTab from './Components/FinanceTab';

const OPEN_REQUEST = ['open', 'answered', 'awaiting_finance', 'order_created'];

const Show = () => {
    const { preOrder, canQuote, canStartTesting, canReview, errors, status, success } =
        usePage().props;
    const [tab, setTab] = useState('tests');
    const openRequests = preOrder.requests.filter((r) => OPEN_REQUEST.includes(r.status)).length;
    const openQuotations = preOrder.quotations.filter((q) => q.status === 'awaiting_center').length;

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
            <Header preOrder={preOrder} onFinance={() => setTab('finance')} />
            <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ mb: 2 }}>
                <Tab value="case" label="Case" />
                <Tab value="tests" label="Tests" />
                <Tab
                    value="requests"
                    label={
                        <Badge
                            color="warning"
                            badgeContent={openRequests}
                            sx={{ pr: openRequests ? 1.5 : 0 }}
                        >
                            Requests
                        </Badge>
                    }
                />
                <Tab
                    value="finance"
                    label={
                        <Badge
                            color="warning"
                            badgeContent={openQuotations}
                            sx={{ pr: openQuotations ? 1.5 : 0 }}
                        >
                            Finance
                        </Badge>
                    }
                />
                <Tab value="documents" label={`Files (${preOrder.documents.length})`} />
                <Tab value="messages" label="Messages" />
                <Tab value="notes" label="Internal notes" />
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
                <Tab value="history" label="History" />
            </Tabs>
            <Box>
                {tab === 'case' && <CaseTab preOrder={preOrder} />}
                {tab === 'tests' && <TestsTab preOrder={preOrder} />}
                {tab === 'requests' && <RequestsTab preOrder={preOrder} />}
                {tab === 'finance' && <FinanceTab preOrder={preOrder} canQuote={canQuote} />}
                {tab === 'documents' && <DocumentsTab preOrder={preOrder} canReview={canReview} />}
                {tab === 'messages' && <ThreadTab preOrder={preOrder} />}
                {tab === 'notes' && <ThreadTab preOrder={preOrder} internal />}
                {tab === 'orders' && (
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
