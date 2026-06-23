import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button, ButtonGroup, ListItemIcon, Menu, MenuItem } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SyncIcon from '@mui/icons-material/Sync';
import { PERIODS } from './constants';

const FetchButton = ({ nodeId }) => {
    const [anchor, setAnchor] = useState(null);

    const fetch = (period) => {
        setAnchor(null);
        router.post(route('monitoring.nodes.fetch', nodeId), { period });
    };

    return (
        <>
            <ButtonGroup variant="contained" size="small">
                <Button startIcon={<SyncIcon />} onClick={() => fetch('today')}>
                    Fetch Now
                </Button>
                <Button
                    size="small"
                    sx={{ px: 0.5, minWidth: 28 }}
                    onClick={(e) => setAnchor(e.currentTarget)}
                >
                    <ArrowDropDownIcon fontSize="small" />
                </Button>
            </ButtonGroup>

            <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
                {PERIODS.filter((p) => p.key !== 'custom').map(({ key, label, icon }) => (
                    <MenuItem key={key} onClick={() => fetch(key)} dense>
                        <ListItemIcon>{icon}</ListItemIcon>
                        {label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default FetchButton;
