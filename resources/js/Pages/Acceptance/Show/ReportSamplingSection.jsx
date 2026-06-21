import { Accordion, AccordionDetails, Box } from '@mui/material';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import {
    Check,
    Close,
    ExpandMore as ExpandMoreIcon,
    LocalHospital,
    Timeline,
} from '@mui/icons-material';
import SectionTitle from './SectionTitle';
import InfoItem from './InfoItem';
import { methodConfig } from './constants';

const ReportMethodItem = ({ icon: Icon, color = 'info', text }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Icon color={color} />
        <Typography variant="body2" sx={{ ml: 1 }}>
            {text}
        </Typography>
    </Box>
);

const ReportSamplingSection = ({ acceptance, expanded, onChange, activeReportMethods }) => (
    <Accordion
        expanded={expanded}
        onChange={onChange}
        sx={{
            mt: 2,
            borderRadius: 1,
            '&:before': { display: 'none' },
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
    >
        <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="report-sampling-information"
            id="report-sampling"
            sx={{
                backgroundColor: 'background.paper',
                borderRadius: '8px 8px 0 0',
            }}
        >
            <SectionTitle icon={Timeline} title="Report & Sampling" />
        </AccordionSummary>
        <AccordionDetails sx={{ backgroundColor: 'background.default', p: 3 }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <InfoItem
                        label="Out Patient"
                        valueComponent={
                            acceptance.out_patient ? (
                                <Check color="success" />
                            ) : (
                                <Close color="error" />
                            )
                        }
                    />
                </Grid>

                {acceptance?.sampler && (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                        <InfoItem
                            label="Sampler"
                            valueComponent={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                                        {acceptance?.sampler?.name}
                                    </Typography>
                                </Box>
                            }
                        />
                    </Grid>
                )}

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <InfoItem label="Acceptor" value={acceptance.acceptor?.name} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <InfoItem
                        label="Report Method"
                        valueComponent={
                            activeReportMethods.length > 0 ? (
                                activeReportMethods.map((method) => (
                                    <ReportMethodItem
                                        key={method}
                                        icon={methodConfig[method].icon}
                                        text={methodConfig[method].label}
                                    />
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No report method specified
                                </Typography>
                            )
                        }
                    />
                </Grid>
                {acceptance.referrer && (
                    <>
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <InfoItem
                                label="Referrer"
                                valueComponent={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <LocalHospital color="primary" fontSize="small" />
                                        <Typography variant="body2" sx={{ ml: 0.5 }}>
                                            {acceptance.referrer?.fullName ||
                                                acceptance.referrer?.name}
                                        </Typography>
                                    </Box>
                                }
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                            <InfoItem label="Reference No" value={acceptance.referenceCode} />
                        </Grid>
                    </>
                )}

                {acceptance.how_found_us && (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                        <InfoItem label="How Found Us" value={acceptance.how_found_us} />
                    </Grid>
                )}
            </Grid>
        </AccordionDetails>
    </Accordion>
);

export default ReportSamplingSection;
