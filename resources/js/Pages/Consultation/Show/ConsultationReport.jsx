import React from 'react';
import { Typography, Button, Box, Card, CardContent, CardHeader, IconButton, Tooltip } from '@mui/material';
import { Edit, Assignment, Print, Share } from '@mui/icons-material';
import Drawing from '@/Components/Drawing.jsx';

const ConsultationReport = ({ consultation, canEdit, onEdit }) => (
    <Box sx={{ mt: 2, width: '100%' }}>
        <Card elevation={1} sx={{ mb: 3, borderRadius: 2 }}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assignment color="primary" />
                        <Typography variant="h6">Consultation Report</Typography>
                    </Box>
                }
                action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Print Report">
                            <IconButton size="small" color="primary">
                                <Print />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Share Report">
                            <IconButton size="small" color="primary">
                                <Share />
                            </IconButton>
                        </Tooltip>
                    </Box>
                }
                sx={{ borderBottom: '1px solid #f0f0f0', pb: 1 }}
            />
            <CardContent>
                {consultation.information?.image && (
                    <Box
                        sx={{
                            mb: 2,
                            borderRadius: 2,
                            minHeight: '500px',
                            height: '100%',
                            width: '100%',
                            overflow: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {!consultation.information.image?.nodes ? (
                            <img
                                src={consultation.information.image}
                                alt="Consultation Image"
                                style={{
                                    width: '100%',
                                    maxHeight: '400px',
                                    objectFit: 'contain',
                                }}
                            />
                        ) : (
                            <Drawing disabled defaultValue={consultation.information.image} />
                        )}
                    </Box>
                )}
                <Box
                    sx={{
                        p: 2,
                        border: '1px solid #f0f0f0',
                        borderRadius: 2,
                        mb: 2,
                        minHeight: '100px',
                        backgroundColor: '#fafafa',
                    }}
                >
                    <div
                        dangerouslySetInnerHTML={{
                            __html:
                                consultation.information.report ||
                                'No report content available.',
                        }}
                    />
                </Box>

                {canEdit && (
                    <Button
                        onClick={onEdit}
                        variant="outlined"
                        color="primary"
                        startIcon={<Edit />}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                        }}
                    >
                        Edit Report
                    </Button>
                )}
            </CardContent>
        </Card>
    </Box>
);

export default ConsultationReport;
