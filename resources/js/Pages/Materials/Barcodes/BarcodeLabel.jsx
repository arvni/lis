import React from 'react';
import { Box, Stack, Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import { BarcodeItem, BarcodeText } from './styled';
import { formatDate, FONT_SCALES, TEXT_FIELDS } from './constants';

// Render `count` copies of `node`, keyed by index. Used for the per-field stacked repeats.
const repeatNode = (count, render) => Array.from({ length: count }, (_, i) => render(i));

const BarcodeLabel = ({ material, printOnlyBarcode, fields }) => (
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
                    {fields.barcodeImage.show &&
                        repeatNode(fields.barcodeImage.repeat, (i) => (
                            <Box
                                key={i}
                                sx={{
                                    width: '100%',
                                    pt: '0mm',
                                    display: 'flex',
                                    '& svg ': { width: '100% !important' },
                                }}
                            >
                                <svg
                                    className="barcode-svg"
                                    data-barcode-value={material.barcode}
                                    style={{ width: '100% !important' }}
                                ></svg>
                            </Box>
                        ))}
                    <Stack spacing={0.5} sx={{ mt: '-3mm', zIndex: 1 }}>
                        {TEXT_FIELDS.map(({ key, getValue }) => {
                            const cfg = fields[key];
                            if (!cfg?.show) return null;
                            const scale = FONT_SCALES[cfg.size] ?? 1;
                            const value = getValue(material);
                            return repeatNode(cfg.repeat, (i) => (
                                <BarcodeText key={`${key}-${i}`} scale={scale} title={value}>
                                    {value}
                                </BarcodeText>
                            ));
                        })}
                    </Stack>
                </>
            )}
        </BarcodeItem>
    </Grid>
);

export default BarcodeLabel;
