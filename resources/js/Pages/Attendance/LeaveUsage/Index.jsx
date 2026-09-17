import { useCallback } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import {
    Box,
    Button,
    Chip,
    IconButton,
    Link,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageHeader from '@/Components/PageHeader.jsx';
import SelectSearch from '@/Components/SelectSearch';
import { formatMinutes } from '@/Pages/Attendance/Days/attendanceFormat';
import {
    LEAVE_STATUS_COLORS,
    formatLeavePeriod,
} from '@/Pages/Attendance/LeaveRequests/leaveFormat';

/** "3 days · 2 h 30 m": working days of full-day leave and hours of hourly leave; "—" for none. */
export const formatLeaveAmount = (days, minutes) => {
    const parts = [];
    if (days) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    if (minutes) parts.push(formatMinutes(minutes));

    return parts.length ? parts.join(' · ') : '—';
};

const AMOUNTS = [
    { key: 'taken', label: 'Taken so far', help: 'Approved leave up to today' },
    { key: 'booked', label: 'Booked', help: 'Approved leave after today' },
    { key: 'pending', label: 'Waiting for approval', help: 'Requests not decided yet' },
];

const amountOf = (line, key) => formatLeaveAmount(line[`${key}_days`], line[`${key}_minutes`]);

const Section = ({ title, children }) => (
    <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            {title}
        </Typography>
        {children}
    </Paper>
);

const Empty = ({ year }) => (
    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        No approved or pending leave in {year}.
    </Typography>
);

const PersonUsage = ({ usage, year }) => (
    <>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {AMOUNTS.map(({ key, label, help }) => (
                <Grid key={key} size={{ xs: 12, sm: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', height: '100%' }}
                    >
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {label}
                        </Typography>
                        <Typography variant="h6" data-testid={`total-${key}`}>
                            {amountOf(usage.total, key)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {help}
                        </Typography>
                    </Paper>
                </Grid>
            ))}
        </Grid>

        <Section title="By kind">
            {usage.kinds.length === 0 ? (
                <Empty year={year} />
            ) : (
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Kind</TableCell>
                                {AMOUNTS.map(({ key, label }) => (
                                    <TableCell key={key}>{label}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {usage.kinds.map((line) => (
                                <TableRow key={line.kind}>
                                    <TableCell sx={{ fontWeight: 500 }}>{line.kind}</TableCell>
                                    {AMOUNTS.map(({ key }) => (
                                        <TableCell key={key}>{amountOf(line, key)}</TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}
        </Section>

        <Section title={`Requests in ${year}`}>
            {usage.requests.length === 0 ? (
                <Empty year={year} />
            ) : (
                <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>When</TableCell>
                                <TableCell>Kind</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Uses</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {usage.requests.map((leave) => (
                                <TableRow key={leave.id}>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                        {formatLeavePeriod(leave)}
                                    </TableCell>
                                    <TableCell>{leave.kind}</TableCell>
                                    <TableCell>
                                        <Chip
                                            size="small"
                                            color={LEAVE_STATUS_COLORS[leave.status] ?? 'default'}
                                            label={leave.status_label}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {formatLeaveAmount(leave.days, leave.minutes)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}
        </Section>
    </>
);

const StaffUsage = ({ rows, year, onOpen }) => (
    <Section title={`All staff in ${year}`}>
        {rows.length === 0 ? (
            <Empty year={year} />
        ) : (
            <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Person</TableCell>
                            {AMOUNTS.map(({ key, label }) => (
                                <TableCell key={key}>{label}</TableCell>
                            ))}
                            <TableCell>Taken by kind</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.user.id}>
                                <TableCell>
                                    <Link
                                        component="button"
                                        variant="body2"
                                        onClick={() => onOpen(row.user.id)}
                                    >
                                        {row.user.name}
                                    </Link>
                                </TableCell>
                                {AMOUNTS.map(({ key }) => (
                                    <TableCell key={key}>{amountOf(row, key)}</TableCell>
                                ))}
                                <TableCell>
                                    {row.kinds
                                        .filter((line) => line.taken_days || line.taken_minutes)
                                        .map((line) => `${line.kind} ${amountOf(line, 'taken')}`)
                                        .join(' · ') || '—'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        )}
    </Section>
);

const LeaveUsageIndex = () => {
    const { view, year, person, usage, staff, canViewOthers } = usePage().props;
    const isStaff = view === 'staff';
    const currentYear = new Date().getFullYear();
    // What stays the same when only the year changes.
    const scope = isStaff ? { view: 'staff' } : { user_id: person?.id };

    const visit = useCallback(
        (data) =>
            router.visit(route('attendance.leave-usage.index'), { data, preserveScroll: true }),
        [],
    );

    return (
        <>
            <Head title="Leave Usage" />
            <PageHeader
                title="Leave Usage"
                subtitle={
                    isStaff
                        ? `Everyone with leave in ${year}`
                        : `${person.name} · working days of full-day leave and hours of hourly leave`
                }
                actions={
                    <Button
                        startIcon={<BeachAccessIcon />}
                        variant="outlined"
                        component="a"
                        href={route('attendance.leave-requests.index')}
                    >
                        Leave requests
                    </Button>
                }
            />

            {canViewOthers && (
                <Tabs
                    value={view}
                    onChange={(_, value) =>
                        visit(value === 'staff' ? { view: 'staff', year } : { year })
                    }
                    sx={{ mb: 2 }}
                >
                    <Tab value="person" label="Person" />
                    <Tab value="staff" label="All staff" />
                </Tabs>
            )}

            <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                <Grid container spacing={2} alignItems="center">
                    {canViewOthers && !isStaff && (
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SelectSearch
                                name="person"
                                label="Person"
                                size="small"
                                fullWidth
                                value={person}
                                url={route('api.attendance.leave-people.list')}
                                onChange={(e) =>
                                    e.target.value && visit({ user_id: e.target.value.id, year })
                                }
                            />
                        </Grid>
                    )}
                    <Grid size={{ xs: 12, md: canViewOthers && !isStaff ? 8 : 12 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: { xs: 'space-between', md: 'flex-end' },
                                gap: 1,
                            }}
                        >
                            <IconButton
                                aria-label="Previous year"
                                onClick={() => visit({ ...scope, year: year - 1 })}
                            >
                                <ChevronLeftIcon />
                            </IconButton>
                            <Typography variant="h6" sx={{ minWidth: 80, textAlign: 'center' }}>
                                {year}
                            </Typography>
                            <IconButton
                                aria-label="Next year"
                                onClick={() => visit({ ...scope, year: year + 1 })}
                            >
                                <ChevronRightIcon />
                            </IconButton>
                            <Button
                                variant="outlined"
                                size="small"
                                disabled={year === currentYear}
                                onClick={() => visit(scope)}
                            >
                                This year
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {isStaff ? (
                <StaffUsage
                    rows={staff}
                    year={year}
                    onOpen={(userId) => visit({ user_id: userId, year })}
                />
            ) : (
                <PersonUsage usage={usage} year={year} />
            )}
        </>
    );
};

const breadcrumbs = [
    {
        title: 'Dashboard',
        link: route('dashboard'),
        icon: null,
    },
    {
        title: 'Leave Usage',
        link: null,
        icon: null,
    },
];

LeaveUsageIndex.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} breadcrumbs={breadcrumbs}>
        {page}
    </AuthenticatedLayout>
);

export default LeaveUsageIndex;
