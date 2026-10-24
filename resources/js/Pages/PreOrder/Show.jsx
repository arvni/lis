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

const Show = () => {
    const { preOrder, errors, status, success } = usePage().props;
    const [tab, setTab] = useState('tests');
    const openRequests = preOrder.requests.filter((r) =>
        ['open', 'answered'].includes(r.status),
    ).length;

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
                <Tab value="messages" label="Messages" />
                <Tab value="notes" label="Internal notes" />
                <Tab value="orders" label="Orders" />
                <Tab value="history" label="History" />
            </Tabs>
            <Box>
                {tab === 'case' && <CaseTab preOrder={preOrder} />}
                {tab === 'tests' && <TestsTab preOrder={preOrder} />}
                {tab === 'requests' && <RequestsTab preOrder={preOrder} />}
                {tab === 'messages' && <ThreadTab preOrder={preOrder} />}
                {tab === 'notes' && <ThreadTab preOrder={preOrder} internal />}
                {tab === 'orders' && <OrdersTab preOrder={preOrder} />}
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
