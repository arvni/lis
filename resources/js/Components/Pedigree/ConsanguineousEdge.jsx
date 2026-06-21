import React from 'react';
import PropTypes from 'prop-types';
import { getSmoothStepPath } from 'reactflow';

// --- Custom Edge Component for Consanguineous Marriage ---
export default function ConsanguineousEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
}) {
    const yOffset = 3;
    const [edgePath1] = getSmoothStepPath({
        sourceX,
        sourceY: sourceY - yOffset,
        sourcePosition,
        targetX,
        targetY: targetY - yOffset,
        targetPosition,
    });
    const [edgePath2] = getSmoothStepPath({
        sourceX,
        sourceY: sourceY + yOffset,
        sourcePosition,
        targetX,
        targetY: targetY + yOffset,
        targetPosition,
    });

    return (
        <>
            <path
                id={`${id}-1`}
                style={{ ...style, strokeDasharray: undefined }}
                className="react-flow__edge-path"
                d={edgePath1}
            />
            <path
                id={`${id}-2`}
                style={{ ...style, strokeDasharray: undefined }}
                className="react-flow__edge-path"
                d={edgePath2}
            />
        </>
    );
}

ConsanguineousEdge.propTypes = {
    id: PropTypes.string,
    sourceX: PropTypes.number,
    sourceY: PropTypes.number,
    targetX: PropTypes.number,
    targetY: PropTypes.number,
    sourcePosition: PropTypes.string,
    targetPosition: PropTypes.string,
    style: PropTypes.object,
};
