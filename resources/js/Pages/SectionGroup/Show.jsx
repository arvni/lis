import React, { useMemo, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TableLayout from '@/Layouts/TableLayout';
import AcceptanceItemsFilter from './Components/AcceptanceItemsFilter';
import SectionGroupAddForm from './Components/AddForm';
import SectionAddForm from '@/Pages/Section/Components/AddForm';
import { Head, router, useRemember } from '@inertiajs/react';
import {
    Box,
    Card,
    Container,
    Paper,
    Tabs,
    Tab,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { buildAcceptanceItemColumns, getNestedParents } from './Show/constants';
import HeaderCard from './Show/HeaderCard';
import OverviewTab from './Show/OverviewTab';
import ActionsMenu from './Show/ActionsMenu';

const Show = ({ sectionGroup, acceptanceItems, requestInputs, status, success, errors }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    const [activeTab, setActiveTab] = useRemember(0, `section-group-${sectionGroup.id}-tab`);
    const [menuAnchorEl, setMenuAnchorEl] = useState(null);
    const [menuItemId, setMenuItemId] = useState(null);
    const [menuItemType, setMenuItemType] = useState(null);
    const [menuItem, setMenuItem] = useState(null);
    // { item, type } captured when the user picks Edit from a node's menu.
    const [editTarget, setEditTarget] = useState(null);
    const [hoveredCard, setHoveredCard] = useState(null);

    // Calculate stats
    const stats = {
        total: {
            sections: sectionGroup.sections ? sectionGroup.sections.length : 0,
            subGroups: sectionGroup.children ? sectionGroup.children.length : 0,
            activeSections: sectionGroup.sections
                ? sectionGroup.sections.filter((s) => s.active).length
                : 0,
            activeSubGroups: sectionGroup.children
                ? sectionGroup.children.filter((g) => g.active).length
                : 0,
        },
    };

    const acceptanceItemColumns = useMemo(() => buildAcceptanceItemColumns(), []);

    // Handle card menu actions
    const handleMenuOpen = (event, item, type) => {
        event.stopPropagation();
        setMenuAnchorEl(event.currentTarget);
        setMenuItem(item);
        setMenuItemId(item.id);
        setMenuItemType(type);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(null);
        setMenuItemId(null);
        setMenuItemType(null);
        setMenuItem(null);
    };

    // Open the edit modal for the node currently selected in the menu.
    const handleEdit = () => {
        if (menuItem && menuItemType) {
            setEditTarget({ item: menuItem, type: menuItemType });
        }
        handleMenuClose();
    };

    const handleEditClose = () => setEditTarget(null);

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

    const pageReload = (page, filters, sort, pageSize) => {
        router.visit(route('sectionGroups.show', sectionGroup.id), {
            data: { page, filters, sort, pageSize },
            only: ['acceptanceItems', 'requestInputs', 'status', 'success', 'errors'],
            preserveState: true,
            queryStringArrayFormat: 'indices',
        });
    };

    // Card hover handlers
    const handleCardMouseEnter = (itemId) => setHoveredCard(itemId);
    const handleCardMouseLeave = () => setHoveredCard(null);

    // Helper to get proper grid sizing based on device and content
    const getGridSize = () => {
        if (isMobile) return 12;
        if (isTablet) return 6;

        // If there are few items, make them larger on desktop
        const totalItems =
            (sectionGroup.children?.length || 0) + (sectionGroup.sections?.length || 0);
        if (totalItems <= 3) return 4;
        return 3;
    };

    return (
        <Container maxWidth="xl">
            <Head title={sectionGroup.name} />
            <Box sx={{ pt: 2, pb: 6 }}>
                <HeaderCard
                    sectionGroup={sectionGroup}
                    stats={stats}
                    isMobile={isMobile}
                    theme={theme}
                    onNavigateParent={navigateToParent}
                />

                <Paper elevation={0} variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(event, value) => setActiveTab(value)}
                        variant={isMobile ? 'fullWidth' : 'standard'}
                        sx={{ px: { xs: 0, sm: 2 } }}
                    >
                        <Tab label="Overview" />
                        <Tab label={`Acceptance Items (${acceptanceItems?.total || 0})`} />
                    </Tabs>
                </Paper>

                {activeTab === 0 && (
                    <OverviewTab
                        sectionGroup={sectionGroup}
                        stats={stats}
                        theme={theme}
                        gridSize={getGridSize()}
                        hoveredCard={hoveredCard}
                        onCardMouseEnter={handleCardMouseEnter}
                        onCardMouseLeave={handleCardMouseLeave}
                        onMenuOpen={handleMenuOpen}
                    />
                )}

                <Box sx={{ display: activeTab === 1 ? 'block' : 'none' }}>
                    <Card elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                        <TableLayout
                            defaultValues={requestInputs}
                            success={success}
                            status={status}
                            errors={errors}
                            reload={pageReload}
                            columns={acceptanceItemColumns}
                            data={acceptanceItems}
                            loading={false}
                            Filter={AcceptanceItemsFilter}
                        />
                    </Card>
                </Box>
            </Box>

            <ActionsMenu
                anchorEl={menuAnchorEl}
                onClose={handleMenuClose}
                onView={handleView}
                onEdit={handleEdit}
            />

            {editTarget?.type === 'sectionGroup' && (
                <SectionGroupAddForm open onClose={handleEditClose} defaultData={editTarget.item} />
            )}
            {editTarget?.type === 'section' && (
                <SectionAddForm open onClose={handleEditClose} defaultValue={editTarget.item} />
            )}
        </Container>
    );
};

Show.layout = (page) => (
    <AuthenticatedLayout
        auth={page.props.auth}
        breadcrumbs={getNestedParents(page.props.sectionGroup)}
    >
        {page}
    </AuthenticatedLayout>
);

export default Show;
