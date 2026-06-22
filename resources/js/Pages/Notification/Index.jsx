import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
    Container,
    Typography,
    Paper,
    Box,
    IconButton,
    Tabs,
    Tab,
    Skeleton,
    Alert,
    Pagination,
} from '@mui/material';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.jsx';
import { Head } from '@inertiajs/react';
import { fetcher } from './Index/helpers';
import NotificationCard from './Index/NotificationCard';
import NotificationToolbar from './Index/NotificationToolbar';
import BulkActionBar from './Index/BulkActionBar';
import ActionMenu from './Index/ActionMenu';

const Index = () => {
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
        if (searchQuery) params.append('search', searchQuery);
        if (filterType !== 'all') params.append('type', filterType);
        return params.toString();
    };

    const { data, error, mutate } = useSWR(
        `${route('api.notifications.index')}?${getQueryParams()}`,
        fetcher,
        { refreshInterval: 60000 },
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
        setSelectedIds((prevIds) =>
            prevIds.includes(id) ? prevIds.filter((itemId) => itemId !== id) : [...prevIds, id],
        );
    };

    const selectAllNotifications = () => {
        if (selectedIds.length === notifications.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(notifications.map((notification) => notification.id));
        }
    };

    // API Interaction Methods
    const markAsRead = async (ids) => {
        try {
            const response = await fetch(route('api.notifications.markAsRead'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content'),
                },
                body: JSON.stringify({ ids: Array.isArray(ids) ? ids : [ids] }),
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
                    'X-CSRF-TOKEN': document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content'),
                },
                body: JSON.stringify({ ids: Array.isArray(ids) ? ids : [ids] }),
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
                    'X-CSRF-TOKEN': document
                        .querySelector('meta[name="csrf-token"]')
                        ?.getAttribute('content'),
                },
                body: JSON.stringify({ ids: Array.isArray(ids) ? ids : [ids] }),
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

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Head title="Notifications" />
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton sx={{ mr: 2 }} onClick={() => window.history.back()}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    Notifications
                </Typography>
            </Box>

            <Paper elevation={0} sx={{ mb: 4, borderRadius: 2, overflow: 'hidden' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="All" />
                    <Tab label="Unread" />
                    <Tab label="Read" />
                </Tabs>

                <NotificationToolbar
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    selectMode={selectMode}
                    onToggleSelectMode={toggleSelectMode}
                    filterAnchorEl={filterAnchorEl}
                    onFilterOpen={handleFilterOpen}
                    onFilterClose={handleFilterClose}
                    filterType={filterType}
                    onFilterChange={handleFilterChange}
                />

                {selectMode && selectedIds.length > 0 && (
                    <BulkActionBar
                        selectedIds={selectedIds}
                        notifications={notifications}
                        onSelectAll={selectAllNotifications}
                        onMarkAsRead={markAsRead}
                        onMarkAsUnread={markAsUnread}
                        onDelete={deleteNotifications}
                    />
                )}

                <Box sx={{ p: 3 }}>
                    {isLoading ? (
                        // Loading skeletons
                        Array.from(new Array(5)).map((_, index) => (
                            <Box key={index} sx={{ mb: 2 }}>
                                <Skeleton animation="wave" height={24} width="40%" sx={{ mb: 1 }} />
                                <Skeleton animation="wave" height={20} sx={{ mb: 1 }} />
                                <Skeleton animation="wave" height={20} width="60%" />
                            </Box>
                        ))
                    ) : error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Failed to load notifications. Please try again later.
                        </Alert>
                    ) : notifications.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <NotificationsOffIcon
                                sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}
                            />
                            <Typography variant="h6" color="text.secondary">
                                No notifications found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {searchQuery
                                    ? 'Try adjusting your search criteria'
                                    : "You don't have any notifications yet"}
                            </Typography>
                        </Box>
                    ) : (
                        // Render notifications
                        <>
                            {notifications.map((notification) => (
                                <NotificationCard
                                    key={notification.id}
                                    notification={notification}
                                    isSelected={selectedIds.includes(notification.id)}
                                    selectMode={selectMode}
                                    onToggleSelect={toggleSelectNotification}
                                    onMenuOpen={handleMenuOpen}
                                />
                            ))}

                            {totalPages > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
            <ActionMenu
                anchorEl={anchorEl}
                selectedNotification={selectedNotification}
                onClose={handleMenuClose}
                onMarkAsRead={markAsRead}
                onMarkAsUnread={markAsUnread}
                onDelete={deleteNotifications}
            />
        </Container>
    );
};

Index.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        title="Notifications"
        breadcrumbs={[
            {
                title: 'Notifications',
                link: null,
                icon: null,
            },
        ]}
    >
        {page}
    </AuthenticatedLayout>
);

export default Index;
