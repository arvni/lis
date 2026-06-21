import React, { useState, useMemo } from 'react';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Typography,
    Stack,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import { formatTime, getDuration } from './TimeSlotCard/helpers';
import ConsultantInfo from './TimeSlotCard/ConsultantInfo';
import CustomerReservation from './TimeSlotCard/CustomerReservation';
import ConsultationReservation from './TimeSlotCard/ConsultationReservation';
import CardActionsBar from './TimeSlotCard/CardActionsBar';

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
    onEdit,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isDark = theme.palette.mode === 'dark';
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Theme-aware color helpers
    const getThemedColor = useMemo(
        () => (lightColor, darkColor) => (isDark ? darkColor : lightColor),
        [isDark],
    );

    const getThemedBgColor = useMemo(
        () => (lightColor, darkColor) => (isDark ? darkColor : lightColor),
        [isDark],
    );

    // Get duration between start and end time
    const duration = useMemo(
        () => getDuration(timeSlot.started_at, timeSlot.ended_at),
        [timeSlot.started_at, timeSlot.ended_at],
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
            return 'This will cancel the customer appointment. The customer will need to be notified separately.';
        }
        return 'This will remove the time slot from the schedule.';
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
    const showActions =
        canEdit ||
        canDelete ||
        canConversion ||
        canCheckConsultation ||
        canCheckPatient ||
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
                    cursor: onClick && !canEdit && !canDelete ? 'pointer' : 'default',
                }}
                onClick={handleCardClick}
            >
                <CardContent sx={{ flexGrow: 1, p: { xs: 2, sm: 3 } }}>
                    {/* Header with Title and Status */}
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'flex-start' }}
                    >
                        <Typography
                            variant="h6"
                            fontWeight="600"
                            sx={{
                                color: getThemedColor('text.primary', 'grey.100'),
                                flex: 1,
                                wordBreak: 'break-word',
                            }}
                        >
                            {timeSlot.title || getItemName()}
                        </Typography>
                        <Chip
                            size="small"
                            label={timeSlot.active ? 'Active' : 'Inactive'}
                            color={timeSlot.active ? 'success' : 'default'}
                            variant={timeSlot.active ? 'filled' : 'outlined'}
                            sx={{
                                fontWeight: 500,
                                minWidth: 70,
                                color: timeSlot.active
                                    ? undefined
                                    : getThemedColor('text.secondary', 'grey.400'),
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
                            mb: 2,
                        }}
                    >
                        <EventIcon
                            fontSize="small"
                            sx={{ color: getThemedColor('primary.main', 'primary.light') }}
                        />
                        <Box sx={{ flex: 1 }}>
                            <Typography
                                variant="body1"
                                fontWeight="500"
                                sx={{ color: getThemedColor('text.primary', 'grey.100') }}
                            >
                                {formatTime(timeSlot.started_at)} - {formatTime(timeSlot.ended_at)}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: getThemedColor('text.secondary', 'grey.400') }}
                            >
                                Duration: {duration}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Consultant Information */}
                    {timeSlot.consultant && (
                        <ConsultantInfo
                            consultant={timeSlot.consultant}
                            getThemedColor={getThemedColor}
                            getThemedBgColor={getThemedBgColor}
                        />
                    )}

                    {/* Reservation Information */}
                    {timeSlot.reservable_type && (
                        <>
                            <Divider
                                sx={{ my: 2, borderColor: getThemedColor('grey.200', 'grey.700') }}
                            />

                            {timeSlot.reservable_type === 'customer' && timeSlot.reservable && (
                                <CustomerReservation
                                    reservable={timeSlot.reservable}
                                    getThemedColor={getThemedColor}
                                    getThemedBgColor={getThemedBgColor}
                                />
                            )}

                            {timeSlot.reservable_type === 'consultation' && timeSlot.reservable && (
                                <ConsultationReservation
                                    reservable={timeSlot.reservable}
                                    getThemedColor={getThemedColor}
                                    getThemedBgColor={getThemedBgColor}
                                />
                            )}
                        </>
                    )}
                    {timeSlot.note && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                my: 2,
                                p: 1.5,
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: getThemedColor('grey.200', 'grey.600'),
                            }}
                        >
                            {timeSlot.note}
                        </Box>
                    )}
                </CardContent>

                {/* Action Buttons */}
                {showActions && (
                    <CardActionsBar
                        timeSlot={timeSlot}
                        isMobile={isMobile}
                        canConversion={canConversion}
                        canCheckConsultation={canCheckConsultation}
                        canCheckPatient={canCheckPatient}
                        canEdit={canEdit}
                        canDelete={canDelete}
                        canDeleteConsultantReserve={canDeleteConsultantReserve}
                        onEdit={onEdit}
                        onConversion={handleConversion}
                        onDeleteClick={handleDeleteClick}
                        getThemedColor={getThemedColor}
                        getThemedBgColor={getThemedBgColor}
                    />
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
                severity={timeSlot.reservable_type ? 'error' : 'warning'}
            />
        </>
    );
};

export default TimeSlotCard;
