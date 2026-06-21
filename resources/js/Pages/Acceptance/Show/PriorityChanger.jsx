import React from 'react';
import { Box, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { router } from '@inertiajs/react';
import { PRIORITY_CONFIG } from './constants';

const PriorityChanger = ({ acceptance, canUpdatePriority }) => {
    const [, setOpen] = React.useState(false);
    const cfg = PRIORITY_CONFIG[acceptance.priority ?? 'routine'] ?? PRIORITY_CONFIG.routine;
    const Icon = cfg.icon;

    const handleChange = (e) => {
        router.patch(
            route('acceptances.updatePriority', acceptance.id),
            { priority: e.target.value },
            {
                preserveState: true,
                only: ['acceptance'],
            },
        );
        setOpen(false);
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
                icon={Icon ? <Icon fontSize="small" /> : undefined}
                label={cfg.label}
                color={cfg.color}
                variant="filled"
                sx={{ fontWeight: 'bold' }}
            />
            {canUpdatePriority && (
                <FormControl size="small" sx={{ minWidth: 110 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                        label="Priority"
                        value={acceptance.priority ?? 'routine'}
                        onChange={handleChange}
                    >
                        <MenuItem value="routine">Routine</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                        <MenuItem value="stat">STAT</MenuItem>
                    </Select>
                </FormControl>
            )}
        </Box>
    );
};

export default PriorityChanger;
