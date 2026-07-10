import { Chip, Paper, Typography, useTheme } from '@mui/material';
import { Link } from '@inertiajs/react';
import { workflowStatus } from '../constants.jsx';

/** Desktop opposite-content card: section-name link + workflow status chip. */
const SectionCard = ({ acceptanceItemState, index }) => {
    const theme = useTheme();

    return (
        <Paper
            elevation={1}
            sx={{
                p: 2,
                backgroundColor: theme.palette.background.paper,
                borderRight: index % 2 === 0 ? `4px solid ${theme.palette.primary.main}` : 'none',
                borderLeft: index % 2 !== 0 ? `4px solid ${theme.palette.primary.main}` : 'none',
                borderRadius: 2,
                transition: 'all 0.3s',
                '&:hover': {
                    boxShadow: theme.shadows[4],
                    transform: 'translateY(-3px)',
                },
            }}
        >
            <Typography
                variant="h6"
                href={route('sections.show', acceptanceItemState.section.id)}
                component={Link}
                fontWeight="bold"
                gutterBottom
                sx={{ textDecoration: 'none', color: 'inherit' }}
            >
                {acceptanceItemState.section.name}
            </Typography>

            <Chip
                icon={workflowStatus[acceptanceItemState.status].icon}
                label={workflowStatus[acceptanceItemState.status].label}
                size="small"
                color={workflowStatus[acceptanceItemState.status].color}
                sx={{ fontWeight: 'medium', mt: 0.5 }}
            />
        </Paper>
    );
};

export default SectionCard;
