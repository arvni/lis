import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Handle, Position } from 'reactflow';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import {
    nodeSize,
    nodeBaseSx,
    affectedMarkerSx,
    carrierMarkerSx,
    deceasedMarkerSx,
    probandMarkerSx,
    labelSx,
    handleStyle,
} from './constants';

const useTooltipContent = (data, fallback) =>
    useMemo(() => {
        const attributes = [];
        if (data.isAffected) attributes.push('Affected');
        if (data.isCarrier) attributes.push('Carrier');
        if (data.isDeceased) attributes.push('Deceased');
        if (data.isProband) attributes.push('Proband');
        return `${data.label || fallback}${attributes.length > 0 ? ` (${attributes.join(', ')})` : ''}`;
    }, [data, fallback]);

const nodePropTypes = {
    data: PropTypes.shape({
        label: PropTypes.string,
        isAffected: PropTypes.bool,
        isCarrier: PropTypes.bool,
        isDeceased: PropTypes.bool,
        isProband: PropTypes.bool,
    }).isRequired,
    selected: PropTypes.bool,
};

export const MaleNode = ({ data, selected }) => {
    const tooltipContent = useTooltipContent(data, 'Male');

    return (
        <Tooltip title={tooltipContent} placement="top" arrow>
            <Box
                sx={{
                    ...nodeBaseSx,
                    bgcolor: 'lightblue',
                    borderRadius: 0,
                    borderColor: selected ? 'blue' : 'black',
                    ...(selected && { boxShadow: 6 }),
                    '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 4,
                    },
                }}
            >
                <Handle type="target" position={Position.Top} id="t" style={handleStyle} />
                <Handle type="source" position={Position.Bottom} id="b" style={handleStyle} />
                <Handle type="target" position={Position.Left} id="l" style={handleStyle} />
                <Handle type="source" position={Position.Right} id="r" style={handleStyle} />

                {data.isAffected && <Box sx={{ ...affectedMarkerSx('blue'), borderRadius: 0 }} />}
                {data.isCarrier && <Box sx={carrierMarkerSx} />}
                {data.isDeceased && <Box sx={deceasedMarkerSx} />}
                {data.isProband && <Box sx={probandMarkerSx}>➤</Box>}

                <Typography sx={labelSx}>{data.label || 'Male'}</Typography>
            </Box>
        </Tooltip>
    );
};
MaleNode.propTypes = nodePropTypes;

export const FemaleNode = ({ data, selected }) => {
    const tooltipContent = useTooltipContent(data, 'Female');

    return (
        <Tooltip title={tooltipContent} placement="top" arrow>
            <Box
                sx={{
                    ...nodeBaseSx,
                    bgcolor: 'lightpink',
                    borderRadius: '50%',
                    borderColor: selected ? 'deeppink' : 'black',
                    ...(selected && { boxShadow: 6 }),
                    '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 4,
                    },
                }}
            >
                <Handle
                    type="target"
                    position={Position.Top}
                    id="t"
                    style={{ ...handleStyle, top: '-4px' }}
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="b"
                    style={{ ...handleStyle, bottom: '-4px' }}
                />
                <Handle
                    type="target"
                    position={Position.Left}
                    id="l"
                    style={{ ...handleStyle, left: '-4px' }}
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="r"
                    style={{ ...handleStyle, right: '-4px' }}
                />

                {data.isAffected && (
                    <Box sx={{ ...affectedMarkerSx('deeppink'), borderRadius: '50%' }} />
                )}
                {data.isCarrier && <Box sx={carrierMarkerSx} />}
                {data.isDeceased && <Box sx={deceasedMarkerSx} />}
                {data.isProband && <Box sx={probandMarkerSx}>➤</Box>}

                <Typography sx={labelSx}>{data.label || 'Female'}</Typography>
            </Box>
        </Tooltip>
    );
};
FemaleNode.propTypes = nodePropTypes;

export const UnknownNode = ({ data, selected }) => {
    const tooltipContent = useTooltipContent(data, 'Unknown');

    return (
        <Tooltip title={tooltipContent} placement="top" arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box
                    sx={{
                        ...nodeBaseSx,
                        bgcolor: 'lightgrey',
                        width: nodeSize.width * 0.8,
                        height: nodeSize.height * 0.8,
                        transform: 'rotate(45deg)',
                        borderColor: selected ? 'dimgray' : 'black',
                        ...(selected && { boxShadow: 6 }),
                        '&:hover': {
                            transform: 'rotate(45deg) scale(1.05)',
                            boxShadow: 4,
                        },
                        '.marker-content': {
                            transform: 'rotate(-45deg)',
                            textAlign: 'center',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                        },
                    }}
                >
                    <Box className="marker-content">
                        {data.isAffected && (
                            <Box
                                sx={{
                                    ...affectedMarkerSx('dimgray'),
                                    transform: 'rotate(45deg) scale(1.25)',
                                    borderRadius: 0,
                                }}
                            />
                        )}
                        {data.isCarrier && (
                            <Box sx={{ ...carrierMarkerSx, transform: 'translate(-50%, -50%)' }} />
                        )}
                        {data.isDeceased && (
                            <Box
                                sx={{
                                    ...deceasedMarkerSx,
                                    transform: 'rotate(45deg) scale(0.75)',
                                    transformOrigin: 'center center',
                                }}
                            />
                        )}
                        {data.isProband && (
                            <Box
                                sx={{
                                    ...probandMarkerSx,
                                    transformOrigin: 'center left',
                                    left: -20,
                                }}
                            >
                                ➤
                            </Box>
                        )}
                    </Box>
                </Box>
                <Handle
                    type="target"
                    position={Position.Top}
                    id="t"
                    style={{
                        ...handleStyle,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: '-10px',
                    }}
                />
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="b"
                    style={{
                        ...handleStyle,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bottom: 0,
                    }}
                />
                <Handle
                    type="target"
                    position={Position.Left}
                    id="l"
                    style={{
                        ...handleStyle,
                        top: 'calc(50% - 5px)',
                        transform: 'translateY(-50%)',
                        left: '-5px',
                    }}
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="r"
                    style={{
                        ...handleStyle,
                        top: 'calc(50% - 5px)',
                        transform: 'translateY(-50%)',
                        right: '-5px',
                    }}
                />

                <Typography
                    sx={{
                        ...labelSx,
                        bottom: -30,
                        transform: 'translateX(-50%)',
                        left: '50%',
                    }}
                >
                    {data.label || 'Unknown'}
                </Typography>
            </Box>
        </Tooltip>
    );
};
UnknownNode.propTypes = nodePropTypes;
