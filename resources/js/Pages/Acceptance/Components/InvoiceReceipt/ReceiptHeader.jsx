import { Box, Typography } from '@mui/material';
import { InvoiceHeader } from './styled';
import { formatDate } from './helpers';

const ReceiptHeader = ({ acceptance, showLogo }) => (
    <InvoiceHeader>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {showLogo && (
                <>
                    <Box
                        component="img"
                        src="https://biongenetic.com/wp-content/uploads/2021/11/mmclogo-1.png"
                        sx={{ height: '20px', marginRight: 1 }}
                        alt="Company Logo"
                    />

                    <Box>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: 'bold',
                                color: 'primary.main',
                                fontSize: '0.85rem',
                            }}
                        >
                            Muscat Medical Center
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.6rem' }}
                        >
                            Healthcare Excellence
                        </Typography>
                    </Box>
                </>
            )}
        </Box>

        <Box sx={{ textAlign: 'right' }}>
            <Typography variant="subtitle2" sx={{ color: 'secondary.main', fontSize: '0.75rem' }}>
                Receipt #{acceptance?.id || ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                Date: {formatDate(acceptance?.created_at)}
            </Typography>
        </Box>
    </InvoiceHeader>
);

export default ReceiptHeader;
