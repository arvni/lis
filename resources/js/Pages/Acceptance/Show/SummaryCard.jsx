import { Box, Card, CardContent } from '@mui/material';
import Typography from '@mui/material/Typography';

// Summary Card for displaying summary information
const SummaryCard = ({ title, value, icon, color = 'primary' }) => {
    const Icon = icon;
    return (
        <Card
            elevation={2}
            sx={{
                height: '100%',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 4,
                },
            }}
        >
            <CardContent>
                <Box display="flex" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="text.secondary" variant="subtitle1" fontWeight="medium">
                        {title}
                    </Typography>
                    <Icon sx={{ color: `${color}.main` }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 2, color: `${color}.main` }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default SummaryCard;
