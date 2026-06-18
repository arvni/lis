import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import PropTypes from 'prop-types';

const renderElement = (value, level) =>
    function renderItem(key, _index) {
        level += 1;
        if (typeof value[key] != 'object')
            return (
                <Grid size={12} display="flex" gap={2} sx={{ alignItems: 'center' }}>
                    <Typography align="left" variant="h6">
                        {key}
                    </Typography>
                    <Typography align="right">{value[key]}</Typography>
                </Grid>
            );
        return <DashboardCard title={key} value={value[key]} level={level} />;
    };
const DashboardCard = ({ title, value, level = 0 }) => {
    level += 1;
    return (
        <Grid size={level == 1 ? 6 : 12} padding={2}>
            <Paper sx={{ p: '1em', height: '100%' }}>
                <Divider>
                    <Typography variant={'h' + (level + 3)}>{title}</Typography>
                </Divider>
                <Grid container spacing={2}>
                    {Object.keys(value).map(renderElement(value, level))}
                </Grid>
            </Paper>
        </Grid>
    );
};
DashboardCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.object.isRequired,
    level: PropTypes.number,
};

export default DashboardCard;
