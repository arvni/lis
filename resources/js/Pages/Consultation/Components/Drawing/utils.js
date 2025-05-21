// utils.js
// Helper functions for drawing and math operations
import { EPSILON, ElementTypes } from './constants';

// Line equation helper
export const getLineEquation = (p1, p2) => {
    if (!p1 || !p2) return null;
    const A = p2.y - p1.y;
    const B = p1.x - p2.x;
    const C = A * p1.x + B * p1.y;
    const isVertical = Math.abs(B) < EPSILON;
    const slope = isVertical ? Infinity : -A / B;
    return { A, B, C, slope, isVertical, p1, p2 };
};

// Check if two lines are parallel
export const areLinesParallel = (lineEq1, lineEq2) => {
    if (!lineEq1 || !lineEq2) return false;
    if (lineEq1.isVertical && lineEq2.isVertical) return true;
    if (lineEq1.isVertical || lineEq2.isVertical) return false;
    return Math.abs(lineEq1.slope - lineEq2.slope) < EPSILON;
};

// Check if a value is between two limits (for selection)
export const isValueBetweenLimits = (value, C1, type1, C2, type2) => {
    const minC = Math.min(C1, C2);
    const maxC = Math.max(C1, C2);
    let lowerBoundOk = false;
    if (value > minC + EPSILON) lowerBoundOk = true;
    else if (Math.abs(value - minC) < EPSILON) {
        if ((Math.abs(C1 - minC) < EPSILON && type1 === 'solid') ||
            (Math.abs(C2 - minC) < EPSILON && type2 === 'solid')) {
            lowerBoundOk = true;
        }
    }
    let upperBoundOk = false;
    if (value < maxC - EPSILON) upperBoundOk = true;
    else if (Math.abs(value - maxC) < EPSILON) {
        if ((Math.abs(C1 - maxC) < EPSILON && type1 === 'solid') ||
            (Math.abs(C2 - maxC) < EPSILON && type2 === 'solid')) {
            upperBoundOk = true;
        }
    }
    if (Math.abs(minC - maxC) < EPSILON) {
        return Math.abs(value - minC) < EPSILON && type1 === 'solid' && type2 === 'solid';
    }
    return lowerBoundOk && upperBoundOk;
};

// Check if an element is between two parallel lines
export const isElementBetweenParallelLines = (element, line1Eq, line1Type, line2Eq, line2Type) => {
    if (!element || !line1Eq || !line2Eq || !areLinesParallel(line1Eq, line2Eq)) {
        return false;
    }
    const pointsToCheck = [];
    if (element.item.shape === ElementTypes.LINE) {
        pointsToCheck.push(...element.item.points);
    } else if (element.item.shape === ElementTypes.STRAIGHT_LINE) {
        pointsToCheck.push(element.item.start, element.item.end);
    } else if (element.item.shape === ElementTypes.SQUARE) {
        const { x, y, width, height } = element.item;
        pointsToCheck.push(
            { x, y },
            { x: x + width, y },
            { x, y: y + height },
            { x: x + width, y: y + height }
        );
    } else if (element.item.shape === ElementTypes.CIRCLE) {
        const { cx, cy, radius } = element.item;
        pointsToCheck.push(
            { x: cx, y: cy },
            { x: cx + radius, y: cy },
            { x: cx - radius, y: cy },
            { x: cx, y: cy + radius },
            { x: cx, y: cy - radius }
        );
    } else if (element.item.shape === ElementTypes.TEXT) {
        const { x, y, width, height } = element.item;
        pointsToCheck.push(
            { x, y },
            { x: x + width, y },
            { x, y: y + height },
            { x: x + width, y: y + height }
        );
    }

    if (pointsToCheck.length === 0) return false;

    for (const point of pointsToCheck) {
        const valueForPoint = line1Eq.A * point.x + line1Eq.B * point.y;
        if (!isValueBetweenLimits(valueForPoint, line1Eq.C, line1Type, line2Eq.C, line2Type)) {
            return false;
        }
    }
    return true;
};

// Calculate text dimensions for text elements
export const calculateTextDimensions = (text, fontSize, fontFamily = 'Arial') => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const height = fontSize * 1.2; // Approximate height
    return {
        width: metrics.width,
        height: height
    };
};

// Check if a point is inside an element (for selection)
export const pointIsInElement = (point, element) => {
    const { x, y } = point;

    if (element.item.shape === ElementTypes.SQUARE) {
        return x >= element.item.x &&
            x <= element.item.x + element.item.width &&
            y >= element.item.y &&
            y <= element.item.y + element.item.height;
    }

    else if (element.item.shape === ElementTypes.CIRCLE) {
        const distance = Math.sqrt(
            Math.pow(x - element.item.cx, 2) +
            Math.pow(y - element.item.cy, 2)
        );
        return distance <= element.item.radius;
    }

    else if (element.item.shape === ElementTypes.STRAIGHT_LINE) {
        // Distance from point to line segment
        const A = element.item.end.y - element.item.start.y;
        const B = element.item.start.x - element.item.end.x;
        const C = element.item.end.x * element.item.start.y - element.item.start.x * element.item.end.y;

        const distance = Math.abs(A * x + B * y + C) / Math.sqrt(A * A + B * B);
        const lineLength = Math.sqrt(
            Math.pow(element.item.end.x - element.item.start.x, 2) +
            Math.pow(element.item.end.y - element.item.start.y, 2)
        );

        // Check if projection is on the line segment
        const dot = ((x - element.item.start.x) * (element.item.end.x - element.item.start.x) +
                (y - element.item.start.y) * (element.item.end.y - element.item.start.y)) /
            (lineLength * lineLength);

        return distance < 5 && dot >= 0 && dot <= 1; // 5px tolerance
    }

    else if (element.item.shape === ElementTypes.TEXT) {
        return x >= element.item.x &&
            x <= element.item.x + element.item.width &&
            y >= element.item.y &&
            y <= element.item.y + element.item.height;
    }

    return false;
};

// Snap a point to the grid
export const snapToGrid = (point, gridSize) => {
    return {
        x: Math.round(point.x / gridSize) * gridSize,
        y: Math.round(point.y / gridSize) * gridSize
    };
};
