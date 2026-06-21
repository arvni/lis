import React from 'react';
import { Avatar, Box, Divider, Fade, Grid, Paper, Typography } from '@mui/material';
import { Folder as FolderIcon, Science as ScienceIcon } from '@mui/icons-material';
import SummaryStats from './SummaryStats';
import SubGroupCard from './SubGroupCard';
import SectionCard from './SectionCard';

const SectionHeading = ({ icon, label, color }) => (
    <>
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
            }}
        >
            <Typography
                variant="h5"
                sx={{ display: 'flex', alignItems: 'center', color, fontWeight: 'medium' }}
            >
                {icon}
                {label}
            </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
    </>
);

const OverviewTab = ({
    sectionGroup,
    stats,
    theme,
    gridSize,
    hoveredCard,
    onCardMouseEnter,
    onCardMouseLeave,
    onMenuOpen,
}) => (
    <>
        <SummaryStats stats={stats} />

        {sectionGroup.children && sectionGroup.children.length > 0 && (
            <Box sx={{ mb: 5 }}>
                <SectionHeading
                    icon={<FolderIcon sx={{ mr: 1 }} />}
                    label="Sub-groups"
                    color={theme.palette.primary.main}
                />
                <Grid container spacing={3}>
                    {sectionGroup.children.map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: gridSize }} key={item.id}>
                            <SubGroupCard
                                item={item}
                                hoveredCard={hoveredCard}
                                theme={theme}
                                onMouseEnter={onCardMouseEnter}
                                onMouseLeave={onCardMouseLeave}
                                onMenuOpen={onMenuOpen}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        )}

        {sectionGroup.sections && sectionGroup.sections.length > 0 && (
            <Box sx={{ mb: 5 }}>
                <SectionHeading
                    icon={<ScienceIcon sx={{ mr: 1 }} />}
                    label="Sections"
                    color={theme.palette.secondary.main}
                />
                <Grid container spacing={3}>
                    {sectionGroup.sections.map((item) => (
                        <Grid size={{ xs: 12, sm: 6, md: gridSize }} key={item.id}>
                            <SectionCard
                                item={item}
                                hoveredCard={hoveredCard}
                                theme={theme}
                                onMouseEnter={onCardMouseEnter}
                                onMouseLeave={onCardMouseLeave}
                                onMenuOpen={onMenuOpen}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        )}

        {sectionGroup.children.length === 0 && sectionGroup.sections.length === 0 && (
            <Fade in={true} timeout={1000}>
                <Paper
                    elevation={2}
                    sx={{
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                    }}
                >
                    <Avatar
                        sx={{
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            mb: 2,
                            bgcolor: 'primary.light',
                        }}
                    >
                        <FolderIcon sx={{ fontSize: 40 }} />
                    </Avatar>

                    <Typography variant="h5" color="text.primary" gutterBottom>
                        No Sub-groups or Sections Yet
                    </Typography>

                    <Typography
                        variant="body1"
                        color="text.secondary"
                        sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
                    >
                        This section group is empty. You can add sub-groups or sections to organize
                        your content.
                    </Typography>
                </Paper>
            </Fade>
        )}
    </>
);

export default OverviewTab;
