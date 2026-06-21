import React from 'react';
import { router } from '@inertiajs/react';
import {
    Avatar,
    Badge,
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Chip,
    IconButton,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Folder as FolderIcon,
    MoreVert as MoreVertIcon,
    Visibility as VisibilityIcon,
} from '@mui/icons-material';

const SubGroupCard = ({ item, hoveredCard, theme, onMouseEnter, onMouseLeave, onMenuOpen }) => (
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
            cursor: 'pointer',
        }}
        onClick={() => router.visit(route('sectionGroups.show', item.id))}
        onMouseEnter={() => onMouseEnter(item.id)}
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
                        bgcolor: 'primary.light',
                        transition: 'all 0.3s ease',
                        transform: hoveredCard === item.id ? 'scale(1.1)' : 'scale(1)',
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
                    onClick={(e) => onMenuOpen(e, item, 'sectionGroup')}
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
);

export default SubGroupCard;
