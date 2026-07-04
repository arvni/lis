import {
    alpha,
    Avatar,
    Box,
    IconButton,
    Link,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import Button from '@mui/material/Button';
import { Assignment, VisibilityOutlined } from '@mui/icons-material';
import { formatDate, getStatusChip } from './helpers.jsx';

const RecentConsultationsCard = ({ consultant, recentConsultations }) => {
    const theme = useTheme();
    return (
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box
                sx={{
                    px: 2.5,
                    py: 1.75,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment fontSize="small" color="primary" />
                    <Typography variant="subtitle1" fontWeight="600">
                        Recent Consultations
                    </Typography>
                </Box>
                <Button
                    size="small"
                    variant="outlined"
                    component="a"
                    href={route('consultations.index', { consultant_id: consultant.id })}
                >
                    View All
                </Button>
            </Box>

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                            <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {recentConsultations?.length > 0 ? (
                            recentConsultations.map((c, idx) => (
                                <TableRow
                                    key={c.id}
                                    hover
                                    sx={{
                                        bgcolor:
                                            idx % 2 !== 0
                                                ? alpha(theme.palette.grey[500], 0.03)
                                                : 'transparent',
                                    }}
                                >
                                    <TableCell>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1.5,
                                            }}
                                        >
                                            <Avatar
                                                src={c.patient?.avatar}
                                                sx={{
                                                    width: 34,
                                                    height: 34,
                                                    fontSize: '0.875rem',
                                                }}
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
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
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
                                                <VisibilityOutlined fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4}>
                                    <Box
                                        sx={{
                                            py: 5,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 1.5,
                                        }}
                                    >
                                        <Assignment sx={{ fontSize: 42, color: 'text.disabled' }} />
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
    );
};

export default RecentConsultationsCard;
