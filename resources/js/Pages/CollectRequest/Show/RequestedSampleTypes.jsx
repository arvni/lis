import { Box, Card, CardContent, Chip, Typography } from '@mui/material';

/**
 * A standalone request is raised without any order, so the sample types the
 * provider declared are the only description of what is being picked up.
 */
const RequestedSampleTypes = ({ sampleTypes = [] }) => (
    <Card variant="outlined">
        <CardContent>
            <Typography variant="subtitle2" color="primary" gutterBottom>
                Requested Sample Types
            </Typography>

            {sampleTypes.length > 0 ? (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {sampleTypes.map((sampleType, index) => (
                        <Chip
                            key={sampleType?.server_id ?? sampleType?.id ?? index}
                            label={sampleType?.name ?? sampleType}
                            color="primary"
                            variant="outlined"
                        />
                    ))}
                </Box>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    The provider did not list any sample type.
                </Typography>
            )}
        </CardContent>
    </Card>
);

export default RequestedSampleTypes;
