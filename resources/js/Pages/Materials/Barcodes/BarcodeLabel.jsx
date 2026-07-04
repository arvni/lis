import React from 'react';
import { Box, Stack, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { BarcodeItem, BarcodeText } from './styled';
import { formatDate } from './constants';

const BarcodeLabel = ({ material, printOnlyBarcode, fields, scale }) => (
    <Grid
        size={12}
        sx={{
            display: printOnlyBarcode ? 'block' : 'flex',
            justifyContent: 'center',
            gap: '0',
        }}
        className="page-break"
    >
        <BarcodeItem printOnlyBarcode={printOnlyBarcode}>
            {printOnlyBarcode ? (
                <Stack direction="column" sx={{ height: '100%', justifyContent: 'space-around' }}>
                    <BarcodeText printOnlyBarcode>{material.tube_series}</BarcodeText>
                    <Divider />
                    <BarcodeText printOnlyBarcode>
                        {formatDate(material.manufactured_date)}
                    </BarcodeText>
                    <Divider />
                    <BarcodeText printOnlyBarcode>{formatDate(material.expire_date)}</BarcodeText>
                </Stack>
            ) : (
                <>
                    {fields.barcodeImage && (
                        <Box
                            sx={{
                                width: '100%',
                                pt: '0mm',
                                display: 'flex',
                                '& svg ': { width: '100% !important' },
                            }}
                        >
                            <svg
                                id={`barcode-${material.barcode}`}
                                style={{ width: '100% !important' }}
                            ></svg>
                        </Box>
                    )}
                    <Stack spacing={0.5} sx={{ mt: '-3mm', zIndex: 1 }}>
                        {fields.barcodeNumber && (
                            <BarcodeText scale={scale}>{material.barcode}</BarcodeText>
                        )}
                        {fields.expireDate && (
                            <BarcodeText scale={scale}>
                                <Box
                                    component="span"
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        mr: 0.5,
                                    }}
                                >
                                    {formatDate(material.expire_date || material.created_at)}
                                </Box>
                            </BarcodeText>
                        )}
                        {fields.sampleType && (
                            <BarcodeText scale={scale} title={material.sample_type_name}>
                                {material.sample_type_name}
                            </BarcodeText>
                        )}
                        {fields.manufacturedDate && (
                            <BarcodeText scale={scale}>
                                {formatDate(material.manufactured_date)}
                            </BarcodeText>
                        )}
                        {fields.tubeSeries && (
                            <BarcodeText scale={scale}>{material.tube_series}</BarcodeText>
                        )}
                        {fields.packingSeries && (
                            <BarcodeText scale={scale}>{material.packing_series}</BarcodeText>
                        )}
                    </Stack>
                </>
            )}
        </BarcodeItem>
    </Grid>
);

export default BarcodeLabel;
