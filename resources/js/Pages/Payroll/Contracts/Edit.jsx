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
import { rowsFrom, toPayload } from './Components/rowState';

const Edit = () => {
    const { contract, employmentTypes, shifts, shiftId, leaveKinds, status, success } =
        usePage().props;

    const [person, setPerson] = useState(
        contract.user?.id ? { id: contract.user.id, name: contract.user.name } : null,
    );
    const [entitlements, setEntitlements] = useState(() =>
        rowsFrom(contract.entitlements, (row) => ({
            leave_kind_id: row.leave_kind_id,
            entitled_days: row.entitled_days,
        })),
    );
    const { data, setData, put, processing, errors } = useForm({
        user_id: contract.user?.id ?? '',
        position: contract.position ?? '',
        employment_type: contract.employment_type,
        base_salary: contract.base_salary ?? '',
        overtime_multiplier: contract.overtime_multiplier ?? '1.25',
        // Seeded from the person's current assignment, since the contract doesn't store the shift.
        shift_id: shiftId ?? '',
        start_date: contract.start_date ?? '',
        end_date: contract.end_date ?? '',
        probation_end_date: contract.probation_end_date ?? '',
        reference: contract.reference ?? '',
        notes: contract.notes ?? '',
        entitlements: (contract.entitlements ?? []).map((row) => ({
            leave_kind_id: row.leave_kind_id,
            entitled_days: row.entitled_days,
        })),
    });

    const syncEntitlements = (rows) => {
        setEntitlements(rows);
        setData('entitlements', rows.map(toPayload));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('payroll.contracts.update', contract.id));
    };

    return (
        <>
            <Head title="Edit Contract" />
            <PageHeader
                title="Edit Contract"
                subtitle={contract.user?.name}
            />

            {/* Moving the dates onto a neighbouring contract is refused, naming the one it clashed with. */}
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
                            onPerson={setPerson}
                            employmentTypes={employmentTypes}
                            shifts={shifts}
                            lockPerson
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
                        Save Contract
                    </Button>
                </Box>
            </Box>
        </>
    );
};

const breadcrumbs = [
    { title: 'Dashboard', link: route('dashboard'), icon: null },
    { title: 'Contracts', link: route('payroll.contracts.index'), icon: null },
    { title: 'Edit Contract', link: null, icon: null },
];

Edit.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Edit;
