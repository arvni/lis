import { Box, Card, Chip, Stack, Switch, Tooltip, Typography, alpha, useTheme } from '@mui/material';
import { Check } from '@mui/icons-material';
import { memo, useCallback } from 'react';

// Memoized Permission component to prevent unnecessary re-renders
const Permission = memo(({ onChange, checked, permission, label, level, disabled = false }) => {
    const theme = useTheme();

    const handleChange = useCallback(
        (event) => {
            onChange(event);
        },
        [onChange],
    );

    return (
        <Tooltip
            title={
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        Permission ID: {permission.id}
                    </Typography>
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
                        : disabled
                          ? alpha(theme.palette.action.disabledBackground, 0.1)
                          : 'transparent',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.08)',
                        borderColor: disabled
                            ? theme.palette.divider
                            : checked
                              ? theme.palette.primary.main
                              : theme.palette.action.active,
                    },
                    opacity: disabled ? 0.7 : 1,
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 700 - level * 100,
                        fontSize: 20 - level,
                        color: checked
                            ? theme.palette.primary.main
                            : disabled
                              ? theme.palette.text.disabled
                              : 'text.primary',
                        mx: 1,
                    }}
                >
                    {label}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
Permission.displayName = 'Permission';

export default Permission;
