import { Box, Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import { Link } from '@inertiajs/react';
import { Print, PlaylistAddCheck, Science } from '@mui/icons-material';
import { BarcodeIcon } from 'lucide-react';

const QuickActions = ({ acceptance, canEdit, canPrintBarcode }) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
        <Tooltip title="Print Receipt">
            <Button
                variant="outlined"
                startIcon={<Print />}
                href={route('acceptances.print', acceptance.id)}
                component={Link}
            >
                Print Receipt
            </Button>
        </Tooltip>
        {canEdit && (
            <Tooltip title="Edit Acceptance">
                <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<PlaylistAddCheck />}
                    href={route('acceptances.edit', acceptance.id)}
                >
                    Edit
                </Button>
            </Tooltip>
        )}
        {canPrintBarcode && (
            <Tooltip title="Print Barcodes">
                <Button
                    variant="outlined"
                    color="info"
                    target="_blank"
                    startIcon={<BarcodeIcon />}
                    href={route('acceptances.barcodes', acceptance.id)}
                >
                    Print Barcodes
                </Button>
            </Tooltip>
        )}
        <Tooltip title="Print Samples Sheet">
            <Button
                variant="outlined"
                color="success"
                startIcon={<Science />}
                href={route('acceptances.printSamples', acceptance.id)}
                component={Link}
            >
                Print Samples
            </Button>
        </Tooltip>
    </Box>
);

export default QuickActions;
