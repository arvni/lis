import React, {useState} from 'react';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router} from "@inertiajs/react";

// Material UI components
import {
    Paper,
    Box,
    Grid2 as Grid,
    Typography,
    Avatar,
    Chip,
    Card,
    CardContent,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Link, useTheme
} from "@mui/material";

// Material UI icons
import {
    MedicalServicesOutlined,
    Person,
    Phone,
    Email,
    AccessTime,
    EventNote,
    Assignment,
} from "@mui/icons-material";

import TimeCalendar from "@/Pages/Consultation/Components/TimeCalendar.jsx";
import Button from "@mui/material/Button";
import AddForm from "./Components/AddForm.jsx";

const today = new Date().toISOString().split("T")[0];
const Show = ({consultant, times, recentConsultations}) => {

    const theme = useTheme();

    const [openAdd, setOpenAdd] = useState(false);
    const [selectedDate, setSelectedDate] = useState(today)

    const pageReload = (start, end) => {
        let startDate = new Date(start).toISOString().split("T")[0];
        let endDate = new Date(end).toISOString().split("T")[0];
        router.visit(route('consultants.show', consultant.id), {
            data: {
                startDate,
                endDate,
            },
            preserveState: true,
            onFinish: () => setSelectedDate(null),
        });
    };

    const handleAddNew = () => setOpenAdd(true);
    const handleCloseAddNew = () => {
        setOpenAdd(false);
        setSelectedDate(today);
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Get status chip based on status value
    const getStatusChip = (status) => {
        switch (status) {
            case 'pending':
                return <Chip size="small" label="Pending" color="warning"/>;
            case 'completed':
                return <Chip size="small" label="Completed" color="success"/>;
            case 'canceled':
                return <Chip size="small" label="Canceled" color="error"/>;
            default:
                return <Chip size="small" label={status} color="default"/>;
        }
    };

    const handleSelectDate = (v) => {
        let value = ""
        if (v)
            value = v.toISOString().split("T")[0];
        setSelectedDate(value);
    }

    const handleDelete=(time)=>{

    }

    return (
        <Box sx={{position: 'relative'}}>

            <Grid container spacing={3}>
                {/* Consultant Info Card */}
                <Grid size={{xs: 12}}>
                    <Paper
                        elevation={2}
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            mb: 3
                        }}
                    >
                        <Box sx={{
                            p: 3,
                            bgcolor: 'primary.main',
                            color: 'primary.contrastText',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: "space-between"
                        }}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                <Avatar
                                    src={consultant.avatar}
                                    alt={consultant.name}
                                    sx={{width: 72, height: 72, mr: 2, border: '3px solid white'}}
                                >
                                    {!consultant.avatar && consultant.name.charAt(0)}
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" component="h2" fontWeight="bold">
                                        {consultant.name}
                                    </Typography>
                                    {consultant.title && <Typography variant="body1">
                                        {consultant.title}
                                    </Typography>}
                                    <Box sx={{mt: 1}}>
                                        {consultant.speciality && <Chip
                                            size="small"
                                            label={consultant.speciality}
                                            sx={{
                                                mr: 1,
                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                color: 'white'
                                            }}
                                        />}
                                        <Chip
                                            size="small"
                                            label={consultant.active ? "Active" : "Inactive"}
                                            color={consultant.active ? "success" : "default"}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleAddNew}
                                startIcon={<AccessTime/>}
                            >
                                Reserve a Time
                            </Button>
                        </Box>

                        <Box sx={{p: 3}}>
                            <Typography variant="subtitle1" component="h3" fontWeight="bold" gutterBottom>
                                Contact Information
                            </Typography>
                            {consultant.user && (
                                <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                    <Email fontSize="small" sx={{mr: 1, color: 'text.secondary'}}/>
                                    <Typography variant="body2">
                                        {consultant.user.email}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                <Phone fontSize="small" sx={{mr: 1, color: 'text.secondary'}}/>
                                <Typography variant="body2">
                                    {consultant.phone || 'No phone number provided'}
                                </Typography>
                            </Box>

                            <Divider sx={{my: 2}}/>

                            <Typography variant="subtitle1"
                                        component="h3"
                                        fontWeight="bold"
                                        gutterBottom>
                                Statistics
                            </Typography>

                            <Grid container spacing={2} sx={{mt: 1}}>
                                <Grid size={{xs: 4}}>
                                    <Card variant="outlined" sx={{bgcolor: theme.palette.primary.main}}>
                                        <CardContent sx={{p: 2, '&:last-child': {pb: 2}}}>
                                            <Typography color={theme.palette.success.contrastText}>
                                                Total Consultations
                                            </Typography>
                                            <Typography variant="h5" component="div" fontWeight="bold">
                                                {consultant.consultations_count || 0}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{xs: 4}}>
                                    <Card variant="outlined" sx={{bgcolor: theme.palette.success.main}}>
                                        <CardContent sx={{p: 2, '&:last-child': {pb: 2}}}>
                                            <Typography color={theme.palette.success.contrastText}>
                                                Upcoming Times
                                            </Typography>
                                            <Typography variant="h5" component="div" fontWeight="bold">
                                                {consultant.upcoming_times_count || 0}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid size={{xs: 4}}>
                                    <Card variant="outlined" sx={{bgcolor: theme.palette.secondary.main}}>
                                        <CardContent sx={{p: 2, '&:last-child': {pb: 2}}}>
                                            <Typography color={theme.palette.secondary.contrastText}>
                                                Upcoming Consultations
                                            </Typography>
                                            <Typography variant="h5" component="div" fontWeight="bold">
                                                {consultant.upcoming_consultations_count || 0}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>

                {/* Calendar Component */}
                <Grid size={{xs: 12}}>
                    <Paper
                        elevation={2}
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden',
                            mb: 3
                        }}
                    >
                        <Box sx={{
                            p: 2,
                            bgcolor: 'grey.100',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                <EventNote fontSize="small" sx={{mr: 1}}/>
                                <Typography variant="subtitle1" component="h3" fontWeight="medium">
                                    Appointment Schedule
                                </Typography>
                            </Box>
                        </Box>

                        <TimeCalendar timeSlots={times}
                                      onMonthChange={pageReload}
                                      canViewPatient
                                      canDeleteConsultantReserve
                                      onDateSelect={handleSelectDate}
                                      canViewConsultation
                                      onTimeSlotDelete={handleDelete}
                                      />
                    </Paper>

                    {/* Recent Consultations */}
                    <Paper
                        elevation={2}
                        sx={{
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}
                    >
                        <Box sx={{
                            p: 2,
                            bgcolor: 'grey.100',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                <Assignment fontSize="small" sx={{mr: 1}}/>
                                <Typography variant="subtitle1" component="h3" fontWeight="medium">
                                    Recent Consultations
                                </Typography>
                            </Box>
                            <Button
                                size="small"
                                component="a"
                                href={route('consultations.index', {consultant_id: consultant.id})}
                            >
                                View All
                            </Button>
                        </Box>

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Patient</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentConsultations && recentConsultations.length > 0 ? (
                                        recentConsultations.map((consultation) => (
                                            <TableRow key={consultation.id}>
                                                <TableCell>
                                                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                        <Avatar
                                                            src={consultation.patient?.avatar}
                                                            sx={{width: 32, height: 32, mr: 1}}
                                                        >
                                                            {consultation.patient?.fullName?.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" component="div">
                                                                <Link
                                                                    href={route('patients.show', consultation.patient_id)}
                                                                    underline="hover"
                                                                    color="inherit"
                                                                >
                                                                    {consultation.patient_fullname || 'Unknown Patient'}
                                                                </Link>
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {consultation.patient_phone || 'No phone'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {formatDate(consultation.dueDate)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{getStatusChip(consultation.status)}</TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        component="a"
                                                        href={route('consultations.show', consultation.id)}
                                                    >
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center">No recent consultations
                                                found</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>
            </Grid>

            {openAdd && <AddForm open={openAdd}
                                 onClose={handleCloseAddNew}
                                 defaultDate={selectedDate}
                                 consultantId={consultant.id}/>}
        </Box>
    );
};

const breadCrumbs = [
    {
        title: "Consultants",
        link: route('consultants.index'),
        icon: <Person fontSize="small"/>
    },
    {
        title: "Consultant Details",
        link: null,
        icon: <MedicalServicesOutlined fontSize="small"/>
    }
];

Show.layout = page => (
    <AuthenticatedLayout
        auth={page.props.auth}
        children={page}
        breadcrumbs={breadCrumbs}
    />
);

export default Show;
