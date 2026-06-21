import { memo } from 'react';
import { Alert } from '@mui/material';

// File Error Alert Component
const FileErrorAlert = memo(({ errors, generalError, externalHelperText, onClear }) => {
    if (!errors.length && !generalError && !externalHelperText) return null;

    return (
        <Alert severity="error" sx={{ mt: 1 }} onClose={onClear}>
            {externalHelperText && <p>{externalHelperText}</p>}
            {generalError && <p>{generalError}</p>}
            {errors.length > 0 && (
                <ul>
                    {errors.map((err, i) => (
                        <li key={i}>{err.message}</li>
                    ))}
                </ul>
            )}
        </Alert>
    );
});

FileErrorAlert.displayName = 'FileErrorAlert';

export default FileErrorAlert;
