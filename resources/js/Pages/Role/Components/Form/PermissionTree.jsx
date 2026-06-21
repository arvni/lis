import Grid from '@mui/material/Grid';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    Stack,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';
import { ExpandMore, Settings } from '@mui/icons-material';
import { memo, useMemo } from 'react';
import Permission from './Permission';

// Separate component for permission group to improve code organization
export const PermissionGroup = memo(
    ({ permission, label, onChange, data, level = 0, searchTerm = '', disabled = false }) => {
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
                return Object.keys(permission.children).some((childKey) => {
                    const child = permission.children[childKey];
                    if (childKey.toLowerCase().includes(lowerSearchTerm)) return true;
                    if (child.children) {
                        return Object.keys(child.children).some((subChildKey) =>
                            subChildKey.toLowerCase().includes(lowerSearchTerm),
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
            Object.keys(permission.children).forEach((childKey) => {
                const child = permission.children[childKey];
                if (child.id && data.permissions.includes(child.id)) {
                    count++;
                }

                if (child.children) {
                    Object.keys(child.children).forEach((subChildKey) => {
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
                                : alpha(theme.palette.action.hover, 0.08),
                        },
                    }}
                >
                    <Stack direction="row" spacing={2} width="100%" sx={{ alignItems: 'center' }}>
                        <Settings fontSize="small" color={hasPermission ? 'primary' : 'action'} />
                        <Typography
                            variant={variant}
                            color={hasPermission ? 'primary' : 'textPrimary'}
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
    },
);
PermissionGroup.displayName = 'PermissionGroup';

// Separate component for permission children to improve code organization
export const PermissionChildren = memo(
    ({ permissions, onChange, data, level, id = null, searchTerm = '', disabled = false }) => {
        const { hasChildrenPermission, singlePermission } = useMemo(() => {
            const hasChildren = [];
            const single = [];

            Object.keys(permissions).forEach((item) => {
                if (Object.keys(permissions[item]).includes('children')) {
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
            return singlePermission.filter((item) => item.toLowerCase().includes(lowerSearchTerm));
        }, [singlePermission, searchTerm]);

        // If nothing matches the search term and there are no matching child groups, don't render
        if (
            searchTerm &&
            filteredSinglePermissions.length === 0 &&
            hasChildrenPermission.length === 0
        ) {
            return null;
        }

        return (
            <Grid container spacing={2} key={`${id}-${level}`}>
                {filteredSinglePermissions.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: 'repeat(2, 1fr)',
                                    md: 'repeat(3, 1fr)',
                                },
                                gap: 2,
                            }}
                        >
                            {filteredSinglePermissions.map((item) => (
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

                <Grid size={{ xs: 12 }}>
                    {hasChildrenPermission.map((item) => (
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
    },
);
PermissionChildren.displayName = 'PermissionChildren';
