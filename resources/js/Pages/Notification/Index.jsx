import {useState, useEffect} from 'react';
import useSWR from 'swr';
import {
    Container,
    Typography,
    Paper,
    Box,
    Button,
    Grid2 as Grid,
    Chip,
    IconButton,
    MenuItem,
    Menu,
    Tabs,
    Tab,
    Skeleton,
    Alert,
    TextField,
    InputAdornment,
    Pagination,
    Card,
    CardContent,

    alpha
} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout.jsx";

const fetcher = (...args) => fetch(...args).then(res => res.json());

// Format date relative to current time (e.g., "2 hours ago")
const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
};

const Index = () => {
    const theme = useTheme();
    const [tabValue, setTabValue] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [filterAnchorEl, setFilterAnchorEl] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectMode, setSelectMode] = useState(false);

    // Get query parameters for SWR
    const getQueryParams = () => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('filter', tabValue === 0 ? 'all' : tabValue === 1 ? 'unread' : 'read');
        if (searchQuery)
            params.append('search', searchQuery);
        if (filterType !== 'all') params.append('type', filterType);
        return params.toString();
    };

    const {data, error, mutate} = useSWR(
        `${route('api.notifications.index')}?${getQueryParams()}`,
        fetcher,
        {refreshInterval: 60000}
    );

    const isLoading = !data && !error;
    const notifications = data?.notifications || [];
    const totalPages = data?.meta?.last_page || 1;

    // Reset selections when tab changes
    useEffect(() => {
        setSelectedIds([]);
        setSelectMode(false);
    }, [tabValue]);

    // Handlers
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setPage(1);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
        setPage(1);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
        window.scrollTo(0, 0);
    };

    const handleMenuOpen = (event, notification) => {
        setAnchorEl(event.currentTarget);
        setSelectedNotification(notification);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedNotification(null);
    };

    const handleFilterOpen = (event) => {
        setFilterAnchorEl(event.currentTarget);
    };

    const handleFilterClose = () => {
        setFilterAnchorEl(null);
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
        setPage(1);
        handleFilterClose();
    };

    const toggleSelectMode = () => {
        setSelectMode(!selectMode);
        setSelectedIds([]);
    };

    const toggleSelectNotification = (id) => {
        setSelectedIds(prevIds =>
            prevIds.includes(id)
                ? prevIds.filter(itemId => itemId !== id)
                : [...prevIds, id]
        );
    };

    const selectAllNotifications = () => {
        if (selectedIds.length === notifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(notifications.map(notification => notification.id));
        }
    };

    // API Interaction Methods
    const markAsRead = async (ids) => {
        try {
            const response = await fetch(route('api.notifications.markAsRead'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({ids: Array.isArray(ids) ? ids : [ids]}),
            });

            if (response.ok) {
                mutate();
                if (selectMode && selectedIds.length > 0) {
                    setSelectedIds([]);
                }
            }
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }
    };

    const markAsUnread = async (ids) => {
        try {
            const response = await fetch(route('api.notifications.markAsUnread'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({ids: Array.isArray(ids) ? ids : [ids]}),
            });

            if (response.ok) {
                mutate();
                if (selectMode && selectedIds.length > 0) {
                    setSelectedIds([]);
                }
            }
        } catch (error) {
            console.error('Failed to mark notifications as unread:', error);
        }
    };

    const deleteNotifications = async (ids) => {
        try {
            const response = await fetch(route('api.notifications.delete'), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({ids: Array.isArray(ids) ? ids : [ids]}),
            });

            if (response.ok) {
                mutate();
                if (selectMode && selectedIds.length > 0) {
                    setSelectedIds([]);
                }
            }
        } catch (error) {
            console.error('Failed to delete notifications:', error);
        }
    };

    // Render notification cards
    const renderNotificationCard = (notification) => {
        const isSelected = selectedIds.includes(notification.id);

        return (
            <Card
                key={notification.id}
                elevation={1}
                sx={{
                    mb: 2,
                    borderLeft: notification.read ? 'none' : '4px solid',
                    borderColor: 'primary.main',
                    backgroundColor: isSelected
                        ? alpha(theme.palette.primary.main, 0.08)
                        : notification.read
                            ? 'background.paper'
                            : alpha(theme.palette.primary.main, 0.04),
                    transition: 'all 0.2s ease',
                    cursor: selectMode ? 'pointer' : 'default',
                    '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)',
                    }
                }}
                onClick={selectMode ? () => toggleSelectNotification(notification.id) : undefined}
            >
                <CardContent>
                    <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                        <Box sx={{display: 'flex', alignItems: 'flex-start', flex: 1, mr: 2}}>
                            {/* If you want to add notification type icons based on type */}
                            {selectMode && (
                                <Box
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        border: '2px solid',
                                        borderColor: isSelected ? 'primary.main' : 'divider',
                                        mr: 2,
                                        backgroundColor: isSelected ? 'primary.main' : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {isSelected && (
                                        <CheckCircleOutlineIcon sx={{color: 'white', fontSize: 16}}/>
                                    )}
                                </Box>
                            )}

                            <Box sx={{flex: 1}}>
                                <Typography
                                    variant="subtitle1"
                                    sx={{
                                        fontWeight: notification.read ? 400 : 600,
                                        mb: 0.5
                                    }}
                                >
                                    {notification.title || 'Notification'}
                                </Typography>

                                <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
                                    {notification.message || notification.text}
                                </Typography>

                                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatRelativeTime(notification.created_at)}
                                    </Typography>

                                    {notification.type && (
                                        <Chip
                                            label={notification.type}
                                            size="small"
                                            sx={{height: 24}}
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Box>

                        {!selectMode && (
                            <IconButton
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMenuOpen(e, notification);
                                }}
                            >
                                <MoreVertIcon fontSize="small"/>
                            </IconButton>
                        )}
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Container maxWidth="md" sx={{py: 4}}>
            <Box sx={{display: 'flex', alignItems: 'center', mb: 3}}>
                <IconButton
                    sx={{mr: 2}}
                    onClick={() => window.history.back()}
                >
                    <ArrowBackIcon/>
                </IconButton>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    Notifications
                </Typography>
            </Box>

            <Paper elevation={0} sx={{mb: 4, borderRadius: 2, overflow: 'hidden'}}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{borderBottom: 1, borderColor: 'divider'}}
                >
                    <Tab label="All"/>
                    <Tab label="Unread"/>
                    <Tab label="Read"/>
                </Tabs>

                <Box sx={{p: 2, borderBottom: 1, borderColor: 'divider'}}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                            <TextField
                                placeholder="Search notifications..."
                                variant="outlined"
                                fullWidth
                                size="small"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small"/>
                                            </InputAdornment>
                                        ),
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Box sx={{display: 'flex', justifyContent: {xs: 'flex-start', sm: 'flex-end'}, gap: 1}}>
                                <Button
                                    variant="outlined"
                                    color={selectMode ? "primary" : "inherit"}
                                    onClick={toggleSelectMode}
                                    startIcon={<CheckCircleOutlineIcon/>}
                                    size="small"
                                >
                                    {selectMode ? "Cancel" : "Select"}
                                </Button>

                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleFilterOpen}
                                    startIcon={<FilterListIcon/>}
                                >
                                    Filter
                                </Button>

                                <Menu
                                    anchorEl={filterAnchorEl}
                                    open={Boolean(filterAnchorEl)}
                                    onClose={handleFilterClose}
                                >
                                    <MenuItem
                                        onClick={() => handleFilterChange('all')}
                                        selected={filterType === 'all'}
                                    >
                                        All Types
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => handleFilterChange('system')}
                                        selected={filterType === 'system'}
                                    >
                                        System
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => handleFilterChange('alert')}
                                        selected={filterType === 'alert'}
                                    >
                                        Alerts
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => handleFilterChange('message')}
                                        selected={filterType === 'message'}
                                    >
                                        Messages
                                    </MenuItem>
                                </Menu>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                {selectMode && selectedIds.length > 0 && (
                    <Box sx={{p: 2, bgcolor: 'action.selected', borderBottom: 1, borderColor: 'divider'}}>
                        <Grid container alignItems="center" spacing={1}>
                            <Grid item>
                                <Typography variant="body2">
                                    {selectedIds.length} selected
                                </Typography>
                            </Grid>
                            <Grid item sx={{flexGrow: 1}}/>
                            <Grid item>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={selectAllNotifications}
                                >
                                    {selectedIds.length === notifications.length ? "Deselect All" : "Select All"}
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => markAsRead(selectedIds)}
                                >
                                    Mark as Read
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => markAsUnread(selectedIds)}
                                >
                                    Mark as Unread
                                </Button>
                            </Grid>
                            <Grid item>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="error"
                                    onClick={() => deleteNotifications(selectedIds)}
                                    startIcon={<DeleteOutlineIcon/>}
                                >
                                    Delete
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                )}

                <Box sx={{p: 3}}>
                    {isLoading ? (
                        // Loading skeletons
                        Array.from(new Array(5)).map((_, index) => (
                            <Box key={index} sx={{mb: 2}}>
                                <Skeleton animation="wave" height={24} width="40%" sx={{mb: 1}}/>
                                <Skeleton animation="wave" height={20} sx={{mb: 1}}/>
                                <Skeleton animation="wave" height={20} width="60%"/>
                            </Box>
                        ))
                    ) : error ? (
                        <Alert severity="error" sx={{mb: 2}}>
                            Failed to load notifications. Please try again later.
                        </Alert>
                    ) : notifications.length === 0 ? (
                        <Box sx={{textAlign: 'center', py: 6}}>
                            <NotificationsOffIcon sx={{fontSize: 64, color: 'text.secondary', mb: 2}}/>
                            <Typography variant="h6" color="text.secondary">
                                No notifications found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {searchQuery
                                    ? "Try adjusting your search criteria"
                                    : "You don't have any notifications yet"}
                            </Typography>
                        </Box>
                    ) : (
                        // Render notifications
                        <>
                            {notifications.map(renderNotificationCard)}

                            {totalPages > 1 && (
                                <Box sx={{display: 'flex', justifyContent: 'center', mt: 4}}>
                                    <Pagination
                                        count={totalPages}
                                        page={page}
                                        onChange={handlePageChange}
                                        color="primary"
                                        showFirstButton
                                        showLastButton
                                    />
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Paper>

            {/* Action menu for individual notifications */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {selectedNotification && !selectedNotification.read && (
                    <MenuItem onClick={() => markAsRead(selectedNotification.id).then(() => handleMenuClose())}>
                        Mark as read
                    </MenuItem>
                )}
                {selectedNotification && selectedNotification.read && (
                    <MenuItem onClick={() => markAsUnread(selectedNotification.id).then(() => handleMenuClose())}>
                        Mark as unread
                    </MenuItem>
                )}
                {selectedNotification && (
                    <MenuItem
                        onClick={() => deleteNotifications(selectedNotification.id).then(() => handleMenuClose())}
                        sx={{color: 'error.main'}}
                    >
                        Delete
                    </MenuItem>
                )}
            </Menu>
        </Container>
    );
};

Index.layout = (page) => (
    <AuthenticatedLayout auth={page.props.auth} title="Notifications" children={page} breadcrumbs={[{
        title: "Notifications",
        link: null,
        icon: null
    }]}/>);


export default Index;
