import React from 'react';
import { Avatar, Box, Card, Chip, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import {
    Folder as FolderIcon,
    Science as ScienceIcon,
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const HeaderCard = ({ sectionGroup, stats, isMobile, theme, onNavigateParent }) => (
    <Card
        elevation={3}
        sx={{
            p: { xs: 2, md: 3 },
            mb: 4,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: 'white',
            position: 'relative',
            overflow: 'visible',
        }}
    >
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 7 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {sectionGroup.parent && (
                        <Tooltip title="Back to parent group">
                            <IconButton
                                color="inherit"
                                sx={{
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                                }}
                                onClick={onNavigateParent}
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
                                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            }}
                        />
                    ) : (
                        <Avatar
                            sx={{
                                width: { xs: 48, md: 64 },
                                height: { xs: 48, md: 64 },
                                bgcolor: 'primary.light',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                            }}
                        >
                            <FolderIcon sx={{ fontSize: { xs: 28, md: 36 } }} />
                        </Avatar>
                    )}

                    <Box>
                        <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
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

            <Grid size={{ xs: 12, md: 5 }}>
                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        flexWrap: 'wrap',
                        justifyContent: { xs: 'flex-start', md: 'flex-end' },
                        mt: { xs: 2, md: 0 },
                    }}
                >
                    <Tooltip title="Total sub-groups" arrow>
                        <Chip
                            icon={<FolderIcon />}
                            label={`${stats.total.subGroups} Sub-groups`}
                            color="primary"
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.15)',
                                color: 'white',
                                borderColor: 'rgba(255,255,255,0.3)',
                                '& .MuiChip-icon': { color: 'white' },
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
                                '& .MuiChip-icon': { color: 'white' },
                            }}
                        />
                    </Tooltip>

                    {!sectionGroup.active && (
                        <Chip
                            label="Inactive Group"
                            color="error"
                            sx={{
                                fontWeight: 'bold',
                                bgcolor: theme.palette.error.dark,
                            }}
                        />
                    )}
                </Box>
            </Grid>
        </Grid>
    </Card>
);

export default HeaderCard;
