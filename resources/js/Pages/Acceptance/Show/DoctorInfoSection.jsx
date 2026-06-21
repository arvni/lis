import { Accordion, AccordionDetails } from '@mui/material';
import AccordionSummary from '@mui/material/AccordionSummary';
import Grid from '@mui/material/Grid';
import { ExpandMore as ExpandMoreIcon, Person } from '@mui/icons-material';
import SectionTitle from './SectionTitle';
import InfoItem from './InfoItem';

const DoctorInfoSection = ({ acceptance, expanded, onChange }) => (
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
            aria-controls="doctor-information"
            id="doctor"
            sx={{
                backgroundColor: 'background.paper',
                borderRadius: '8px 8px 0 0',
            }}
        >
            <SectionTitle icon={Person} title="Doctor Information" />
        </AccordionSummary>
        <AccordionDetails sx={{ backgroundColor: 'background.default', p: 3 }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <InfoItem label="Name" value={acceptance.doctor?.name} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <InfoItem label="Expertise" value={acceptance.doctor?.expertise} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <InfoItem label="Phone" value={acceptance.doctor?.phone} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <InfoItem label="License No" value={acceptance.doctor?.licenseNo} />
                </Grid>
            </Grid>
        </AccordionDetails>
    </Accordion>
);

export default DoctorInfoSection;
