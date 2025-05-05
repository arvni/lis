import React from 'react';
import Grid from "@mui/material/Grid2";
import { Box, Typography, Chip, Paper, Divider } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import ScienceIcon from '@mui/icons-material/Science';

const TestDetails = ({ test }) => (
    <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, mb: 3 }}>
        <Grid container spacing={3}>
            <Grid item size={{ xs: 12 }}>
                <Typography variant="h6" fontWeight="medium" gutterBottom>
                    {test?.fullName}
                </Typography>
            </Grid>

            <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
                <Box display="flex" alignItems="center">
                    <CodeIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        Test Code
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {test?.code || 'N/A'}
                </Typography>
            </Grid>

            <Grid item size={{ xs: 12, sm: 6, md: 4 }}>
                <Box display="flex" alignItems="center">
                    <CategoryIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                        Category
                    </Typography>
                </Box>
                <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {test?.testGroup?.name || 'N/A'}
                </Typography>
            </Grid>

            {test?.type === '1' && (
                <Grid item size={{ xs: 12 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                        <ScienceIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            Acceptable Sample Types
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {test?.sampleTypes?.length > 0 ? (
                            test.sampleTypes.map((sampleType, index) => (
                                <Chip
                                    key={index}
                                    label={`${sampleType.sampleType.name}`}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    title={sampleType.description}
                                />
                            ))
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No sample types specified
                            </Typography>
                        )}
                    </Box>
                </Grid>
            )}

            {test?.description && (
                <Grid item size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Box display="flex" alignItems="center" mb={1}>
                        <DescriptionIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            Description
                        </Typography>
                    </Box>
                    <Box
                        sx={{
                            mt: 1,
                            '& p': { margin: 0 },
                            '& ul': { paddingLeft: 2, marginTop: 1, marginBottom: 1 }
                        }}
                    >
                        <div dangerouslySetInnerHTML={{ __html: test.description }} />
                    </Box>
                </Grid>
            )}
        </Grid>
    </Paper>
);

export default TestDetails;
