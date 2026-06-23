import { Alert, Chip, Divider, Grid, Paper, Typography } from '@mui/material';
import { BiotechOutlined } from '@mui/icons-material';
import TubesTableView from './TubesTableView';
import TubeCard from './TubeCard';

const TubeDetailsSection = ({ tubesList, errors, onTubeChange, onDeleteTube }) => (
    <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: '10px', border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <BiotechOutlined sx={{ mr: 1 }} />
            Tube Details
            <Chip
                label={`${tubesList.length} tube${tubesList.length > 1 ? 's' : ''}`}
                size="small"
                color="primary"
                sx={{ ml: 1 }}
            />
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {tubesList.length > 5 ? (
            <TubesTableView
                tubesList={tubesList}
                errors={errors}
                onTubeChange={onTubeChange}
                onDeleteTube={onDeleteTube}
            />
        ) : (
            <Grid container spacing={2}>
                {tubesList.map((tube, index) => (
                    <Grid size={{ xs: 12 }} key={index}>
                        <TubeCard
                            tube={tube}
                            index={index}
                            canDelete={tubesList.length > 1}
                            errors={errors}
                            onTubeChange={onTubeChange}
                            onDeleteTube={onDeleteTube}
                        />
                    </Grid>
                ))}
            </Grid>
        )}

        {errors?.tubes && (
            <Alert severity="error" sx={{ mt: 2 }}>
                {errors.tubes}
            </Alert>
        )}
    </Paper>
);

export default TubeDetailsSection;
