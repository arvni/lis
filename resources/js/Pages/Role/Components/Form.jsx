import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Stack,
    Switch,
    Tab,
    Paper,
    Tooltip,
    Card,
    Chip,
    useTheme,
    alpha,
    InputAdornment,
    IconButton,
    Badge,
    Alert,
    Fade
} from "@mui/material";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {
    ExpandMore,
    Settings,
    Help,
    Check,
    EditOutlined,
    Search,
    ClearAll,
    SaveOutlined,
    ArrowBack,
    InfoOutlined
} from "@mui/icons-material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { useState, useMemo, memo, useEffect, useCallback } from "react";

// Memoized Permission component to prevent unnecessary re-renders
const Permission = memo(({ onChange, checked, permission, label, level, disabled = false }) => {
    const theme = useTheme();

    const handleChange = useCallback((event) => {
        onChange(event);
    }, [onChange]);

    return (
        <Tooltip
            title={
                <Box>
                    <Typography variant="body2" fontWeight="bold">Permission ID: {permission.id}</Typography>
                    {permission.description && (
                        <Typography variant="caption">{permission.description}</Typography>
                    )}
                </Box>
            }
            arrow
            placement="top"
        >
            <Card
                variant="outlined"
                sx={{
                    p: 1.5,
                    mb: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 2,
                    borderColor: checked ? theme.palette.primary.main : theme.palette.divider,
                    bgcolor: checked
                        ? alpha(theme.palette.primary.main, 0.05)
                        : disabled ? alpha(theme.palette.action.disabledBackground, 0.1) : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
                        borderColor: disabled
                            ? theme.palette.divider
                            : checked ? theme.palette.primary.main : theme.palette.action.active
                    },
                    opacity: disabled ? 0.7 : 1
                }}
            >
                <Typography
                    sx={{
                        fontWeight: (700 - level * 100),
                        fontSize: 20 - level,
                        color: checked
                            ? theme.palette.primary.main
                            : disabled ? theme.palette.text.disabled : 'text.primary',
                        mx: 1
                    }}
                >
                    {label}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                    {checked && (
                        <Chip
                            size="small"
                            color="primary"
                            label="Enabled"
                            icon={<Check fontSize="small" />}
                            sx={{ height: 24 }}
                        />
                    )}
                    <Switch
                        checked={checked}
                        value={permission.id}
                        onChange={handleChange}
                        color="primary"
                        disabled={disabled}
                    />
                </Stack>
            </Card>
        </Tooltip>
    );
});

// Separate component for permission group to improve code organization
const PermissionGroup = memo(({ permission, label, onChange, data, level = 0, searchTerm = "", disabled = false }) => {
    const theme = useTheme();
    const variant = `h${Math.min(level + 4, 6)}`;
    const hasPermission = permission?.id && data.permissions.includes(permission.id);

    // Calculate if this group or any children match the search term
    const matchesSearch = useMemo(() => {
        if (!searchTerm) return true;

        const lowerSearchTerm = searchTerm.toLowerCase();
        if (label.toLowerCase().includes(lowerSearchTerm)) return true;

        // Check if any child permission matches
        if (permission?.children) {
            return Object.keys(permission.children).some(childKey => {
                const child = permission.children[childKey];
                if (childKey.toLowerCase().includes(lowerSearchTerm)) return true;
                if (child.children) {
                    return Object.keys(child.children).some(subChildKey =>
                        subChildKey.toLowerCase().includes(lowerSearchTerm)
                    );
                }
                return false;
            });
        }

        return false;
    }, [searchTerm, label, permission]);

    const totalChildPermissions = useMemo(() => {
        if (!permission?.children) return 0;
        return Object.keys(permission.children).length;
    }, [permission]);

    const enabledChildCount = useMemo(() => {
        if (!permission?.children) return 0;

        let count = 0;
        Object.keys(permission.children).forEach(childKey => {
            const child = permission.children[childKey];
            if (child.id && data.permissions.includes(child.id)) {
                count++;
            }

            if (child.children) {
                Object.keys(child.children).forEach(subChildKey => {
                    const subChild = child.children[subChildKey];
                    if (subChild.id && data.permissions.includes(subChild.id)) {
                        count++;
                    }
                });
            }
        });

        return count;
    }, [permission, data.permissions]);

    // If nothing matches the search term, don't render
    if (searchTerm && !matchesSearch) return null;

    return (
        <Accordion
            defaultExpanded={level < 1 || (searchTerm && matchesSearch)}
            sx={{
                mb: 2,
                border: '1px solid',
                borderColor: theme.palette.divider,
                borderRadius: '8px !important',
                '&:before': {
                    display: 'none',
                },
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                opacity: disabled ? 0.8 : 1,
                transition: 'all 0.2s ease',
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls={`panel-${permission?.id || label}-content`}
                id={`panel-${permission?.id || label}-header`}
                sx={{
                    bgcolor: hasPermission ? alpha(theme.palette.primary.main, 0.05) : null,
                    borderBottom: '1px solid',
                    borderColor: theme.palette.divider,
                    '&:hover': {
                        bgcolor: hasPermission
                            ? alpha(theme.palette.primary.main, 0.08)
                            : alpha(theme.palette.action.hover, 0.08)
                    }
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center" width="100%">
                    <Settings
                        fontSize="small"
                        color={hasPermission ? "primary" : "action"}
                    />
                    <Typography
                        variant={variant}
                        color={hasPermission ? "primary" : "textPrimary"}
                        sx={{ fontWeight: hasPermission ? 600 : 500 }}
                    >
                        {label}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                        {enabledChildCount > 0 && (
                            <Chip
                                size="small"
                                label={`${enabledChildCount} enabled`}
                                color="primary"
                                variant="outlined"
                                sx={{ height: 24 }}
                            />
                        )}

                        {totalChildPermissions > 0 && (
                            <Chip
                                size="small"
                                label={`${totalChildPermissions} permission${totalChildPermissions > 1 ? 's' : ''}`}
                                color="default"
                                variant="outlined"
                                sx={{ height: 24 }}
                            />
                        )}
                    </Stack>
                </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 3, pb: 2 }}>
                {permission?.id && (
                    <Box sx={{ mb: 3 }}>
                        <Permission
                            permission={permission}
                            checked={hasPermission}
                            label={`${label} (Group permission)`}
                            level={level}
                            onChange={onChange}
                            disabled={disabled}
                        />
                    </Box>
                )}
                {permission?.children && (
                    <PermissionChildren
                        permissions={permission.children}
                        onChange={onChange}
                        data={data}
                        level={level + 1}
                        id={permission.id}
                        searchTerm={searchTerm}
                        disabled={disabled}
                    />
                )}
            </AccordionDetails>
        </Accordion>
    );
});

// Separate component for permission children to improve code organization
const PermissionChildren = memo(({
                                     permissions,
                                     onChange,
                                     data,
                                     level,
                                     id = null,
                                     searchTerm = "",
                                     disabled = false
                                 }) => {
    const { hasChildrenPermission, singlePermission } = useMemo(() => {
        const hasChildren = [];
        const single = [];

        Object.keys(permissions).forEach(item => {
            if (Object.keys(permissions[item]).includes("children")) {
                hasChildren.push(item);
            } else {
                single.push(item);
            }
        });

        return { hasChildrenPermission: hasChildren, singlePermission: single };
    }, [permissions]);

    // Filter single permissions based on search term
    const filteredSinglePermissions = useMemo(() => {
        if (!searchTerm) return singlePermission;

        const lowerSearchTerm = searchTerm.toLowerCase();
        return singlePermission.filter(item =>
            item.toLowerCase().includes(lowerSearchTerm)
        );
    }, [singlePermission, searchTerm]);

    // If nothing matches the search term and there are no matching child groups, don't render
    if (searchTerm && filteredSinglePermissions.length === 0 && hasChildrenPermission.length === 0) {
        return null;
    }

    return (
        <Grid container spacing={2} key={`${id}-${level}`}>
            {filteredSinglePermissions.length > 0 && (
                <Grid size={{xs:12}}>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: {
                                xs: '1fr',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(3, 1fr)'
                            },
                            gap: 2
                        }}
                    >
                        {filteredSinglePermissions.map(item => (
                            <Permission
                                key={permissions[item].id}
                                onChange={onChange}
                                label={item}
                                level={level}
                                checked={data.permissions.includes(permissions[item].id)}
                                permission={permissions[item]}
                                disabled={disabled}
                            />
                        ))}
                    </Box>
                </Grid>
            )}

            <Grid size={{xs:12}}>
                {hasChildrenPermission.map(item => (
                    <PermissionGroup
                        key={item}
                        permission={permissions[item]}
                        label={item}
                        onChange={onChange}
                        data={data}
                        level={level}
                        searchTerm={searchTerm}
                        disabled={disabled}
                    />
                ))}
            </Grid>
        </Grid>
    );
});

// Actions component for the permissions section
const PermissionActions = memo(({
                                    onSelectAll,
                                    onClearAll,
                                    searchTerm,
                                    onSearchChange,
                                    permissionCount,
                                    disabled = false
                                }) => {
    const theme = useTheme();

    const handleSearchChange = useCallback((e) => {
        onSearchChange(e.target.value);
    }, [onSearchChange]);

    const handleClearSearch = useCallback(() => {
        onSearchChange('');
    }, [onSearchChange]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                mb: 3,
                gap: 2
            }}
        >
            <TextField
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                fullWidth
                disabled={disabled}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search color="action" fontSize="small"/>
                            </InputAdornment>
                        ),
                        endAdornment: searchTerm ? (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={handleClearSearch}
                                    edge="end"
                                    aria-label="clear search"
                                >
                                    <ClearAll fontSize="small"/>
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                        sx: {
                            borderRadius: 2,
                            bgcolor: theme.palette.background.paper
                        }
                    }
                }}
                sx={{ flexGrow: 1, maxWidth: { sm: 300 } }}
            />

            <Stack
                direction="row"
                spacing={2}
                sx={{
                    justifyContent: { xs: 'flex-end', sm: 'flex-end' },
                    flexShrink: 0
                }}
            >
                <Button
                    onClick={onSelectAll}
                    variant="outlined"
                    size="small"
                    startIcon={<Check />}
                    disabled={disabled}
                    sx={{ borderRadius: 2 }}
                >
                    Select All
                </Button>
                <Button
                    onClick={onClearAll}
                    variant="outlined"
                    color="secondary"
                    size="small"
                    startIcon={<ClearAll />}
                    disabled={disabled || permissionCount === 0}
                    sx={{ borderRadius: 2 }}
                >
                    Clear All
                </Button>
            </Stack>
        </Box>
    );
});

export default function RoleManager({
                                        data,
                                        setData,
                                        submit,
                                        permissions,
                                        edit,
                                        cancel,
                                        isReadOnly = false,
                                        isLoading = false
                                    }) {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(Object.keys(permissions)[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [originalData, setOriginalData] = useState({ ...data });
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

    const saveDisabled = useMemo(() => {
        return data.name === '' || isReadOnly || isLoading || !hasChanges;
    }, [data.name, isReadOnly, isLoading, hasChanges]);

    // Keep track of whether there are unsaved changes
    useEffect(() => {
        if (
            data.name !== originalData.name ||
            JSON.stringify(data.permissions) !== JSON.stringify(originalData.permissions)
        ) {
            setHasChanges(true);
            setShowUnsavedAlert(true);
            const timer = setTimeout(() => setShowUnsavedAlert(false), 3000);
            return () => clearTimeout(timer);
        } else {
            setHasChanges(false);
        }
    }, [data, originalData]);

    // When editing an existing role, save the original data for comparison
    useEffect(() => {
        if (edit) {
            setOriginalData({ ...data });
        }
    }, [edit]);

    const permissionCount = useMemo(() => {
        return data.permissions?.length || 0;
    }, [data.permissions]);

    const handleSelectAllPermissions = useCallback(() => {
        const allPermissions = [];

        // Helper function to collect all permission IDs
        const collectPermissionIds = (permObj) => {
            if (permObj.id) {
                allPermissions.push(permObj.id);
            }

            if (permObj.children) {
                Object.values(permObj.children).forEach(child => {
                    collectPermissionIds(child);
                });
            }
        };

        // Collect all permission IDs from all tabs
        Object.values(permissions).forEach(permissionCategory => {
            collectPermissionIds(permissionCategory);
        });

        setData(prevState => ({
            ...prevState,
            permissions: [...new Set(allPermissions)] // Remove duplicates
        }));
    }, [permissions, setData]);

    const handleClearAllPermissions = useCallback(() => {
        setData(prevState => ({
            ...prevState,
            permissions: []
        }));
    }, [setData]);

    const handlePermissionsChanged = useCallback((e) => {
        const permissionId = Number(e.target.value);
        setData(prevState => {
            const updatedPermissions = [...prevState.permissions];
            if (e.target.checked) {
                if (!updatedPermissions.includes(permissionId)) {
                    updatedPermissions.push(permissionId);
                }
            } else {
                const index = updatedPermissions.findIndex(p => p === permissionId);
                if (index > -1) {
                    updatedPermissions.splice(index, 1);
                }
            }

            return { ...prevState, permissions: updatedPermissions };
        });
    }, [setData]);

    const handleTabChange = useCallback((event, newValue) => {
        setActiveTab(newValue);
    }, []);

    const handleNameChanged = useCallback((e) => {
        const { name, value } = e.target;
        setData(prevState => ({ ...prevState, [name]: value }));
    }, [setData]);

    const handleSubmit = useCallback(() => {
        setOriginalData({ ...data });
        setHasChanges(false);
        submit();
    }, [data, submit]);

    return (
        <Paper
            elevation={2}
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    bgcolor: theme.palette.primary.main,
                    p: { xs: 2, md: 3 },
                    color: 'white',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <EditOutlined />
                    <Typography variant="h5">{`${edit ? "Edit" : "Add New"} Role`}</Typography>
                </Stack>

                <Stack direction="row" spacing={2} alignItems="center">
                    {isReadOnly && (
                        <Chip
                            label="Read Only"
                            color="default"
                            size="small"
                        />
                    )}

                    {data.permissions?.length > 0 && (
                        <Badge
                            badgeContent={permissionCount}
                            color="secondary"
                            overlap="circular"
                            max={999}
                        >
                            <Chip
                                label={`Permission${permissionCount > 1 ? 's' : ''}`}
                                color="secondary"
                                sx={{ '& .MuiChip-label': { pl: permissionCount > 0 ? 2 : 1 } }}
                            />
                        </Badge>
                    )}
                </Stack>
            </Box>

            {/* Unsaved changes alert */}
            <Fade in={showUnsavedAlert && hasChanges}>
                <Alert
                    severity="info"
                    variant="filled"
                    icon={<InfoOutlined />}
                    sx={{ borderRadius: 0 }}
                >
                    You have unsaved changes
                </Alert>
            </Fade>

            <Container sx={{ p: { xs: 2, md: 3 } }}>
                {/* Role Basic Info */}
                <Grid container spacing={3}>
                    <Grid size={{xs:12,md:6}}>
                        <TextField
                            value={data.name}
                            name="name"
                            label="Role Title"
                            onChange={handleNameChanged}
                            fullWidth
                            variant="outlined"
                            placeholder="Enter role title"
                            required
                            disabled={isReadOnly || isLoading}
                            helperText={data.name === '' ? "Role title is required" : "This title will be displayed across the system"}
                            slotProps={{
                                input:{sx: { borderRadius: 2 }}
                            }}
                        />
                    </Grid>

                    <Grid size={{xs:12,md:6}}>
                        <TextField
                            value={data.description || ''}
                            name="description"
                            label="Role Description"
                            onChange={handleNameChanged}
                            fullWidth
                            variant="outlined"
                            placeholder="Enter role description (optional)"
                            disabled={isReadOnly || isLoading}
                            helperText="Provide a short description of this role's purpose"
                            slotProps={{
                                input:{sx: { borderRadius: 2 }}
                            }}
                        />
                    </Grid>
                </Grid>

                {/* Permissions Section */}
                <Box
                    sx={{
                        mt: 5,
                        mb: 3,
                        p: { xs: 2, md: 3 },
                        bgcolor: alpha(theme.palette.background.default, 0.5),
                        borderRadius: 3,
                        border: `1px solid ${theme.palette.divider}`
                    }}
                >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                        <Typography variant="h6">Role Permissions</Typography>
                        <Tooltip title="Select the permissions this role should have">
                            <Help fontSize="small" color="action" />
                        </Tooltip>
                    </Stack>

                    {/* Permission actions (search, select all, clear all) */}
                    <PermissionActions
                        onSelectAll={handleSelectAllPermissions}
                        onClearAll={handleClearAllPermissions}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        permissionCount={permissionCount}
                        disabled={isReadOnly || isLoading}
                    />

                    <TabContext value={activeTab}>
                        <Box
                            sx={{
                                borderRadius: 2,
                                bgcolor: theme.palette.background.paper,
                                mb: 2
                            }}
                        >
                            <TabList
                                onChange={handleTabChange}
                                aria-label="permissions tabs"
                                variant="scrollable"
                                scrollButtons="auto"
                                sx={{
                                    '& .MuiTabs-indicator': {
                                        height: 3,
                                        borderRadius: '3px 3px 0 0'
                                    }
                                }}
                            >
                                {Object.keys(permissions).map(item => (
                                    <Tab
                                        label={item}
                                        key={item}
                                        value={item}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            px: 3
                                        }}
                                    />
                                ))}
                            </TabList>
                        </Box>

                        {Object.keys(permissions).map(item => (
                            <TabPanel
                                value={item}
                                key={item}
                                sx={{ width: '100%', p: 0 }}
                            >
                                <PermissionChildren
                                    permissions={{ [item]: permissions[item] }}
                                    onChange={handlePermissionsChanged}
                                    data={data}
                                    level={0}
                                    id="start"
                                    searchTerm={searchTerm}
                                    disabled={isReadOnly || isLoading}
                                />
                            </TabPanel>
                        ))}
                    </TabContext>
                </Box>

                {/* Action Buttons */}
                <Box
                    sx={{
                        mt: 5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 2,
                        borderTop: `1px solid ${theme.palette.divider}`,
                        pt: 3
                    }}
                >
                    <Button
                        onClick={cancel}
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        sx={{ borderRadius: 2, px: 3 }}
                        disabled={isLoading}
                    >
                        Back
                    </Button>

                    <Stack direction="row" spacing={2}>
                        {hasChanges && (
                            <Button
                                variant="outlined"
                                color="secondary"
                                onClick={() => setData({ ...originalData })}
                                sx={{ borderRadius: 2 }}
                                disabled={isReadOnly || isLoading}
                            >
                                Discard Changes
                            </Button>
                        )}
                        <Button
                            variant="contained"
                            onClick={handleSubmit}
                            disabled={saveDisabled}
                            startIcon={<SaveOutlined />}
                            sx={{
                                borderRadius: 2,
                                px: 4,
                                position: 'relative'
                            }}
                        >
                            {isLoading ? "Saving..." : edit ? "Save Changes" : "Create Role"}
                        </Button>
                    </Stack>
                </Box>
            </Container>
        </Paper>
    );
}
