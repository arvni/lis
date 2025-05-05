// src/components/edges/CustomEdges.js
import React from 'react';
import { getSmoothStepPath } from 'reactflow';

/**
 * Custom edge component for rendering double lines (consanguineous relationship)
 *
 * This represents relationships between blood relatives in pedigree charts
 * and is visualized as two parallel lines.
 *
 * @param {string} id - Edge ID
 * @param {number} sourceX - Source node X coordinate
 * @param {number} sourceY - Source node Y coordinate
 * @param {number} targetX - Target node X coordinate
 * @param {number} targetY - Target node Y coordinate
 * @param {string} sourcePosition - Source handle position
 * @param {string} targetPosition - Target handle position
 * @param {Object} style - Style properties for the edge
 */
export function ConsanguineousEdge({
                                       id,
                                       sourceX,
                                       sourceY,
                                       targetX,
                                       targetY,
                                       sourcePosition,
                                       targetPosition,
                                       style = {}, // Base styles from React Flow or edge definition
                                   }) {
    // Offset for the two parallel lines
    const yOffset = 3;

    // Calculate path for the first line (slightly above center)
    const [edgePath1] = getSmoothStepPath({
        sourceX,
        sourceY: sourceY - yOffset,
        sourcePosition,
        targetX,
        targetY: targetY - yOffset,
        targetPosition,
    });

    // Calculate path for the second line (slightly below center)
    const [edgePath2] = getSmoothStepPath({
        sourceX,
        sourceY: sourceY + yOffset,
        sourcePosition,
        targetX,
        targetY: targetY + yOffset,
        targetPosition,
    });

    // Combine base style with necessary stroke properties
    const pathStyle = {
        ...style,
        strokeDasharray: undefined, // Ensure solid lines even if base style has dashes
        fill: 'none', // Paths should not be filled
    };

    return (
        <>
            <path
                id={`${id}-1`} // Unique ID for the first path
                style={pathStyle}
                className="react-flow__edge-path" // Standard React Flow class for styling
                d={edgePath1} // SVG path data
                aria-label="Consanguineous relationship line"
            />
            <path
                id={`${id}-2`} // Unique ID for the second path
                style={pathStyle}
                className="react-flow__edge-path"
                d={edgePath2}
                aria-label="Consanguineous relationship line"
            />
        </>
    );
}

/**
 * Additional edge types can be added here as needed
 * For example:
 * - Adoption edges
 * - Pregnancy edges
 * - Twin edges (with zig-zag connection)
 */
