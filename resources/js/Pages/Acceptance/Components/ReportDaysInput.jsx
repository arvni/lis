import {Box, TextField, Typography} from '@mui/material';
import {useState} from 'react';

const ReportDaysInput = ({initialDays = 5}) => {
    const [reportDays, setReportDays] = useState(initialDays);

    const handleChange = (event) => {
        const value = Math.max(1, parseInt(event.target.value) || 1);
        setReportDays(value);
    };

    return (
        <Typography variant="body1" component="p">
            The report will be available in{' '}
            <Box
                component="span"
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    mx: 0.5
                }}
            >
                <TextField
                    className="hidden-print"
                    type="number"
                    value={reportDays}
                    onChange={handleChange}
                    slotProps={{
                        input: {
                            min: 1,
                            max: 365,
                            'aria-label': 'Number of business days until report is available'
                        }
                    }}
                    sx={{
                        width: '80px',
                        '& .MuiInputBase-root': {
                            height: '32px',
                            fontSize: 'inherit',
                            fontWeight: 'bold',
                            color: 'primary.main',
                        },
                        '& .MuiInputBase-input': {
                            textAlign: 'center',
                            padding: '4px 8px',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                            borderWidth: '2px',
                        },
                        '& .MuiInputBase-root:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.dark',
                        },
                        '& .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                        }
                    }}
                />
                <span className="show-print" style={{display:"none"}}>{reportDays}</span>
            </Box>

            {' '}business day{reportDays !== 1 ? 's' : ''}.
        </Typography>
    );
};
export default ReportDaysInput;
