import { Link } from '@inertiajs/react';
import { Box, Grid, Paper, Stack, Typography, alpha, useTheme } from '@mui/material';

const SectionBreakdown = ({ summary }) => {
    const theme = useTheme();

    if (!(summary.by_section?.length > 0)) return null;

    return (
        <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                By Section
            </Typography>
            <Grid container spacing={1}>
                {summary.by_section.map((s) => (
                    <Grid key={s.section} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                        <Box
                            sx={{
                                p: 1.5,
                                borderRadius: 1.5,
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor:
                                    s.breached > 0
                                        ? alpha(theme.palette.error.main, 0.06)
                                        : 'background.paper',
                            }}
                        >
                            <Link
                                href={route('sections.show', s.section_id)}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <Typography
                                    variant="body2"
                                    fontWeight="medium"
                                    noWrap
                                    color="primary.main"
                                    sx={{ '&:hover': { textDecoration: 'underline' } }}
                                >
                                    {s.section}
                                </Typography>
                            </Link>
                            <Stack direction="row" spacing={1} mt={0.5}>
                                <Typography variant="caption" color="text.secondary">
                                    {s.count} active
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ·
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    avg {s.avg_elapsed}d elapsed
                                </Typography>
                                {s.breached > 0 && (
                                    <>
                                        <Typography variant="caption" color="text.secondary">
                                            ·
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="error.main"
                                            fontWeight="bold"
                                        >
                                            {s.breached} overdue
                                        </Typography>
                                    </>
                                )}
                            </Stack>
                        </Box>
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
};

export default SectionBreakdown;
