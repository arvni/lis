// Pure canvas-drawing primitives for PaintApp. Each operates only on the
// canvas/context and arguments it is given — no component state or refs.

export const floodFill = (canvas, startX, startY, newColor) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const targetColorRgba = [
        data[(startY * canvas.width + startX) * 4],
        data[(startY * canvas.width + startX) * 4 + 1],
        data[(startY * canvas.width + startX) * 4 + 2],
        data[(startY * canvas.width + startX) * 4 + 3],
    ];
    const fillColorRgba = [
        parseInt(newColor.slice(1, 3), 16),
        parseInt(newColor.slice(3, 5), 16),
        parseInt(newColor.slice(5, 7), 16),
        255,
    ];
    if (targetColorRgba.join(',') === fillColorRgba.join(',')) return;

    const stack = [[startX, startY]];
    while (stack.length) {
        const [x, y] = stack.pop();
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
        const index = (y * canvas.width + x) * 4;
        if (
            data[index] === targetColorRgba[0] &&
            data[index + 1] === targetColorRgba[1] &&
            data[index + 2] === targetColorRgba[2] &&
            data[index + 3] === targetColorRgba[3]
        ) {
            data[index] = fillColorRgba[0];
            data[index + 1] = fillColorRgba[1];
            data[index + 2] = fillColorRgba[2];
            data[index + 3] = fillColorRgba[3];
            stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
    }
    ctx.putImageData(imageData, 0, 0);
};

export const drawDiamond = (ctx, centerX, centerY, size) => {
    const halfSize = size / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - halfSize);
    ctx.lineTo(centerX + halfSize, centerY);
    ctx.lineTo(centerX, centerY + halfSize);
    ctx.lineTo(centerX - halfSize, centerY);
    ctx.closePath();
    ctx.stroke();
};

export const drawTriangle = (ctx, centerX, centerY, size) => {
    const height = (size * Math.sqrt(3)) / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - height / 2);
    ctx.lineTo(centerX - size / 2, centerY + height / 2);
    ctx.lineTo(centerX + size / 2, centerY + height / 2);
    ctx.closePath();
    ctx.stroke();
};

export const drawArrow = (ctx, centerX, centerY, size, rotation = 0) => {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    const arrowLength = size;
    const arrowHeadLength = size * 0.3;
    const arrowHeadWidth = size * 0.2;

    ctx.beginPath();
    ctx.moveTo(0, -arrowLength / 2);
    ctx.lineTo(0, arrowLength / 2 - arrowHeadLength);

    ctx.moveTo(-arrowHeadWidth, arrowLength / 2 - arrowHeadLength);
    ctx.lineTo(0, arrowLength / 2);
    ctx.lineTo(arrowHeadWidth, arrowLength / 2 - arrowHeadLength);

    ctx.stroke();
    ctx.restore();
};

export const drawNumber = (ctx, centerX, centerY, size, number, color) => {
    ctx.save();
    ctx.font = `bold ${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(number, centerX, centerY);
    ctx.restore();
};

export const drawShape = (ctx, start, end, isPreview, options) => {
    const { tool, color, lineWidth, coplanarLineCount, coplanarLineSpacing } = options;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isPreview) {
        ctx.globalAlpha = 0.7;
        ctx.setLineDash([5, 5]);
    } else {
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
    }

    if (tool === 'dottedLine') {
        ctx.setLineDash([lineWidth * 2, lineWidth * 2]);
    }

    if (tool === 'coplanarLines') {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) return;

        const perpX = -dy / length;
        const perpY = dx / length;

        const totalLines = coplanarLineCount;
        const startOffset = -((totalLines - 1) * coplanarLineSpacing) / 2;

        for (let i = 0; i < totalLines; i++) {
            const offset = startOffset + i * coplanarLineSpacing;
            const offsetStartX = start.x + perpX * offset;
            const offsetStartY = start.y + perpY * offset;
            const offsetEndX = end.x + perpX * offset;
            const offsetEndY = end.y + perpY * offset;

            ctx.beginPath();
            ctx.moveTo(offsetStartX, offsetStartY);
            ctx.lineTo(offsetEndX, offsetEndY);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
        return;
    }

    ctx.beginPath();
    switch (tool) {
        case 'line':
        case 'dottedLine':
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            break;
        case 'rectangle':
            ctx.rect(start.x, start.y, end.x - start.x, end.y - start.y);
            break;
        case 'circle': {
            const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
            ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
            break;
        }
        case 'diamond': {
            const diamondRadius = Math.sqrt(
                Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
            );
            const halfDiamond = diamondRadius;
            ctx.moveTo(start.x, start.y - halfDiamond);
            ctx.lineTo(start.x + halfDiamond, start.y);
            ctx.lineTo(start.x, start.y + halfDiamond);
            ctx.lineTo(start.x - halfDiamond, start.y);
            ctx.closePath();
            break;
        }
        case 'triangle': {
            const triangleRadius = Math.sqrt(
                Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2),
            );
            const triangleHeight = (triangleRadius * Math.sqrt(3)) / 2;
            ctx.moveTo(start.x, start.y - triangleHeight / 2);
            ctx.lineTo(start.x - triangleRadius / 2, start.y + triangleHeight / 2);
            ctx.lineTo(start.x + triangleRadius / 2, start.y + triangleHeight / 2);
            ctx.closePath();
            break;
        }
        default:
            break;
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
};
