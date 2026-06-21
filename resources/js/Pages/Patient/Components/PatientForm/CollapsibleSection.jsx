import { Box, Button, Collapse, Paper, Typography } from '@mui/material';
import { ArrowDropDown, ArrowDropUp } from '@mui/icons-material';

// Reusable foldable section: a header button that toggles a collapsing body.
const CollapsibleSection = ({ icon, title, expanded, onToggle, children }) => (
    <Paper
        elevation={1}
        sx={{
            mb: 3,
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
        }}
    >
        <Button
            fullWidth
            onClick={onToggle}
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                textAlign: 'left',
                py: 1.5,
                px: 2,
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                '&:hover': {
                    bgcolor: 'primary.main',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {icon}
                <Typography variant="subtitle1" fontWeight="bold">
                    {title}
                </Typography>
            </Box>
            {expanded ? <ArrowDropUp /> : <ArrowDropDown />}
        </Button>

        <Collapse in={expanded}>
            <Box sx={{ p: 3 }}>{children}</Box>
        </Collapse>
    </Paper>
);

export default CollapsibleSection;
