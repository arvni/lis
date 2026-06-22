import React, { Suspense } from 'react';
import { Box, Typography, Divider, Paper, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DescriptionIcon from '@mui/icons-material/Description';

const FormAccordion = React.lazy(() => import('../FormAccordion'));
const PrescriptionSection = React.lazy(() => import('../PrescriptionSection'));

const sumItemPrices = (items = []) =>
    items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

const AcceptanceSummary = ({ data, needsConsultation, canAddPrescription, onEditStep }) => {
    const totalPrice =
        sumItemPrices(data.acceptanceItems?.tests) + sumItemPrices(data.acceptanceItems?.panels);

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h5" sx={{ mb: 3 }}>
                    Acceptance Summary
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        Patient Information
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                        <Typography variant="body1">
                            <strong>Name:</strong> {data.patient.fullName}
                        </Typography>
                        <Typography variant="body1">
                            <strong>ID/Passport:</strong> {data.patient.idNo}
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />
                {needsConsultation && (
                    <>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                                Consultation
                            </Typography>
                            <Box sx={{ pl: 2 }}>
                                <Typography variant="body1">
                                    <strong>Consultation Requested:</strong> Yes
                                </Typography>
                            </Box>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                    </>
                )}

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        Referral Information
                    </Typography>
                    <Box
                        sx={{
                            pl: 2,
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography variant="body1">
                                <strong>Referred:</strong> {data.referred ? 'Yes' : 'No'}
                            </Typography>
                            {data.referred && (
                                <>
                                    <Typography variant="body1">
                                        <strong>Referrer:</strong>{' '}
                                        {data.referrer ? data.referrer.name : 'N/A'}
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Reference Code:</strong>{' '}
                                        {data.referenceCode || 'N/A'}
                                    </Typography>
                                </>
                            )}
                        </Box>
                        <IconButton onClick={onEditStep(2)}>
                            <EditIcon />
                        </IconButton>
                    </Box>
                </Box>
                {data.doctor && data.doctor.name && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                            Doctor Information
                        </Typography>
                        <Box
                            sx={{
                                pl: 2,
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Box>
                                <Typography variant="body1">
                                    <strong>Name:</strong> {data.doctor.name}
                                </Typography>
                                {data.doctor.expertise && (
                                    <Typography variant="body1">
                                        <strong>Speciality:</strong> {data.doctor.expertise}
                                    </Typography>
                                )}
                                {data.doctor.phone && (
                                    <Typography variant="body1">
                                        <strong>Phone:</strong> {data.doctor.phone}
                                    </Typography>
                                )}
                                {data.doctor.licenseNo && (
                                    <Typography variant="body1">
                                        <strong>License:</strong> {data.doctor.licenseNo}
                                    </Typography>
                                )}
                            </Box>
                            <IconButton onClick={onEditStep(2)}>
                                <EditIcon />
                            </IconButton>
                        </Box>
                    </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        Sampling & Delivery
                    </Typography>
                    <Box
                        sx={{
                            pl: 2,
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography variant="body1">
                                <strong>Out Patient:</strong> {data.out_patient ? 'Yes' : 'No'}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Waiting for Pooling:</strong>{' '}
                                {data.waiting_for_pooling ? 'Yes' : 'No'}
                            </Typography>
                            {data.sampler && (
                                <Typography variant="body1">
                                    <strong>Sampler:</strong> {data.sampler.name}
                                </Typography>
                            )}
                            {!data.referred && (
                                <>
                                    {data?.howReport && (
                                        <Typography variant="body1">
                                            <strong>Report Method:</strong>{' '}
                                            {Object.keys(data?.howReport)
                                                .filter(
                                                    (method) =>
                                                        data.howReport[method] &&
                                                        [
                                                            'print',
                                                            'sms',
                                                            'whatsapp',
                                                            'sendToReferrer',
                                                        ].includes(method),
                                                )
                                                .map((method) => method.toUpperCase())
                                                .join(', ')}
                                        </Typography>
                                    )}
                                </>
                            )}
                            {data?.how_found_us && (
                                <Typography variant="body1">
                                    <strong>How Found Us:</strong> {data.how_found_us}
                                </Typography>
                            )}
                        </Box>
                        <IconButton onClick={onEditStep(4)}>
                            <EditIcon />
                        </IconButton>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        Tests & Panels
                    </Typography>
                    <Box
                        sx={{
                            pl: 2,
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography variant="body1">
                                <strong>Tests:</strong> {(data.acceptanceItems?.tests || []).length}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Panels:</strong>{' '}
                                {(data.acceptanceItems?.panels || []).length}
                            </Typography>
                            <Typography variant="body1" color="error">
                                <strong>Total Price:</strong> {totalPrice}
                            </Typography>
                        </Box>
                        <IconButton onClick={onEditStep(3)}>
                            <EditIcon />
                        </IconButton>
                    </Box>
                </Box>

                {canAddPrescription && data.prescription && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                                Prescription
                            </Typography>
                            <Box sx={{ pl: 2 }}>
                                <Typography variant="body1">
                                    <strong>Document:</strong> {data.prescription.originalName}
                                </Typography>
                            </Box>
                        </Box>
                    </>
                )}
            </Paper>

            {canAddPrescription && !data.prescription && (
                <FormAccordion
                    title="Prescription"
                    id="prescription-information"
                    defaultExpanded
                    icon={<DescriptionIcon />}
                >
                    <PrescriptionSection prescription={data.prescription} />
                </FormAccordion>
            )}
        </Suspense>
    );
};

export default AcceptanceSummary;
