import { Accordion, AccordionDetails } from '@mui/material';
import AccordionSummary from '@mui/material/AccordionSummary';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import Typography from '@mui/material/Typography';
import React from 'react';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import LogisticsMap from '@/Components/LogisticsMap';

const ReferrerInfo = ({ referrer, defaultExpanded = true }) => {
    return (
        <Accordion defaultExpanded={defaultExpanded}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="referrer-information"
                id="referrer-information"
            >
                <Stack spacing={3} direction="row" sx={{ alignItems: 'center' }}>
                    <Typography variant="h5">Referrer Information</Typography>
                </Stack>
            </AccordionSummary>
            <AccordionDetails>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <strong>Name: </strong>
                        {referrer.name}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <strong>Phone: </strong>
                        {referrer.phoneNo}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <strong>Email: </strong>
                        {referrer.email}
                    </Grid>
                    <Grid size={12}>
                        <Divider>Billing Information</Divider>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <strong>Name: </strong>
                        {referrer.billingInfo?.name}
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <strong>Email: </strong>
                        {referrer.billingInfo?.email}
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <strong>Phone: </strong>
                        {referrer.billingInfo?.phone}
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <strong>VATIN: </strong>
                        {referrer.billingInfo?.vatIn}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <strong>City: </strong>
                        {referrer.billingInfo?.city}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <strong>Country: </strong>
                        {referrer.billingInfo?.country}
                    </Grid>
                    <Grid size={12}>
                        <strong>Address: </strong>
                        {referrer.billingInfo?.address}
                    </Grid>

                    <Grid size={12}>
                        <Divider>Logistic Information</Divider>
                    </Grid>

                    <Grid size={12}>
                        <strong>Address: </strong>
                        {referrer.logisticInfo?.address || 'N/A'}
                    </Grid>

                    {referrer.logisticInfo?.latitude && referrer.logisticInfo?.longitude && (
                        <>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <strong>Latitude: </strong>
                                {referrer.logisticInfo.latitude}
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <strong>Longitude: </strong>
                                {referrer.logisticInfo.longitude}
                            </Grid>
                            <Grid size={12}>
                                <LogisticsMap
                                    latitude={referrer.logisticInfo.latitude}
                                    longitude={referrer.logisticInfo.longitude}
                                    editable={false}
                                    height={400}
                                />
                            </Grid>
                        </>
                    )}
                </Grid>
            </AccordionDetails>
        </Accordion>
    );
};
export default ReferrerInfo;
