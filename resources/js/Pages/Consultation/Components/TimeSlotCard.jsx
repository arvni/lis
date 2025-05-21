import React, {useState, useMemo} from 'react';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Chip,
    IconButton,
    Link,
    Typography,
    Avatar,
    Divider,
    Tooltip,
    Stack,
    useTheme,
    useMediaQuery
} from "@mui/material";
import {
    Event as EventIcon,
    MedicalServices,
    Person,
    Phone,
    Email,
    Badge,
    AccessTime,
    CheckCircle,
    Schedule,
    Cancel,
    EditOutlined,
    DeleteOutline,
    VisibilityOutlined,
    PersonOutline,
    SwapHoriz,
    LocationOn
} from "@mui/icons-material";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

/**
 * Formats time from date string to HH:MM AM/PM format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time
 */
const formatTime = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    return `${hours}:${minutes} ${ampm}`;
};

/**
 * Gets duration between two time strings
 * @param {string} startTime - ISO date string for start time
 * @param {string} endTime - ISO date string for end time
 * @returns {string} Formatted duration
 */
const getDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
};

/**
 * Gets configuration for status display
 * @param {string} status - Status string
 * @returns {Object} Status configuration with color and icon
 */
const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
        case 'done':
            return {color: 'success', icon: <CheckCircle fontSize="small"/>};
        case 'pending':
            return {color: 'warning', icon: <Schedule fontSize="small"/>};
        case 'cancelled':
            return {color: 'error', icon: <Cancel fontSize="small"/>};
        default:
            return {color: 'default', icon: <AccessTime fontSize="small"/>};
    }
};

/**
 * Time Slot Card Component
 *
 * @param {Object} props - Component props
 * @param {Object} props.timeSlot - Time slot data
 * @param {Function} props.onClick - Click handler for the card
 * @param {boolean} props.canCheckConsultation - Whether user can view consultation
 * @param {boolean} props.canCheckPatient - Whether user can view patient
 * @param {boolean} props.canConversion - Whether user can convert customer to patient
 * @param {boolean} props.canDelete - Whether user can delete time slot
 * @param {boolean} props.canEdit - Whether user can edit time slot
 * @param {boolean} props.canDeleteConsultantReserve - Whether user can delete consultant reserve
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onEdit - Edit handler
 * @returns {JSX.Element} The TimeSlotCard component
 */
const TimeSlotCard = ({
                          timeSlot,
                          onClick,
                          canCheckConsultation = false,
                          canCheckPatient = false,
                          canConversion = false,
                          canDelete = false,
                          canEdit = false,
                          canDeleteConsultantReserve = false,
                          onDelete,
                          onEdit
                      }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isDark = theme.palette.mode === 'dark';
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Theme-aware color helpers
    const getThemedColor = useMemo(() => (lightColor, darkColor) =>
        isDark ? darkColor : lightColor, [isDark]);

    const getThemedBgColor = useMemo(() => (lightColor, darkColor) =>
        isDark ? darkColor : lightColor, [isDark]);

    // Get duration between start and end time
    const duration = useMemo(() =>
            getDuration(timeSlot.started_at, timeSlot.ended_at),
        [timeSlot.started_at, timeSlot.ended_at]
    );

    // Get status configuration
    const statusConfig = useMemo(() =>
            timeSlot.reservable?.status
                ? getStatusConfig(timeSlot.reservable.status)
                : null,
        [timeSlot.reservable?.status]
    );

    // Handlers
    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await onDelete(timeSlot);
            setDeleteDialogOpen(false);
        } catch (error) {
            console.error('Error deleting time slot:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
    };

    const handleConversion = () => canConversion && onClick(timeSlot);

    const handleCardClick = () => {
        if (onClick && !canEdit && !canDelete) {
            onClick(timeSlot);
        }
    };

    // Contextual helpers for delete dialog
    const getDeleteDescription = () => {
        if (timeSlot.reservable_type === 'consultation') {
            return "This will also cancel the associated medical consultation and may affect the patient's treatment schedule.";
        } else if (timeSlot.reservable_type === 'customer') {
            return "This will cancel the customer appointment. The customer will need to be notified separately.";
        }
        return "This will remove the time slot from the schedule.";
    };

    const getItemName = () => {
        if (timeSlot.title) {
            return timeSlot.title;
        }

        if (timeSlot.reservable_type === 'consultation' && timeSlot.reservable?.patient) {
            return `Consultation with ${timeSlot.reservable.patient.fullName}`;
        } else if (timeSlot.reservable_type === 'customer' && timeSlot.reservable) {
            return `Appointment with ${timeSlot.reservable.name}`;
        }

        return `Time slot at ${formatTime(timeSlot.started_at)}`;
    };

    // Determine if we should show action buttons
    const showActions = canEdit || canDelete || canConversion ||
        canCheckConsultation || canCheckPatient ||
        canDeleteConsultantReserve;

    return (
        <>
            <Card
                variant="outlined"
                sx={{
                    borderColor: timeSlot.active
                        ? 'success.main'
                        : getThemedColor('divider', 'grey.700'),
                    borderWidth: timeSlot.active ? 2 : 1,
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    backgroundColor: getThemedBgColor('background.paper', 'grey.900'),
                    '&:hover': {
                        boxShadow: isDark ? 6 : 3,
                        transform: 'translateY(-2px)',
                        borderColor: timeSlot.active
                            ? 'success.main'
                            : getThemedColor('primary.light', 'primary.dark'),
                    },
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: (onClick && !canEdit && !canDelete) ? 'pointer' : 'default'
                }}
                onClick={handleCardClick}
            >
                <CardContent sx={{flexGrow: 1, p: {xs: 2, sm: 3}}}>
                    {/* Header with Title and Status */}
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={2}
                        sx={{mb: 2}}
                    >
                        <Typography
                            variant="h6"
                            fontWeight="600"
                            sx={{
                                color: getThemedColor('text.primary', 'grey.100'),
                                flex: 1,
                                wordBreak: 'break-word'
                            }}
                        >
                            {timeSlot.title || getItemName()}
                        </Typography>
                        <Chip
                            size="small"
                            label={timeSlot.active ? "Active" : "Inactive"}
                            color={timeSlot.active ? "success" : "default"}
                            variant={timeSlot.active ? "filled" : "outlined"}
                            sx={{
                                fontWeight: 500,
                                minWidth: 70,
                                color: timeSlot.active
                                    ? undefined
                                    : getThemedColor('text.secondary', 'grey.400')
                            }}
                        />
                    </Stack>

                    {/* Time Information */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1.5,
                            backgroundColor: getThemedBgColor('grey.50', 'grey.800'),
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: getThemedColor('grey.200', 'grey.600'),
                            mb: 2
                        }}
                    >
                        <EventIcon
                            fontSize="small"
                            sx={{color: getThemedColor('primary.main', 'primary.light')}}
                        />
                        <Box sx={{flex: 1}}>
                            <Typography
                                variant="body1"
                                fontWeight="500"
                                sx={{color: getThemedColor('text.primary', 'grey.100')}}
                            >
                                {formatTime(timeSlot.started_at)} - {formatTime(timeSlot.ended_at)}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{color: getThemedColor('text.secondary', 'grey.400')}}
                            >
                                Duration: {duration}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Consultant Information */}
                    {timeSlot.consultant && (
                        <>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    color: getThemedColor('text.secondary', 'grey.400'),
                                    mb: 1
                                }}
                            >
                                Consultant
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                mb: 2,
                                p: 1.5,
                                borderRadius: 1.5,
                                backgroundColor: getThemedBgColor('background.paper', 'grey.800'),
                                border: '1px solid',
                                borderColor: getThemedColor('grey.200', 'grey.600')
                            }}>
                                <Avatar
                                    src={timeSlot.consultant.avatar}
                                    alt={timeSlot.consultant.name}
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        border: '2px solid',
                                        borderColor: getThemedColor('primary.light', 'primary.dark'),
                                        backgroundColor: getThemedBgColor('primary.light', 'primary.dark')
                                    }}
                                >
                                    {timeSlot.consultant.name?.charAt(0) || 'C'}
                                </Avatar>
                                <Box sx={{flex: 1}}>
                                    <Typography
                                        variant="body1"
                                        fontWeight="600"
                                        sx={{color: getThemedColor('text.primary', 'grey.100')}}
                                    >
                                        {timeSlot.consultant.name}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{color: getThemedColor('text.secondary', 'grey.400')}}
                                    >
                                        {timeSlot.consultant.title || 'Consultant'}
                                    </Typography>
                                </Box>
                            </Box>
                        </>
                    )}

                    {/* Reservation Information */}
                    {timeSlot.reservable_type && (
                        <>
                            <Divider sx={{
                                my: 2,
                                borderColor: getThemedColor('grey.200', 'grey.700')
                            }}/>

                            {/* Customer Reservation */}
                            {timeSlot.reservable_type === 'customer' && timeSlot.reservable && (
                                <Box sx={{
                                    p: 2,
                                    backgroundColor: getThemedBgColor('blue.50', 'blue.900'),
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: getThemedColor('blue.200', 'blue.700')
                                }}>
                                    <Stack spacing={2}>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                            <Person sx={{
                                                color: getThemedColor('blue.600', 'blue.300')
                                            }}/>
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight="600"
                                                sx={{color: getThemedColor('blue.800', 'blue.100')}}
                                            >
                                                Customer Appointment
                                            </Typography>
                                        </Box>

                                        <Stack spacing={1}>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                <PersonOutline
                                                    fontSize="small"
                                                    sx={{color: getThemedColor('text.secondary', 'grey.400')}}
                                                />
                                                <Typography
                                                    variant="body2"
                                                    sx={{color: getThemedColor('text.primary', 'grey.100')}}
                                                >
                                                    <strong>Name:</strong> {timeSlot.reservable.name}
                                                </Typography>
                                            </Box>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                <Phone
                                                    fontSize="small"
                                                    sx={{color: getThemedColor('text.secondary', 'grey.400')}}
                                                />
                                                <Typography
                                                    component="a"
                                                    href={`tel:${timeSlot.reservable.phone}`}
                                                    variant="body2"
                                                    sx={{
                                                        color: getThemedColor('text.primary', 'grey.100'),
                                                        textDecoration: 'none',
                                                        '&:hover': {
                                                            textDecoration: 'underline',
                                                            color: 'primary.main'
                                                        }
                                                    }}
                                                >
                                                    <strong>Phone:</strong> {timeSlot.reservable.phone}
                                                </Typography>
                                            </Box>
                                            {timeSlot.reservable.email && (
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                    <Email
                                                        fontSize="small"
                                                        sx={{color: getThemedColor('text.secondary', 'grey.400')}}
                                                    />
                                                    <Typography
                                                        component="a"
                                                        href={`mailto:${timeSlot.reservable.email}`}
                                                        variant="body2"
                                                        sx={{
                                                            color: getThemedColor('text.primary', 'grey.100'),
                                                            textDecoration: 'none',
                                                            '&:hover': {
                                                                textDecoration: 'underline',
                                                                color: 'primary.main'
                                                            }
                                                        }}
                                                    >
                                                        <strong>Email:</strong> {timeSlot.reservable.email}
                                                    </Typography>
                                                </Box>
                                            )}
                                            {timeSlot.reservable.location && (
                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                    <LocationOn
                                                        fontSize="small"
                                                        sx={{color: getThemedColor('text.secondary', 'grey.400')}}
                                                    />
                                                    <Typography
                                                        variant="body2"
                                                        sx={{color: getThemedColor('text.primary', 'grey.100')}}
                                                    >
                                                        <strong>Location:</strong> {timeSlot.reservable.location}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Stack>
                                </Box>
                            )}

                            {/* Consultation Reservation */}
                            {timeSlot.reservable_type === 'consultation' && timeSlot.reservable && (
                                <Box sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: '2px solid',
                                    borderColor: getThemedColor('primary.main', 'primary.light'),
                                    backgroundColor: getThemedBgColor('primary.50', 'primary.900')
                                }}>
                                    <Stack spacing={2}>
                                        {/* Header */}
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                        >
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                <MedicalServices sx={{
                                                    color: getThemedColor('primary.main', 'primary.light')
                                                }}/>
                                                <Typography
                                                    variant="subtitle1"
                                                    fontWeight="600"
                                                    sx={{color: getThemedColor('primary.dark', 'primary.light')}}
                                                >
                                                    Medical Consultation
                                                </Typography>
                                            </Box>

                                            {statusConfig && (
                                                <Chip
                                                    size="small"
                                                    icon={statusConfig.icon}
                                                    label={timeSlot.reservable.status}
                                                    color={statusConfig.color}
                                                    variant="filled"
                                                    sx={{fontWeight: 500}}
                                                />
                                            )}
                                        </Stack>

                                        {/* Patient Information */}
                                        {timeSlot.reservable.patient && (
                                            <Box sx={{
                                                p: 1.5,
                                                backgroundColor: getThemedBgColor('white', 'grey.800'),
                                                borderRadius: 1.5,
                                                border: '1px solid',
                                                borderColor: getThemedColor('primary.light', 'primary.dark')
                                            }}>
                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        color: getThemedColor('text.secondary', 'grey.400'),
                                                        mb: 1
                                                    }}
                                                >
                                                    Patient Details
                                                </Typography>

                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5}}>
                                                    <Avatar
                                                        src={timeSlot.reservable.patient.avatar}
                                                        alt={timeSlot.reservable.patient.fullName}
                                                        sx={{
                                                            width: 48,
                                                            height: 48,
                                                            border: '2px solid',
                                                            borderColor: getThemedColor('primary.main', 'primary.light'),
                                                            backgroundColor: getThemedBgColor('primary.light', 'primary.dark')
                                                        }}
                                                    >
                                                        {timeSlot.reservable.patient.fullName?.charAt(0) || 'P'}
                                                    </Avatar>
                                                    <Box sx={{flex: 1}}>
                                                        <Typography
                                                            variant="body1"
                                                            fontWeight="600"
                                                            sx={{color: getThemedColor('text.primary', 'grey.100')}}
                                                        >
                                                            {timeSlot.reservable.patient.fullName}
                                                        </Typography>
                                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                                                            <Phone
                                                                fontSize="small"
                                                                sx={{color: getThemedColor('text.secondary', 'grey.400')}}
                                                            />
                                                            <Typography
                                                                component="a"
                                                                href={`tel:${timeSlot.reservable.patient.phone}`}
                                                                variant="body2"
                                                                sx={{
                                                                    color: getThemedColor('text.secondary', 'grey.400'),
                                                                    textDecoration: 'none',
                                                                    '&:hover': {
                                                                        textDecoration: 'underline',
                                                                        color: 'primary.main'
                                                                    }
                                                                }}
                                                            >
                                                                {timeSlot.reservable.patient.phone}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>

                                                {timeSlot?.reservable?.patient?.idNo && (
                                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                        <Badge
                                                            fontSize="small"
                                                            sx={{color: getThemedColor('text.secondary', 'grey.400')}}
                                                        />
                                                        <Typography
                                                            variant="body2"
                                                            sx={{color: getThemedColor('text.primary', 'grey.100')}}
                                                        >
                                                            <strong>ID:</strong> {timeSlot.reservable.patient.idNo}
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {timeSlot?.reservable?.notes && (
                                                    <Box
                                                        sx={{
                                                            mt: 1.5,
                                                            p: 1.5,
                                                            backgroundColor: getThemedBgColor('grey.50', 'grey.700'),
                                                            borderRadius: 1,
                                                            borderLeft: '3px solid',
                                                            borderColor: 'primary.main'
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: getThemedColor('text.secondary', 'grey.300'),
                                                                fontStyle: 'italic'
                                                            }}
                                                        >
                                                            {timeSlot.reservable.notes}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        )}
                                    </Stack>
                                </Box>
                            )}
                        </>
                    )}
                </CardContent>

                {/* Action Buttons */}
                {showActions && (
                    <>
                        <Divider sx={{
                            borderColor: getThemedColor('grey.200', 'grey.700')
                        }}/>
                        <CardActions sx={{
                            justifyContent: 'space-between',
                            px: {xs: 2, sm: 3},
                            py: 1.5,
                            gap: 1,
                            flexWrap: 'wrap',
                            backgroundColor: getThemedBgColor('grey.50', 'grey.850')
                        }}>
                            {/* Primary Action Buttons */}
                            <Stack
                                direction={isMobile ? "column" : "row"}
                                spacing={1}
                                sx={{
                                    flex: 1,
                                    width: isMobile ? '100%' : 'auto'
                                }}
                            >
                                {/* Conversion Button */}
                                {canConversion && timeSlot.reservable_type === "customer" && (
                                    <Button
                                        onClick={handleConversion}
                                        variant="outlined"
                                        size="small"
                                        startIcon={<SwapHoriz/>}
                                        fullWidth={isMobile}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            borderColor: getThemedColor('primary.main', 'primary.light'),
                                            color: getThemedColor('primary.main', 'primary.light'),
                                            '&:hover': {
                                                borderColor: getThemedColor('primary.dark', 'primary.main'),
                                                backgroundColor: getThemedBgColor('primary.50', 'primary.900')
                                            }
                                        }}
                                    >
                                        Convert to Patient
                                    </Button>
                                )}

                                {/* Consultation Actions */}
                                {canCheckConsultation && timeSlot.reservable_type === "consultation" && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        component={Link}
                                        href={route("consultations.show", timeSlot?.reservable?.id)}
                                        startIcon={<VisibilityOutlined/>}
                                        fullWidth={isMobile}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            '&:hover': {
                                                backgroundColor: getThemedColor('primary.dark', 'primary.main')
                                            }
                                        }}
                                    >
                                        View Consultation
                                    </Button>
                                )}

                                {timeSlot.reservable?.patient && canCheckPatient && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        color="primary"
                                        component={Link}
                                        href={route("patients.show", timeSlot?.reservable?.patient?.id)}
                                        startIcon={<PersonOutline/>}
                                        fullWidth={isMobile}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            borderColor: getThemedColor('primary.main', 'primary.light'),
                                            color: getThemedColor('primary.main', 'primary.light'),
                                            '&:hover': {
                                                borderColor: getThemedColor('primary.dark', 'primary.main'),
                                                backgroundColor: getThemedBgColor('primary.50', 'primary.900')
                                            }
                                        }}
                                    >
                                        Patient Profile
                                    </Button>
                                )}
                            </Stack>

                            {/* Management Action Buttons */}
                            <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                    mt: isMobile ? 1 : 0,
                                    justifyContent: isMobile ? 'flex-end' : 'flex-start',
                                    width: isMobile ? '100%' : 'auto'
                                }}
                            >
                                {canEdit && (
                                    <Tooltip title="Edit time slot">
                                        <IconButton
                                            onClick={() => onEdit(timeSlot)}
                                            size="small"
                                            sx={{
                                                color: getThemedColor('primary.main', 'primary.light'),
                                                '&:hover': {
                                                    backgroundColor: getThemedBgColor('primary.50', 'primary.900')
                                                }
                                            }}
                                        >
                                            <EditOutlined fontSize="small"/>
                                        </IconButton>
                                    </Tooltip>
                                )}
                                {((canDelete && !!timeSlot.reservable_type) || (canDeleteConsultantReserve && !timeSlot.reservable_type)) && (
                                    <Tooltip title="Delete time slot">
                                        <IconButton
                                            onClick={handleDeleteClick}
                                            size="small"
                                            sx={{
                                                color: getThemedColor('error.main', 'error.light'),
                                                '&:hover': {
                                                    backgroundColor: getThemedBgColor('error.50', 'error.900')
                                                }
                                            }}
                                        >
                                            <DeleteOutline fontSize="small"/>
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Stack>
                        </CardActions>
                    </>
                )}
            </Card>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Time Slot"
                itemName={getItemName()}
                itemType="time slot"
                description={getDeleteDescription()}
                isLoading={isDeleting}
                severity={timeSlot.reservable_type ? "error" : "warning"}
            />
        </>
    );
};

export default TimeSlotCard;
