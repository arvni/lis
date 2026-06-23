import { useState } from 'react';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { Box, Button, ButtonGroup } from '@mui/material';
import { PERIODS } from './constants';

const PeriodBar = ({ nodeId, activePeriod, beginTime, endTime }) => {
    const [showCustom, setShowCustom] = useState(activePeriod === 'custom');
    const [begin, setBegin] = useState(beginTime ? dayjs.unix(beginTime) : null);
    const [end, setEnd] = useState(endTime ? dayjs.unix(endTime) : null);

    const navigate = (period) => {
        if (period === 'custom') {
            setShowCustom(true);
            return;
        }
        setShowCustom(false);
        const now = dayjs();
        const ranges = {
            today: [now.startOf('day'), now.endOf('day')],
            week: [now.startOf('week'), now.endOf('week')],
            month: [now.startOf('month'), now.endOf('month')],
            year: [now.startOf('year'), now.endOf('year')],
        };
        const [begin, end] = ranges[period] ?? ranges.today;
        router.visit(route('monitoring.nodes.show', nodeId), {
            data: { period, beginTime: begin.unix(), endTime: end.unix() },
        });
    };

    const applyCustom = () => {
        const params = { period: 'custom' };
        if (begin) params.beginTime = begin.unix();
        if (end) params.endTime = end.unix();
        router.visit(route('monitoring.nodes.show', nodeId), { data: params });
    };

    return (
        <Box sx={{ mb: 2 }}>
            <ButtonGroup size="small" variant="outlined" sx={{ mb: showCustom ? 1.5 : 0 }}>
                {PERIODS.map(({ key, label, icon }) => (
                    <Button
                        key={key}
                        startIcon={icon}
                        variant={activePeriod === key ? 'contained' : 'outlined'}
                        onClick={() => navigate(key)}
                    >
                        {label}
                    </Button>
                ))}
            </ButtonGroup>

            {showCustom && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box
                        sx={{
                            display: 'flex',
                            gap: 1.5,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            p: 1.5,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                        }}
                    >
                        <DateTimePicker
                            label="From"
                            value={begin}
                            onChange={setBegin}
                            maxDateTime={end ?? undefined}
                            slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
                        />
                        <DateTimePicker
                            label="To"
                            value={end}
                            onChange={setEnd}
                            minDateTime={begin ?? undefined}
                            slotProps={{ textField: { size: 'small', sx: { minWidth: 200 } } }}
                        />
                        <Button variant="contained" size="small" onClick={applyCustom}>
                            Apply
                        </Button>
                    </Box>
                </LocalizationProvider>
            )}
        </Box>
    );
};

export default PeriodBar;
