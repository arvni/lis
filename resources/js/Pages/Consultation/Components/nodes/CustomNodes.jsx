import React, { useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import {
    nodeSize,
    handleStyle,
    affectedMarkerSx,
    carrierMarkerSx,
    deceasedMarkerSx,
    probandMarkerSx,
    labelSx,
    getMaleNodeStyle,
    getFemaleNodeStyle,
    getUnknownNodeStyle,
    getUnknownAffectedStyle,
    getUnknownDeceasedStyle,
    getUnknownProbandStyle
} from '../constants';

/**
 * Helper component to generate tooltip content
 */
const NodeTooltipContent = ({ data }) => {
    // Collect attributes for tooltip
    const attributes = [];
    if (data.isAffected) attributes.push('Affected');
    if (data.isCarrier) attributes.push('Carrier');
    if (data.isDeceased) attributes.push('Deceased');
    if (data.isProband) attributes.push('Proband');

    // Construct tooltip content
    const baseLabel = data.label || 'Individual';
    return `${baseLabel}${attributes.length > 0 ? ` (${attributes.join(', ')})` : ''}`;
};

/**
 * Male node (square shape)
 */
export const MaleNode = ({ data = {}, selected }) => {
    // Memoize tooltip content for performance
    const tooltipContent = useMemo(() => <NodeTooltipContent data={data} />, [data]);

    // Memoize styling based on selection state
    const sx = useMemo(() => getMaleNodeStyle(selected), [selected]);

    return (
        <Tooltip title={tooltipContent} placement="top" arrow>
            <Box sx={sx}>
                {/* Connection handles */}
                <Handle type="target" position={Position.Top} id="t" style={handleStyle} />
                <Handle type="source" position={Position.Bottom} id="b" style={handleStyle} />
                <Handle type="target" position={Position.Left} id="l" style={handleStyle} />
                <Handle type="source" position={Position.Right} id="r" style={handleStyle} />

                {/* Status markers */}
                {data.isAffected && <Box sx={{ ...affectedMarkerSx('blue'), borderRadius: 0 }} />}
                {data.isCarrier && <Box sx={carrierMarkerSx} />}
                {data.isDeceased && <Box sx={deceasedMarkerSx} />}
                {data.isProband && <Box sx={probandMarkerSx}>➤</Box>}

                {/* Label */}
                <Typography sx={labelSx}>{data.label || 'Male'}</Typography>
            </Box>
        </Tooltip>
    );
};

/**
 * Female node (circle shape)
 */
export const FemaleNode = ({ data = {}, selected }) => {
    // Memoize tooltip content
    const tooltipContent = useMemo(() => <NodeTooltipContent data={data} />, [data]);

    // Memoize styling based on selection state
    const sx = useMemo(() => getFemaleNodeStyle(selected), [selected]);

    return (
        <Tooltip title={tooltipContent} placement="top" arrow>
            <Box sx={sx}>
                {/* Connection handles - adjusted positions for circular shape */}
                <Handle type="target" position={Position.Top} id="t" style={{ ...handleStyle, top: '-4px' }} />
                <Handle type="source" position={Position.Bottom} id="b" style={{ ...handleStyle, bottom: '-4px' }} />
                <Handle type="target" position={Position.Left} id="l" style={{ ...handleStyle, left: '-4px' }} />
                <Handle type="source" position={Position.Right} id="r" style={{ ...handleStyle, right: '-4px' }} />

                {/* Status markers */}
                {data.isAffected && <Box sx={{ ...affectedMarkerSx('deeppink'), borderRadius: '50%' }} />}
                {data.isCarrier && <Box sx={carrierMarkerSx} />}
                {data.isDeceased && <Box sx={deceasedMarkerSx} />}
                {data.isProband && <Box sx={probandMarkerSx}>➤</Box>}

                {/* Label */}
                <Typography sx={labelSx}>{data.label || 'Female'}</Typography>
            </Box>
        </Tooltip>
    );
};

/**
 * Unknown gender node (diamond shape)
 */
export const UnknownNode = ({ data = {}, selected }) => {
    // Memoize tooltip content
    const tooltipContent = useMemo(() => <NodeTooltipContent data={data} />, [data]);

    // Memoize styling based on selection state
    const sx = useMemo(() => getUnknownNodeStyle(selected), [selected]);

    return (
        <Tooltip title={tooltipContent} placement="top" arrow>
            {/* Outer container for proper handle placement */}
            <Box sx={{
                width: nodeSize.width,
                height: nodeSize.height,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}>
                {/* The diamond shape */}
                <Box sx={sx}>
                    {/* Content that needs to be rotated back */}
                    <Box className="marker-content">
                        {/* Status markers with adjusted rotation/position */}
                        {data.isAffected && <Box sx={getUnknownAffectedStyle()} />}
                        {data.isCarrier && <Box sx={{ ...carrierMarkerSx, transform: 'translate(-50%, -50%)' }} />}
                        {data.isDeceased && <Box sx={getUnknownDeceasedStyle()} />}
                        {data.isProband && <Box sx={getUnknownProbandStyle()}>➤</Box>}
                    </Box>
                </Box>

                {/* Connection handles positioned on the outer container */}
                <Handle type="target" position={Position.Top} id="t" style={{ ...handleStyle, top: 0 }} />
                <Handle type="source" position={Position.Bottom} id="b" style={{ ...handleStyle, bottom: 0 }} />
                <Handle type="target" position={Position.Left} id="l" style={{ ...handleStyle, left: 0 }} />
                <Handle type="source" position={Position.Right} id="r" style={{ ...handleStyle, right: 0 }} />

                {/* Label with adjusted position */}
                <Typography sx={{ ...labelSx, bottom: -30 }}>{data.label || 'Unknown'}</Typography>
            </Box>
        </Tooltip>
    );
};
