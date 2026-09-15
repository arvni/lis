import { Box } from '@mui/material';
import { BRAND } from './company';

// Scanned signature and stamp images have white grounds; multiply lets them overlap.
const image = {
    position: 'absolute',
    left: '50%',
    maxWidth: '100%',
    objectFit: 'contain',
    mixBlendMode: 'multiply',
};

// The signer chosen when the PO was issued: their signature over their stamp. Until a
// signer is chosen the space is left to sign by hand.
const SignatoryBlock = ({ signer }) => (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: '10mm', breakInside: 'avoid' }}>
        <Box sx={{ width: '72mm', textAlign: 'center' }}>
            <Box sx={{ position: 'relative', height: '32mm' }}>
                {signer?.stamp && (
                    <Box
                        component="img"
                        src={signer.stamp}
                        alt={`Stamp of ${signer.name}`}
                        sx={{
                            ...image,
                            top: '50%',
                            height: '30mm',
                            transform: 'translate(-50%, -50%) rotate(-8deg)',
                            opacity: 0.9,
                        }}
                    />
                )}
                {signer?.signature && (
                    <Box
                        component="img"
                        src={signer.signature}
                        alt={`Signature of ${signer.name}`}
                        sx={{
                            ...image,
                            bottom: '1mm',
                            height: '20mm',
                            transform: 'translateX(-50%)',
                        }}
                    />
                )}
            </Box>
            <Box sx={{ pt: '1.5mm', borderTop: `1px solid ${BRAND.ink}` }}>
                <Box sx={{ minHeight: '4mm', fontSize: '9.5pt', fontWeight: 700 }}>
                    {signer?.name}
                </Box>
                {signer?.title && (
                    <Box sx={{ fontSize: '8pt', color: BRAND.muted }}>{signer.title}</Box>
                )}
            </Box>
        </Box>
    </Box>
);

export default SignatoryBlock;
