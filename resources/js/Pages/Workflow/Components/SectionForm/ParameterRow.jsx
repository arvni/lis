import { alpha, Box, Chip, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { TYPE_COLOR } from './constants.js';

const ParameterRow = ({ param, index, isEditing, onEdit, onDelete }) => {
    const theme = useTheme();
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 1,
                borderRadius: 1,
                bgcolor: isEditing
                    ? alpha(theme.palette.primary.main, 0.06)
                    : alpha(theme.palette.action.hover, 0.4),
                border: '1px solid',
                borderColor: isEditing ? 'primary.main' : 'transparent',
                transition: 'all 0.15s ease',
            }}
        >
            <Chip
                label={param.type}
                size="small"
                color={TYPE_COLOR[param.type] ?? 'default'}
                sx={{ fontSize: '0.65rem', height: 20, flexShrink: 0 }}
            />
            <Typography variant="body2" fontWeight={500} sx={{ flex: 1, minWidth: 0 }} noWrap>
                {param.name}
            </Typography>
            {param.required && (
                <Chip
                    label="req"
                    size="small"
                    variant="outlined"
                    sx={{
                        fontSize: '0.6rem',
                        height: 18,
                        color: 'text.disabled',
                        borderColor: 'divider',
                    }}
                />
            )}
            <Tooltip title="Edit">
                <IconButton
                    size="small"
                    onClick={() => onEdit(index)}
                    sx={{ color: isEditing ? 'primary.main' : 'text.disabled' }}
                >
                    <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
                <IconButton
                    size="small"
                    onClick={() => onDelete(index)}
                    sx={{ '&:hover': { color: 'error.main' }, color: 'text.disabled' }}
                >
                    <DeleteIcon sx={{ fontSize: 15 }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default ParameterRow;
