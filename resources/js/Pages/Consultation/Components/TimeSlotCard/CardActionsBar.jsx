import React from 'react';
import { Button, CardActions, Divider, IconButton, Link, Stack, Tooltip } from '@mui/material';
import {
    EditOutlined,
    DeleteOutlined,
    VisibilityOutlined,
    PersonOutlined,
    SwapHoriz,
} from '@mui/icons-material';

const CardActionsBar = ({
    timeSlot,
    isMobile,
    canConversion,
    canCheckConsultation,
    canCheckPatient,
    canEdit,
    canDelete,
    canDeleteConsultantReserve,
    onEdit,
    onConversion,
    onDeleteClick,
    getThemedColor,
    getThemedBgColor,
}) => (
    <>
        <Divider sx={{ borderColor: getThemedColor('grey.200', 'grey.700') }} />
        <CardActions
            sx={{
                justifyContent: 'space-between',
                px: { xs: 2, sm: 3 },
                py: 1.5,
                gap: 1,
                flexWrap: 'wrap',
                backgroundColor: getThemedBgColor('grey.50', 'grey.850'),
            }}
        >
            {/* Primary Action Buttons */}
            <Stack
                direction={isMobile ? 'column' : 'row'}
                spacing={1}
                sx={{ flex: 1, width: isMobile ? '100%' : 'auto' }}
            >
                {canConversion && timeSlot.reservable_type === 'customer' && (
                    <Button
                        onClick={onConversion}
                        variant="outlined"
                        size="small"
                        startIcon={<SwapHoriz />}
                        fullWidth={isMobile}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            borderColor: getThemedColor('primary.main', 'primary.light'),
                            color: getThemedColor('primary.main', 'primary.light'),
                            '&:hover': {
                                borderColor: getThemedColor('primary.dark', 'primary.main'),
                                backgroundColor: getThemedBgColor('primary.50', 'primary.900'),
                            },
                        }}
                    >
                        Convert to Patient
                    </Button>
                )}

                {canCheckConsultation &&
                    timeSlot.reservable_type === 'consultation' &&
                    timeSlot?.reservable?.id && (
                        <Button
                            variant="contained"
                            size="small"
                            component={Link}
                            href={route('consultations.show', timeSlot?.reservable?.id)}
                            startIcon={<VisibilityOutlined />}
                            fullWidth={isMobile}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 500,
                                '&:hover': {
                                    backgroundColor: getThemedColor('primary.dark', 'primary.main'),
                                },
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
                        href={route('patients.show', timeSlot?.reservable?.patient?.id)}
                        startIcon={<PersonOutlined />}
                        fullWidth={isMobile}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            borderColor: getThemedColor('primary.main', 'primary.light'),
                            color: getThemedColor('primary.main', 'primary.light'),
                            '&:hover': {
                                borderColor: getThemedColor('primary.dark', 'primary.main'),
                                backgroundColor: getThemedBgColor('primary.50', 'primary.900'),
                            },
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
                    width: isMobile ? '100%' : 'auto',
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
                                    backgroundColor: getThemedBgColor('primary.50', 'primary.900'),
                                },
                            }}
                        >
                            <EditOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                {((canDelete && !!timeSlot.reservable_type) ||
                    (canDeleteConsultantReserve && !timeSlot.reservable_type)) && (
                    <Tooltip title="Delete time slot">
                        <IconButton
                            onClick={onDeleteClick}
                            size="small"
                            sx={{
                                color: getThemedColor('error.main', 'error.light'),
                                '&:hover': {
                                    backgroundColor: getThemedBgColor('error.50', 'error.900'),
                                },
                            }}
                        >
                            <DeleteOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>
        </CardActions>
    </>
);

export default CardActionsBar;
