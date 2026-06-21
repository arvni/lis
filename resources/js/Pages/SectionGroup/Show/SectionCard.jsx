import React from 'react';
import { router } from '@inertiajs/react';
import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Science as ScienceIcon,
    MoreVert as MoreVertIcon,
    Visibility as VisibilityIcon,
    CheckCircleOutlined as CheckCircleIcon,
    ErrorOutlined as ErrorOutlineIcon,
    AccessTimeOutlined as AccessTimeIcon,
    HourglassEmpty as HourglassEmptyIcon,
    DashboardOutlined as DashboardIcon,
} from '@mui/icons-material';

const StatusIndicator = ({ count, icon, color, label }) => (
    <Tooltip title={label} arrow placement="top">
        <Box
            display="flex"
            sx={{
                alignItems: 'center',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                bgcolor: `${color}.50`,
                border: 1,
                borderColor: `${color}.200`,
            }}
        >
            <Typography variant="h6" fontWeight="bold" color={`${color}.main`} sx={{ mr: 0.5 }}>
                {count}
            </Typography>
            {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
        </Box>
    </Tooltip>
);

const SectionCard = ({ item, hoveredCard, theme, onMouseEnter, onMouseLeave, onMenuOpen }) => {
    const cardKey = `section-${item.id}`;
    return (
        <Card
            elevation={hoveredCard === cardKey ? 4 : 1}
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                transition: 'all 0.3s ease',
                transform: hoveredCard === cardKey ? 'translateY(-8px)' : 'none',
                border: item.active ? 'none' : `1px solid ${theme.palette.error.light}`,
                opacity: item.active ? 1 : 0.8,
                position: 'relative',
                overflow: 'visible',
                cursor: 'pointer',
            }}
            onClick={() => router.visit(route('sections.show', item.id))}
            onMouseEnter={() => onMouseEnter(cardKey)}
            onMouseLeave={onMouseLeave}
        >
            {!item.active && (
                <Badge
                    badgeContent="Inactive"
                    color="error"
                    sx={{
                        position: 'absolute',
                        top: -10,
                        right: 16,
                        '& .MuiBadge-badge': {
                            fontSize: '0.7rem',
                            height: 20,
                            minWidth: 20,
                        },
                    }}
                />
            )}

            <CardHeader
                sx={{ pb: 1 }}
                avatar={
                    <Avatar
                        src={item.icon}
                        alt={item.name}
                        sx={{
                            bgcolor: 'secondary.light',
                            transition: 'all 0.3s ease',
                            transform: hoveredCard === cardKey ? 'scale(1.1)' : 'scale(1)',
                        }}
                    >
                        <ScienceIcon />
                    </Avatar>
                }
                title={
                    <Typography variant="h6" noWrap>
                        {item.name}
                    </Typography>
                }
                action={
                    <IconButton
                        aria-label="settings"
                        onClick={(e) => onMenuOpen(e, item, 'section')}
                    >
                        <MoreVertIcon />
                    </IconButton>
                }
            />

            <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                {/* Stats Dashboard with improved visuals */}
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        mt: 1,
                        justifyContent: 'center',
                    }}
                >
                    <StatusIndicator
                        count={
                            item.finished_items_count * 1 +
                            item.rejected_items_count * 1 +
                            item.waiting_items_count * 1 +
                            item.processing_items_count * 1
                        }
                        icon={<DashboardIcon />}
                        color="primary"
                        label="Total Items"
                    />
                    <StatusIndicator
                        count={item.finished_items_count}
                        icon={<CheckCircleIcon />}
                        color="success"
                        label="Finished Items"
                    />
                    <StatusIndicator
                        count={item.processing_items_count}
                        icon={<AccessTimeIcon />}
                        color="info"
                        label="Processing Items"
                    />
                    <StatusIndicator
                        count={item.waiting_items_count}
                        icon={<HourglassEmptyIcon />}
                        color="warning"
                        label="Waiting Items"
                    />
                    <StatusIndicator
                        count={item.rejected_items_count}
                        icon={<ErrorOutlineIcon />}
                        color="error"
                        label="Rejected Items"
                    />
                </Box>
            </CardContent>

            <CardActions>
                <Button
                    size="small"
                    variant="text"
                    color="secondary"
                    fullWidth
                    onClick={(e) => {
                        e.stopPropagation();
                        router.visit(route('sections.show', item.id));
                    }}
                    startIcon={<VisibilityIcon />}
                >
                    View Details
                </Button>
            </CardActions>
        </Card>
    );
};

export default SectionCard;
