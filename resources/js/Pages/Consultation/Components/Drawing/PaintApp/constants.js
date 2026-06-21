import { createTheme } from '@mui/material/styles';
import {
    Brush as BrushIcon,
    Circle as CircleIcon,
    Crop32 as RectangleIcon,
    Remove as LineIcon,
    FormatColorFill as FillIcon,
    MoreHoriz as DottedLineIcon,
    Diamond as DiamondIcon,
    ChangeHistory as TriangleIcon,
    ViewStream as CoplanarLinesIcon,
    ArrowUpward as ArrowIcon,
} from '@mui/icons-material';
import { Eraser } from 'lucide-react';

export const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    minWidth: '40px',
                },
            },
        },
    },
});

export const colors = [
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFA500',
    '#800080',
    '#FFC0CB',
    '#A52A2A',
    '#808080',
    '#C0C0C0',
    '#800000',
    '#008000',
    '#000080',
    '#808000',
    '#FF69B4',
    '#32CD32',
    '#87CEEB',
    '#DDA0DD',
    '#F0E68C',
    '#FA8072',
];

export const tools = [
    { name: 'pen', icon: BrushIcon, label: 'Pen' },
    { name: 'eraser', icon: Eraser, label: 'Eraser' },
    { name: 'fill', icon: FillIcon, label: 'Fill' },
    { name: 'line', icon: LineIcon, label: 'Line' },
    { name: 'dottedLine', icon: DottedLineIcon, label: 'Dotted Line' },
    { name: 'coplanarLines', icon: CoplanarLinesIcon, label: 'Parallel Lines' },
    { name: 'rectangle', icon: RectangleIcon, label: 'Rectangle' },
    { name: 'circle', icon: CircleIcon, label: 'Circle' },
    { name: 'diamond', icon: DiamondIcon, label: 'Diamond' },
    { name: 'triangle', icon: TriangleIcon, label: 'Triangle' },
    { name: 'arrow', icon: ArrowIcon, label: 'Arrow' },
];

export const numberTools = [
    { name: 'number0', label: '0' },
    { name: 'number1', label: '1' },
    { name: 'number2', label: '2' },
    { name: 'number3', label: '3' },
    { name: 'number4', label: '4' },
    { name: 'number5', label: '5' },
    { name: 'number6', label: '6' },
    { name: 'number7', label: '7' },
    { name: 'number8', label: '8' },
    { name: 'number9', label: '9' },
];

// Tools that place a fixed-size shape on a single click.
export const SHAPE_TOOLS = ['rectangle', 'circle', 'diamond', 'triangle', 'arrow'];
