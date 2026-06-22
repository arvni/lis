import {
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import ChoiceCell from './ChoiceCell';

const ComparisonTable = ({
    title,
    keys,
    labels,
    bucket,
    display,
    comparison,
    choices,
    keepSide,
    onlyDiff,
    onChoose,
    alwaysShow = [],
}) => {
    const rows = keys.filter((key) => {
        if (!onlyDiff || alwaysShow.includes(key)) return true;
        return (comparison.first[bucket][key] ?? '') !== (comparison.second[bucket][key] ?? '');
    });

    return (
        <>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {title}
            </Typography>
            {rows.length === 0 ? (
                <Alert severity="success" variant="outlined" sx={{ mb: 1 }}>
                    All {title.toLowerCase()} fields match — nothing to choose.
                </Alert>
            ) : (
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow
                                sx={{ '& th': { fontWeight: 700, backgroundColor: 'grey.50' } }}
                            >
                                <TableCell sx={{ width: '20%' }}>Field</TableCell>
                                <TableCell>{comparison.first.fullName}</TableCell>
                                <TableCell>{comparison.second.fullName}</TableCell>
                                <TableCell sx={{ width: '22%' }}>Result</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.map((key) => {
                                const a = comparison.first[bucket][key];
                                const b = comparison.second[bucket][key];
                                const source = choices[key] ?? keepSide;
                                return (
                                    <TableRow key={key} hover>
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {labels[key] ?? key}
                                        </TableCell>
                                        <ChoiceCell
                                            selected={source === 'first'}
                                            onSelect={() => onChoose(key, 'first')}
                                        >
                                            {display(key, a)}
                                        </ChoiceCell>
                                        <ChoiceCell
                                            selected={source === 'second'}
                                            onSelect={() => onChoose(key, 'second')}
                                        >
                                            {display(key, b)}
                                        </ChoiceCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>
                                            {display(key, comparison[source][bucket][key])}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </>
    );
};

export default ComparisonTable;
