import React, {useState} from 'react';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import {router} from "@inertiajs/react";
import {
    Paper, Box, Grid, Typography, Avatar, Chip, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Link, useTheme, Stack, IconButton, Tooltip, alpha,
} from "@mui/material";
import Button from "@mui/material/Button";
import {
    MedicalServicesOutlined, Person, Phone, Email, AccessTime,
    EventNote, Assignment, VisibilityOutlined, CalendarMonth,
} from "@mui/icons-material";
import TimeCalendar from "@/Pages/Consultation/Components/TimeCalendar.jsx";
import AddForm from "./Components/AddForm.jsx";

const today = new Date().toISOString().split("T")[0];

const Show = ({consultant, times, recentConsultations}) => {
    const theme = useTheme();
    const [openAdd, setOpenAdd] = useState(false);
    const [selectedDate, setSelectedDate] = useState(today);

    const pageReload = (start, end) => {
        router.visit(route('consultants.show', consultant.id), {
            data: {
                startDate: new Date(start).toISOString().split("T")[0],
                endDate:   new Date(end).toISOString().split("T")[0],
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        }).format(new Date(dateString));
    };

    const getStatusChip = (status) => {
        const map = {
            pending:   {label: 'Pending',   color: 'warning'},
            completed: {label: 'Completed', color: 'success'},
            canceled:  {label: 'Canceled',  color: 'error'},
        };
        const cfg = map[status] ?? {label: status, color: 'default'};
        return <Chip size="small" label={cfg.label} color={cfg.color}/>;
    };

    const handleSelectDate = (v) => setSelectedDate(v ? v.toISOString().split("T")[0] : "");
    const handleDelete = () => {};

    const stats = [
        {
            label: 'Total Consultations',
            value: consultant.consultations_count || 0,
            color: theme.palette.primary.main,
            icon: <Assignment/>,
        },
        {
            label: 'Upcoming Times',
            value: consultant.upcoming_times_count || 0,
            color: theme.palette.success.main,
            icon: <AccessTime/>,
        },
        {
            label: 'Upcoming Consultations',
            value: consultant.upcoming_consultations_count || 0,
            color: theme.palette.secondary.main,
            icon: <CalendarMonth/>,
        },
    ];

    return (
        <Box>
            <Grid container spacing={3}>
                {/* ── Sidebar ───────────────────────────────── */}
                <Grid size={{xs: 12, md: 4, lg: 3}}>

                    {/* Profile card */}
                    <Paper elevation={2} sx={{borderRadius: 3, overflow: 'hidden', mb: 3}}>
                        {/* Gradient banner */}
                        <Box sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 60%, ${theme.palette.primary.light} 100%)`,
                            height: 80,
                        }}/>

                        {/* Avatar overlapping banner */}
                        <Box sx={{display: 'flex', justifyContent: 'center', mt: -5.5, mb: 1.5}}>
                            <Avatar
                                src={consultant.avatar}
                                alt={consultant.name}
                                sx={{
                                    width: 90, height: 90,
                                    border: `4px solid ${theme.palette.background.paper}`,
                                    boxShadow: theme.shadows[4],
                                    bgcolor: theme.palette.primary.main,
                                    fontSize: '2rem',
                                }}
                            >
                                {!consultant.avatar && consultant.name.charAt(0)}
                            </Avatar>
                        </Box>

                        <Box sx={{px: 3, pb: 3, textAlign: 'center'}}>
                            <Typography variant="h6" fontWeight="bold">
                                {consultant.name}
                            </Typography>
                            {consultant.title && (
                                <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
                                    {consultant.title}
                                </Typography>
                            )}
                            <Stack direction="row" spacing={1} sx={{justifyContent: 'center', mt: 1, mb: 2.5}}>
                                {consultant.speciality && (
                                    <Chip size="small" label={consultant.speciality} color="primary" variant="outlined"/>
                                )}
                                <Chip
                                    size="small"
                                    label={consultant.active ? "Active" : "Inactive"}
                                    color={consultant.active ? "success" : "default"}
                                />
                            </Stack>

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleAddNew}
                                startIcon={<AccessTime/>}
                            >
                                Reserve a Time
                            </Button>

                            <Divider sx={{my: 2.5}}/>

                            <Typography
                                variant="overline"
                                color="text.secondary"
                                display="block"
                                sx={{textAlign: 'left', mb: 1.5}}
                            >
                                Contact
                            </Typography>

                            <Stack spacing={1.5}>
                                {consultant.user && (
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                        <Box sx={{
                                            width: 34, height: 34, borderRadius: 1.5, flexShrink: 0,
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Email fontSize="small" color="primary"/>
                                        </Box>
                                        <Typography
                                            variant="body2"
                                            sx={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
                                        >
                                            {consultant.user.email}
                                        </Typography>
                                    </Box>
                                )}
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                    <Box sx={{
                                        width: 34, height: 34, borderRadius: 1.5, flexShrink: 0,
                                        bgcolor: alpha(theme.palette.success.main, 0.1),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Phone fontSize="small" color="success"/>
                                    </Box>
                                    <Typography variant="body2">
                                        {consultant.phone || 'No phone number'}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Paper>

                    {/* Stats card */}
                    <Paper elevation={2} sx={{borderRadius: 3, p: 2.5}}>
                        <Typography variant="overline" color="text.secondary" display="block" sx={{mb: 2}}>
                            Statistics
                        </Typography>
                        <Stack spacing={1.5}>
                            {stats.map((stat, i) => (
                                <Box key={i} sx={{
                                    display: 'flex', alignItems: 'center', gap: 2,
                                    p: 1.5, borderRadius: 2,
                                    bgcolor: alpha(stat.color, 0.06),
                                }}>
                                    <Box sx={{
                                        width: 42, height: 42, borderRadius: 1.5, flexShrink: 0,
                                        bgcolor: alpha(stat.color, 0.15),
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: stat.color,
                                    }}>
                                        {stat.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {stat.label}
                                        </Typography>
                                        <Typography variant="h6" fontWeight="bold" color={stat.color}>
                                            {stat.value}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>

                {/* ── Main content ──────────────────────────── */}
                <Grid size={{xs: 12, md: 8, lg: 9}}>

                    {/* Calendar */}
                    <Paper elevation={2} sx={{borderRadius: 3, overflow: 'hidden', mb: 3}}>
                        <Box sx={{
                            px: 2.5, py: 1.75,
                            display: 'flex', alignItems: 'center',
                            borderBottom: `1px solid ${theme.palette.divider}`,
                        }}>
                            <EventNote fontSize="small" color="primary" sx={{mr: 1}}/>
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
                    <Paper elevation={2} sx={{borderRadius: 3, overflow: 'hidden'}}>
                        <Box sx={{
                            px: 2.5, py: 1.75,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: `1px solid ${theme.palette.divider}`,
                        }}>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                <Assignment fontSize="small" color="primary"/>
                                <Typography variant="subtitle1" fontWeight="600">
                                    Recent Consultations
                                </Typography>
                            </Box>
                            <Button
                                size="small"
                                variant="outlined"
                                component="a"
                                href={route('consultations.index', {consultant_id: consultant.id})}
                            >
                                View All
                            </Button>
                        </Box>

                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{bgcolor: alpha(theme.palette.primary.main, 0.04)}}>
                                        <TableCell sx={{fontWeight: 600}}>Patient</TableCell>
                                        <TableCell sx={{fontWeight: 600}}>Date</TableCell>
                                        <TableCell sx={{fontWeight: 600}}>Status</TableCell>
                                        <TableCell align="right" sx={{fontWeight: 600}}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recentConsultations?.length > 0 ? (
                                        recentConsultations.map((c, idx) => (
                                            <TableRow
                                                key={c.id}
                                                hover
                                                sx={{
                                                    bgcolor: idx % 2 !== 0
                                                        ? alpha(theme.palette.grey[500], 0.03)
                                                        : 'transparent',
                                                }}
                                            >
                                                <TableCell>
                                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                                        <Avatar
                                                            src={c.patient?.avatar}
                                                            sx={{width: 34, height: 34, fontSize: '0.875rem'}}
                                                        >
                                                            {c.patient?.fullName?.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2" fontWeight="500">
                                                                <Link
                                                                    href={route('patients.show', c.patient_id)}
                                                                    underline="hover"
                                                                    color="inherit"
                                                                >
                                                                    {c.patient_fullname || 'Unknown Patient'}
                                                                </Link>
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {c.patient_phone || 'No phone'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatDate(c.dueDate)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{getStatusChip(c.status)}</TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="View consultation">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            component="a"
                                                            href={route('consultations.show', c.id)}
                                                        >
                                                            <VisibilityOutlined fontSize="small"/>
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4}>
                                                <Box sx={{
                                                    py: 5,
                                                    display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', gap: 1.5,
                                                }}>
                                                    <Assignment sx={{fontSize: 42, color: 'text.disabled'}}/>
                                                    <Typography variant="body2" color="text.secondary">
                                                        No recent consultations found
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
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
    {title: "Consultants", link: route('consultants.index'), icon: <Person fontSize="small"/>},
    {title: "Consultant Details", link: null, icon: <MedicalServicesOutlined fontSize="small"/>},
];

Show.layout = page => (
    <AuthenticatedLayout auth={page.props.auth} children={page} breadcrumbs={breadCrumbs}/>
);

export default Show;
