import { Box, Button, Card, Grid as Grid, IconButton, Tooltip, Typography, useTheme } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import {
    Add as AddIcon,
    Refresh as RefreshIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';

const SectionHeader = ({ section, requestInputs, onAddSample, onRefresh }) => {
    const theme = useTheme();

    return (
        <Card
            elevation={2}
            sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: theme.palette.primary.contrastText,
            }}
        >
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {section.icon ? (
                            <Avatar src={section.icon} />
                        ) : (
                            <DashboardIcon fontSize="large" />
                        )}
                        <Box>
                            <Typography variant="h4" fontWeight="bold">
                                {section.name}
                            </Typography>
                            <Typography variant="subtitle1">{section.sectionGroup}</Typography>
                        </Box>
                    </Box>
                </Grid>

                <Grid
                    size={{ xs: 12, md: 6 }}
                    sx={{
                        display: 'flex',
                        justifyContent: { xs: 'flex-start', md: 'flex-end' },
                        gap: 1,
                    }}
                >
                    {/* Bulk buttons removed from here and moved to TableLayout headerActions below */}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={onAddSample}
                        color="secondary"
                        sx={{
                            borderRadius: 6,
                            px: 3,
                            py: 1,
                            boxShadow: theme.shadows[4],
                            '&:hover': {
                                boxShadow: theme.shadows[8],
                            },
                        }}
                    >
                        Add Sample
                    </Button>

                    <Tooltip title="Refresh Data">
                        <IconButton
                            onClick={() =>
                                onRefresh(
                                    1,
                                    requestInputs?.filters,
                                    requestInputs?.sort,
                                    requestInputs?.pageSize,
                                )
                            }
                            sx={{
                                ml: 2,
                                color: theme.palette.primary.contrastText,
                                border: `1px solid ${theme.palette.primary.contrastText}`,
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                },
                            }}
                        >
                            <RefreshIcon sx={{ color: 'white' }} />
                        </IconButton>
                    </Tooltip>
                </Grid>
            </Grid>
        </Card>
    );
};

export default SectionHeader;
