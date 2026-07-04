import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { Paper, Box, Grid, Typography, useTheme } from '@mui/material';
import { MedicalServicesOutlined, Person, EventNote } from '@mui/icons-material';
import TimeCalendar from '@/Pages/Consultation/Components/TimeCalendar.jsx';
import AddForm from './Components/AddForm.jsx';
import ProfileCard from './Show/ProfileCard.jsx';
import StatsCard from './Show/StatsCard.jsx';
import RecentConsultationsCard from './Show/RecentConsultationsCard.jsx';

const today = new Date().toISOString().split('T')[0];

const Show = ({ consultant, times, recentConsultations }) => {
    const theme = useTheme();
    const [openAdd, setOpenAdd] = useState(false);
    const [selectedDate, setSelectedDate] = useState(today);

    const pageReload = (start, end) => {
        router.visit(route('consultants.show', consultant.id), {
            data: {
                startDate: new Date(start).toISOString().split('T')[0],
                endDate: new Date(end).toISOString().split('T')[0],
            },
            preserveState: true,
            onFinish: () => setSelectedDate(null),
        });
    };

    const handleAddNew = () => setOpenAdd(true);
    const handleCloseAddNew = () => {
        setOpenAdd(false);
        setSelectedDate(today);
    };

    const handleSelectDate = (v) => setSelectedDate(v ? v.toISOString().split('T')[0] : '');
    const handleDelete = () => {};

    return (
        <Box>
            <Head title={consultant?.name ? `Consultant: ${consultant.name}` : 'Consultant'} />
            <Grid container spacing={3}>
                {/* ── Sidebar ───────────────────────────────── */}
                <Grid size={{ xs: 12, md: 4, lg: 3 }}>
                    <ProfileCard consultant={consultant} onAddNew={handleAddNew} />
                    <StatsCard consultant={consultant} />
                </Grid>

                {/* ── Main content ──────────────────────────── */}
                <Grid size={{ xs: 12, md: 8, lg: 9 }}>
                    {/* Calendar */}
                    <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
                        <Box
                            sx={{
                                px: 2.5,
                                py: 1.75,
                                display: 'flex',
                                alignItems: 'center',
                                borderBottom: `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            <EventNote fontSize="small" color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle1" fontWeight="600">
                                Appointment Schedule
                            </Typography>
                        </Box>
                        <TimeCalendar
                            timeSlots={times}
                            onMonthChange={pageReload}
                            canViewPatient
                            canDeleteConsultantReserve
                            onDateSelect={handleSelectDate}
                            canViewConsultation
                            onTimeSlotDelete={handleDelete}
                        />
                    </Paper>

                    {/* Recent Consultations */}
                    <RecentConsultationsCard
                        consultant={consultant}
                        recentConsultations={recentConsultations}
                    />
                </Grid>
            </Grid>

            {openAdd && (
                <AddForm
                    open={openAdd}
                    onClose={handleCloseAddNew}
                    defaultDate={selectedDate}
                    consultantId={consultant.id}
                />
            )}
        </Box>
    );
};

const breadCrumbs = [
    { title: 'Consultants', link: route('consultants.index'), icon: <Person fontSize="small" /> },
    { title: 'Consultant Details', link: null, icon: <MedicalServicesOutlined fontSize="small" /> },
];

Show.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadCrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default Show;
