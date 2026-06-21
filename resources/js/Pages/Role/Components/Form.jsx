import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import {
    Alert,
    Badge,
    Box,
    Chip,
    Fade,
    Paper,
    Stack,
    Tab,
    Tooltip,
    alpha,
    useTheme,
} from '@mui/material';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import {
    ArrowBack,
    EditOutlined,
    Help,
    InfoOutlined,
    SaveOutlined,
} from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { PermissionChildren } from './Form/PermissionTree';
import PermissionActions from './Form/PermissionActions';

export default function RoleManager({
    data,
    setData,
    submit,
    permissions,
    edit,
    cancel,
    isReadOnly = false,
    isLoading = false,
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
        // Snapshot once when entering edit mode; depending on `data` would
        // re-snapshot on every change and defeat the change-detection effect above.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                Object.values(permObj.children).forEach((child) => {
                    collectPermissionIds(child);
                });
            }
        };

        // Collect all permission IDs from all tabs
        Object.values(permissions).forEach((permissionCategory) => {
            collectPermissionIds(permissionCategory);
        });

        setData((prevState) => ({
            ...prevState,
            permissions: [...new Set(allPermissions)], // Remove duplicates
        }));
    }, [permissions, setData]);

    const handleClearAllPermissions = useCallback(() => {
        setData((prevState) => ({
            ...prevState,
            permissions: [],
        }));
    }, [setData]);

    const handlePermissionsChanged = useCallback(
        (e) => {
            const permissionId = Number(e.target.value);
            setData((prevState) => {
                const updatedPermissions = [...prevState.permissions];
                if (e.target.checked) {
                    if (!updatedPermissions.includes(permissionId)) {
                        updatedPermissions.push(permissionId);
                    }
                } else {
                    const index = updatedPermissions.findIndex((p) => p === permissionId);
                    if (index > -1) {
                        updatedPermissions.splice(index, 1);
                    }
                }

                return { ...prevState, permissions: updatedPermissions };
            });
        },
        [setData],
    );

    const handleTabChange = useCallback((event, newValue) => {
        setActiveTab(newValue);
    }, []);

    const handleNameChanged = useCallback(
        (e) => {
            const { name, value } = e.target;
            setData((prevState) => ({ ...prevState, [name]: value }));
        },
        [setData],
    );

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
                position: 'relative',
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
                    alignItems: 'center',
                }}
            >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <EditOutlined />
                    <Typography variant="h5">{`${edit ? 'Edit' : 'Add New'} Role`}</Typography>
                </Stack>

                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    {isReadOnly && <Chip label="Read Only" color="default" size="small" />}

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
                    <Grid size={{ xs: 12, md: 6 }}>
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
                            helperText={
                                data.name === ''
                                    ? 'Role title is required'
                                    : 'This title will be displayed across the system'
                            }
                            slotProps={{
                                input: { sx: { borderRadius: 2 } },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
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
                                input: { sx: { borderRadius: 2 } },
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
                        border: `1px solid ${theme.palette.divider}`,
                    }}
                >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
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
                                mb: 2,
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
                                        borderRadius: '3px 3px 0 0',
                                    },
                                }}
                            >
                                {Object.keys(permissions).map((item) => (
                                    <Tab
                                        label={item}
                                        key={item}
                                        value={item}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            px: 3,
                                        }}
                                    />
                                ))}
                            </TabList>
                        </Box>

                        {Object.keys(permissions).map((item) => (
                            <TabPanel value={item} key={item} sx={{ width: '100%', p: 0 }}>
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
                        pt: 3,
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
                                position: 'relative',
                            }}
                        >
                            {isLoading ? 'Saving...' : edit ? 'Save Changes' : 'Create Role'}
                        </Button>
                    </Stack>
                </Box>
            </Container>
        </Paper>
    );
}
