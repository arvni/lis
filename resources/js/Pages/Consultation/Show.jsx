import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DoneForm from '@/Pages/Consultation/Components/DoneForm';
import { Head, router, useForm } from '@inertiajs/react';
import React, { useState } from 'react';
import { useSnackbar } from 'notistack';

import { Button, Grid, Stack } from '@mui/material';
import { MedicalServicesOutlined, ArrowBack, Description } from '@mui/icons-material';
import PageHeader from '@/Components/PageHeader.jsx';

import StatusBadge from './Show/StatusBadge';
import PatientInfoCard from './Show/PatientInfoCard';
import ConsultationDetailsCard from './Show/ConsultationDetailsCard';

const Show = ({ consultant, patient, consultation, _status, canEdit }) => {
    const { data, setData, post, processing, reset } = useForm({
        information: {
            report: '',
            ...consultation.information,
        },
        _method: 'put',
    });
    const { enqueueSnackbar } = useSnackbar();
    const [openDoneForm, setOpenDoneForm] = useState(false);

    const handleOpenDoneForm = () => {
        setOpenDoneForm(true);
    };

    const handleDoneFormChange = (e) =>
        setData((previousData) => ({
            ...previousData,
            information: {
                ...previousData.information,
                [e.target.name]: e.target.value,
            },
        }));

    const handleDoneFormClose = () => {
        reset();
        setOpenDoneForm(false);
    };

    const start = () => {
        post(route('consultations.start', consultation.id));
    };

    const update = () => {
        post(route('consultations.update', consultation.id), {
            onSuccess: () => {
                setOpenDoneForm(false);
                enqueueSnackbar('Successfully Update', { variant: 'success' });
            },
        });
    };

    const handleAddAcceptance = () =>
        router.visit(route('acceptances.create', consultation.patient.id));

    const goBack = () => router.visit(route('consultations.index'));

    return (
        <>
            <Head title={`Consultation #${consultation.id}`} />
            <PageHeader
                title={`Consultation #${consultation.id}`}
                actions={
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack />}
                            onClick={goBack}
                            sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                            }}
                        >
                            Back to List
                        </Button>
                        <StatusBadge status={consultation.status} />
                        {consultation.status === 'done' && (
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<Description />}
                                onClick={handleAddAcceptance}
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    boxShadow: 2,
                                }}
                            >
                                Add Acceptance
                            </Button>
                        )}
                    </Stack>
                }
            />

            <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                    <PatientInfoCard patient={patient} />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <ConsultationDetailsCard
                        consultant={consultant}
                        consultation={consultation}
                        canEdit={canEdit}
                        onStart={start}
                        onComplete={handleOpenDoneForm}
                        onEdit={handleOpenDoneForm}
                    />
                </Grid>
            </Grid>

            <DoneForm
                onChange={handleDoneFormChange}
                data={data.information}
                loading={processing}
                open={openDoneForm}
                onClose={handleDoneFormClose}
                submit={update}
                title={'Consultation Report'}
            />
        </>
    );
};

const breadCrumbs = [
    {
        title: 'Consultations',
        link: route('consultations.index'),
        icon: <MedicalServicesOutlined fontSize="small" />,
    },
];

Show.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={[
            ...breadCrumbs,
            {
                title: 'Consultation #' + page.props.consultation.id,
                link: '',
                icon: null,
            },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Show;
