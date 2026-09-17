import { useState } from 'react';
import { Head, router, usePage, useForm } from '@inertiajs/react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    CircularProgress,
} from '@mui/material';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader';
import ContractFields from './Components/ContractFields';
import EntitlementsEditor from './Components/EntitlementsEditor';
import { toPayload } from './Components/rowState';

const Add = () => {
    const { employmentTypes, shifts, leaveKinds, status, success } = usePage().props;

    const [person, setPerson] = useState(null);
    const [entitlements, setEntitlements] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        position: '',
        employment_type: 'FULL_TIME',
        base_salary: '',
        overtime_multiplier: '1.25',
        shift_id: '',
        start_date: '',
        end_date: '',
        probation_end_date: '',
        reference: '',
        notes: '',
        entitlements: [],
    });

    const handlePerson = (picked) => {
        setPerson(picked);
        setData('user_id', picked?.id ?? '');
    };

    const syncEntitlements = (rows) => {
        setEntitlements(rows);
        setData('entitlements', rows.map(toPayload));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('payroll.contracts.store'));
    };

    return (
        <>
            <Head title="New Contract" />
            <PageHeader title="New Contract" />

            {/* Overlapping periods are refused by the service, which says which contract clashed. */}
            {success === false && status && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {status}
                </Alert>
            )}

            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            >
                <Card>
                    <CardHeader title="Terms" />
                    <CardContent>
                        <ContractFields
                            data={data}
                            setData={setData}
                            errors={errors}
                            person={person}
                            onPerson={handlePerson}
                            employmentTypes={employmentTypes}
                            shifts={shifts}
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader
                        title="Leave allowance"
                        subheader="How many days of each kind this contract grants, for its whole duration"
                    />
                    <CardContent>
                        <EntitlementsEditor
                            rows={entitlements}
                            onChange={syncEntitlements}
                            errors={errors}
                            leaveKinds={leaveKinds}
                        />
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button onClick={() => router.visit(route('payroll.contracts.index'))}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        disabled={processing}
                        startIcon={processing && <CircularProgress size={16} />}
                    >
                        Create Contract
                    </Button>
                </Box>
            </Box>
        </>
    );
};

const breadcrumbs = [
    { title: 'Dashboard', link: route('dashboard'), icon: null },
    { title: 'Contracts', link: route('payroll.contracts.index'), icon: null },
    { title: 'New Contract', link: null, icon: null },
];

Add.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Add;
