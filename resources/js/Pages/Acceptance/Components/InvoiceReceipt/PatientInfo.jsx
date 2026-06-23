import { Grid, Typography } from '@mui/material';
import { Person } from '@mui/icons-material';
import { SectionHeading, InfoItem } from './styled';

const PatientInfo = ({ acceptance }) => (
    <>
        <SectionHeading>
            <Person sx={{ mr: 0.5, fontSize: '0.75rem' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                Patient Information
            </Typography>
        </SectionHeading>

        <Grid container spacing={1} sx={{ mb: 1 }}>
            <Grid size={{ xs: 8 }}>
                <InfoItem
                    label="Full Name"
                    value={acceptance?.patient?.fullName}
                    icon={<Person fontSize="small" />}
                />
                <InfoItem label="ID/Passport" value={acceptance?.patient?.idNo} />
            </Grid>
            <Grid size={{ xs: 4 }}>
                <InfoItem
                    label="Age/Gender"
                    value={`${acceptance?.patient?.age || ''} / ${
                        acceptance?.patient?.gender
                            ? acceptance.patient.gender.charAt(0).toUpperCase()
                            : ''
                    }`}
                />
                <InfoItem
                    label="Report Via"
                    value={Object.keys(acceptance?.howReport || {}).filter(
                        (item) =>
                            ['print', 'sms', 'whatsapp', 'sendToReferrer'].includes(item) &&
                            Boolean(acceptance.howReport[item]),
                    )}
                />
            </Grid>
        </Grid>
    </>
);

export default PatientInfo;
