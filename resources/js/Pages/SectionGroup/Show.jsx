import React, { useState } from 'react';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { router } from "@inertiajs/react";
import {
    Typography,
    Box,
    Card,
    CardHeader,
    CardContent,
    CardActions,
    Button,
    Chip,
    Avatar,
    Container,
    Grid2 as MuiGrid,
    IconButton,
    Paper,
    Menu,
    MenuItem,
    Tooltip,
    Fade,
    Divider,
    useTheme,
    useMediaQuery,
    Badge
} from '@mui/material';
import {
    Folder as FolderIcon,
    Science as ScienceIcon,
    MoreVert as MoreVertIcon,
    Visibility as VisibilityIcon,
    CheckCircleOutline as CheckCircleIcon,
    ErrorOutline as ErrorOutlineIcon,
    AccessTimeOutlined as AccessTimeIcon,
    HourglassEmpty as HourglassEmptyIcon,
    DashboardOutlined as DashboardIcon,
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Edit as EditIcon
} from '@mui/icons-material';

// Grid component with better naming
const Grid = MuiGrid;

const Show = ({ sectionGroup }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [menuItemId, setMenuItemId] = useState(null);
    const [menuItemType, setMenuItemType] = useState(null);
    const [hoveredCard, setHoveredCard] = useState(null);

    // Calculate stats
    const stats = {
        total: {
            sections: sectionGroup.sections ? sectionGroup.sections.length : 0,
            subGroups: sectionGroup.children ? sectionGroup.children.length : 0,
            activeSections: sectionGroup.sections ? sectionGroup.sections.filter(s => s.active).length : 0,
            activeSubGroups: sectionGroup.children ? sectionGroup.children.filter(g => g.active).length : 0,
        }
    };

    // Handle card menu actions
    const handleMenuOpen = (event, id, type) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setMenuItemId(id);
        setMenuItemType(type);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setMenuItemId(null);
        setMenuItemType(null);
    };

    const handleView = () => {
        if (menuItemType === 'sectionGroup') {
            router.visit(route('sectionGroups.show', menuItemId));
        } else if (menuItemType === 'section') {
            router.visit(route('sections.show', menuItemId));
        }
        handleMenuClose();
    };

    const navigateToParent = () => {
        if (sectionGroup.parent) {
            router.visit(route('sectionGroups.show', sectionGroup.parent.id));
        } else {
            router.visit(route('sectionGroups.index'));
        }
    };

    // Card hover handlers
    const handleCardMouseEnter = (itemId) => {
        setHoveredCard(itemId);
    };

    const handleCardMouseLeave = () => {
        setHoveredCard(null);
    };

    // Function to render status indicators
    const renderStatusIndicator = (count, icon, color, label) => (
        <Tooltip title={label} arrow placement="top">
            <Box
                display="flex"
                alignItems="center"
                sx={{
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

    // Helper to get proper grid sizing based on device and content
    const getGridSize = () => {
        if (isMobile) return 12;
        if (isTablet) return 6;

        // If there are few items, make them larger on desktop
        const totalItems = (sectionGroup.children?.length || 0) + (sectionGroup.sections?.length || 0);
        if (totalItems <= 3) return 4;
        return 3;
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ pt: 2, pb: 6 }}>
                {/* Header Card with improved design */}
                <Card
                    elevation={3}
                    sx={{
                        p: { xs: 2, md: 3 },
                        mb: 4,
                        borderRadius: 2,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                        color: 'white',
                        position: 'relative',
                        overflow: 'visible'
                    }}
                >
                    <Grid container spacing={2} alignItems="center">
                        <Grid size={{xs:12,md:7}} xs={12} md={7}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {sectionGroup.parent && (
                                    <Tooltip title="Back to parent group">
                                        <IconButton
                                            color="inherit"
                                            sx={{
                                                bgcolor: 'rgba(255,255,255,0.1)',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                                            }}
                                            onClick={navigateToParent}
                                        >
                                            <ArrowBackIcon />
                                        </IconButton>
                                    </Tooltip>
                                )}

                                {sectionGroup.icon ? (
                                    <Avatar
                                        src={sectionGroup.icon}
                                        sx={{
                                            width: { xs: 48, md: 64 },
                                            height: { xs: 48, md: 64 },
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                                        }}
                                    />
                                ) : (
                                    <Avatar
                                        sx={{
                                            width: { xs: 48, md: 64 },
                                            height: { xs: 48, md: 64 },
                                            bgcolor: 'primary.light',
                                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                                        }}
                                    >
                                        <FolderIcon sx={{ fontSize: { xs: 28, md: 36 } }} />
                                    </Avatar>
                                )}

                                <Box>
                                    <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
                                        {sectionGroup.name}
                                    </Typography>
                                    {sectionGroup.parent && (
                                        <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 0.5 }}>
                                            {sectionGroup.parent.name}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Grid>

                        <Grid size={{xs:12,md:5}} xs={12} md={5}>
                            <Box sx={{
                                display: 'flex',
                                gap: 1.5,
                                flexWrap: 'wrap',
                                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                                mt: { xs: 2, md: 0 }
                            }}>
                                <Tooltip title="Total sub-groups" arrow>
                                    <Chip
                                        icon={<FolderIcon />}
                                        label={`${stats.total.subGroups} Sub-groups`}
                                        color="primary"
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.15)',
                                            color: 'white',
                                            borderColor: 'rgba(255,255,255,0.3)',
                                            '& .MuiChip-icon': { color: 'white' }
                                        }}
                                    />
                                </Tooltip>

                                <Tooltip title="Total sections" arrow>
                                    <Chip
                                        icon={<ScienceIcon />}
                                        label={`${stats.total.sections} Sections`}
                                        color="primary"
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.15)',
                                            color: 'white',
                                            borderColor: 'rgba(255,255,255,0.3)',
                                            '& .MuiChip-icon': { color: 'white' }
                                        }}
                                    />
                                </Tooltip>

                                {!sectionGroup.active && (
                                    <Chip
                                        label="Inactive Group"
                                        color="error"
                                        sx={{
                                            fontWeight: 'bold',
                                            bgcolor: theme.palette.error.dark
                                        }}
                                    />
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Card>

                {/* Summary statistics */}
                <Box sx={{ mb: 4 }}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                        <CardContent>
                            <Grid container spacing={3}>
                                <Grid size={{xs:12,sm:6,md:3}}>
                                    <Box sx={{ textAlign: 'center', p: 1 }}>
                                        <Typography variant="h5" fontWeight="bold" color="primary.main">
                                            {stats.total.subGroups}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Sub-groups
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{xs:12,sm:6,md:3}}>
                                    <Box sx={{ textAlign: 'center', p: 1 }}>
                                        <Typography variant="h5" fontWeight="bold" color="success.main">
                                            {stats.total.activeSubGroups}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Active Sub-groups
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{xs:12,sm:6,md:3}}>
                                    <Box sx={{ textAlign: 'center', p: 1 }}>
                                        <Typography variant="h5" fontWeight="bold" color="secondary.main">
                                            {stats.total.sections}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Sections
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{xs:12,sm:6,md:3}}>
                                    <Box sx={{ textAlign: 'center', p: 1 }}>
                                        <Typography variant="h5" fontWeight="bold" color="success.main">
                                            {stats.total.activeSections}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Active Sections
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Box>

                {/* Sub-groups section */}
                {(sectionGroup.children && sectionGroup.children.length > 0) && (
                    <Box sx={{ mb: 5 }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: theme.palette.primary.main,
                                    fontWeight: 'medium'
                                }}
                            >
                                <FolderIcon sx={{ mr: 1 }} />
                                Sub-groups
                            </Typography>

                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            {sectionGroup.children.map((item) => (
                                <Grid size={{xs:12,sm:6,md:getGridSize()}} key={item.id}>
                                    <Card
                                        elevation={hoveredCard === item.id ? 4 : 1}
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 2,
                                            transition: 'all 0.3s ease',
                                            transform: hoveredCard === item.id ? 'translateY(-8px)' : 'none',
                                            border: item.active ? 'none' : `1px solid ${theme.palette.error.light}`,
                                            opacity: item.active ? 1 : 0.8,
                                            position: 'relative',
                                            overflow: 'visible',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => router.visit(route('sectionGroups.show', item.id))}
                                        onMouseEnter={() => handleCardMouseEnter(item.id)}
                                        onMouseLeave={handleCardMouseLeave}
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
                                                    }
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
                                                        bgcolor: 'primary.light',
                                                        transition: 'all 0.3s ease',
                                                        transform: hoveredCard === item.id ? 'scale(1.1)' : 'scale(1)'
                                                    }}
                                                >
                                                    <FolderIcon />
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
                                                    onClick={(e) => handleMenuOpen(e, item.id, 'sectionGroup')}
                                                >
                                                    <MoreVertIcon />
                                                </IconButton>
                                            }
                                        />

                                        <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                                            {item.sectionsCount > 0 && (
                                                <Tooltip title={`Contains ${item.sectionsCount} sections`} arrow>
                                                    <Chip
                                                        size="small"
                                                        label={`${item.sectionsCount} sections`}
                                                        color="primary"
                                                        variant="outlined"
                                                        sx={{ mt: 1 }}
                                                    />
                                                </Tooltip>
                                            )}
                                        </CardContent>

                                        <CardActions>
                                            <Button
                                                size="small"
                                                variant="text"
                                                color="primary"
                                                fullWidth
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.visit(route('sectionGroups.show', item.id));
                                                }}
                                                startIcon={<VisibilityIcon />}
                                            >
                                                View Details
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* Sections section */}
                {(sectionGroup.sections && sectionGroup.sections.length > 0) && (
                    <Box sx={{ mb: 5 }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2
                        }}>
                            <Typography
                                variant="h5"
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    color: theme.palette.secondary.main,
                                    fontWeight: 'medium'
                                }}
                            >
                                <ScienceIcon sx={{ mr: 1 }} />
                                Sections
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 3 }} />

                        <Grid container spacing={3}>
                            {sectionGroup.sections.map((item) => (
                                <Grid size={{xs:12,sm:6,md:getGridSize()}} key={item.id}>
                                    <Card
                                        elevation={hoveredCard === `section-${item.id}` ? 4 : 1}
                                        sx={{
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 2,
                                            transition: 'all 0.3s ease',
                                            transform: hoveredCard === `section-${item.id}` ? 'translateY(-8px)' : 'none',
                                            border: item.active ? 'none' : `1px solid ${theme.palette.error.light}`,
                                            opacity: item.active ? 1 : 0.8,
                                            position: 'relative',
                                            overflow: 'visible',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => router.visit(route('sections.show', item.id))}
                                        onMouseEnter={() => handleCardMouseEnter(`section-${item.id}`)}
                                        onMouseLeave={handleCardMouseLeave}
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
                                                    }
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
                                                        transform: hoveredCard === `section-${item.id}` ? 'scale(1.1)' : 'scale(1)'
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
                                                    onClick={(e) => handleMenuOpen(e, item.id, 'section')}
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
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                {renderStatusIndicator(
                                                    item.finished_items_count * 1 + item.rejected_items_count * 1 +
                                                    item.waiting_items_count * 1 + item.processing_items_count * 1,
                                                    <DashboardIcon />,
                                                    'primary',
                                                    'Total Items'
                                                )}

                                                {renderStatusIndicator(
                                                    item.finished_items_count,
                                                    <CheckCircleIcon />,
                                                    'success',
                                                    'Finished Items'
                                                )}

                                                {renderStatusIndicator(
                                                    item.processing_items_count,
                                                    <AccessTimeIcon />,
                                                    'info',
                                                    'Processing Items'
                                                )}

                                                {renderStatusIndicator(
                                                    item.waiting_items_count,
                                                    <HourglassEmptyIcon />,
                                                    'warning',
                                                    'Waiting Items'
                                                )}

                                                {renderStatusIndicator(
                                                    item.rejected_items_count,
                                                    <ErrorOutlineIcon />,
                                                    'error',
                                                    'Rejected Items'
                                                )}
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
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                {/* Empty state with improved visual feedback */}
                {sectionGroup.children.length === 0 && sectionGroup.sections.length === 0 && (
                    <Fade in={true} timeout={1000}>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 6,
                                textAlign: 'center',
                                borderRadius: 2,
                                bgcolor: 'background.paper'
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 80,
                                    height: 80,
                                    mx: 'auto',
                                    mb: 2,
                                    bgcolor: 'primary.light'
                                }}
                            >
                                <FolderIcon sx={{ fontSize: 40 }} />
                            </Avatar>

                            <Typography variant="h5" color="text.primary" gutterBottom>
                                No Sub-groups or Sections Yet
                            </Typography>

                            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
                                This section group is empty. You can add sub-groups or sections to organize your content.
                            </Typography>
                        </Paper>
                    </Fade>
                )}
            </Box>

            {/* Actions menu with improved design */}
            <Menu
                id="card-actions-menu"
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
                slots={{Transition:Fade}}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleView}>
                    <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                    View Details
                </MenuItem>

                <MenuItem onClick={() => {
                    if (menuItemType === 'sectionGroup') {
                        router.visit(route('sectionGroups.edit', menuItemId));
                    } else if (menuItemType === 'section') {
                        router.visit(route('sections.edit', menuItemId));
                    }
                    handleMenuClose();
                }}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Edit
                </MenuItem>
            </Menu>
        </Container>
    );
}

const getNestedParents = (sectionGroup) => {
    if (sectionGroup.parent) {
        return [
            ...getNestedParents(sectionGroup.parent),
            {
                title: sectionGroup.name,
                link: route("sectionGroups.show", sectionGroup.id),
                icon: null
            },
        ];
    }
    return [
        {
            title: sectionGroup.name,
            link: route("sectionGroups.show", sectionGroup.id),
            icon: null
        },
    ];

}


Show.layout = page => <AuthenticatedLayout
    auth={page.props.auth}
    children={page}
    breadcrumbs={getNestedParents(page.props.sectionGroup)}
/>

export default Show;
