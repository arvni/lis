import { Box } from '@mui/material';
import Typography from '@mui/material/Typography';

// Styled Section Title component
const SectionTitle = ({ icon, title }) => {
    const Icon = icon;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Icon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography
                variant="h5"
                sx={{
                    fontWeight: 500,
                    color: 'text.primary',
                    letterSpacing: '0.02em',
                }}
            >
                {title}
            </Typography>
        </Box>
    );
};

export default SectionTitle;
