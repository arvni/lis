import React, { useCallback, useMemo, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    FormControl,
    FormHelperText,
    IconButton,
    InputAdornment,
    InputLabel,
    OutlinedInput,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from '@mui/material';
import { Add, Delete, PlayArrow } from '@mui/icons-material';
import * as mathjs from 'mathjs';
import { makeId } from '@/Services/helper.js';

export default function PricingConfig({
    priceType = 'Fix',
    price = 0,
    extra = {},
    onPriceTypeChange,
    onPriceChange,
    onExtraChange,
    error,
}) {
    const [testInputs, setTestInputs] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [testError, setTestError] = useState('');

    const parameters = useMemo(() => extra?.parameters ?? [], [extra?.parameters]);
    const formula = useMemo(() => extra?.formula ?? '', [extra?.formula]);
    const conditions = useMemo(() => extra?.conditions ?? [], [extra?.conditions]);
    const paramNames = useMemo(
        () => parameters.map((p) => p.value?.trim()).filter(Boolean),
        [parameters],
    );

    const patch = useCallback(
        (p) => onExtraChange({ ...(extra || {}), ...p }),
        [extra, onExtraChange],
    );

    const handleTypeChange = useCallback(
        (_, type) => {
            if (!type) return;
            setTestInputs({});
            setTestResult(null);
            setTestError('');
            onPriceTypeChange(type);
        },
        [onPriceTypeChange],
    );

    const addParam = useCallback(
        () => patch({ parameters: [...parameters, { id: makeId(6), value: '' }] }),
        [patch, parameters],
    );
    const updateParam = useCallback(
        (id, val) =>
            patch({ parameters: parameters.map((p) => (p.id === id ? { ...p, value: val } : p)) }),
        [patch, parameters],
    );
    const removeParam = useCallback(
        (id) => patch({ parameters: parameters.filter((p) => p.id !== id) }),
        [patch, parameters],
    );

    const addCond = useCallback(
        () => patch({ conditions: [...conditions, { id: makeId(6), condition: '', value: '' }] }),
        [patch, conditions],
    );
    const updateCond = useCallback(
        (id, field, val) =>
            patch({
                conditions: conditions.map((c) => (c.id === id ? { ...c, [field]: val } : c)),
            }),
        [patch, conditions],
    );
    const removeCond = useCallback(
        (id) => patch({ conditions: conditions.filter((c) => c.id !== id) }),
        [patch, conditions],
    );

    const setFormula = useCallback((val) => patch({ formula: val }), [patch]);
    const insertParam = useCallback(
        (name) => setFormula(formula + (formula.trim() ? ' + ' : '') + name),
        [setFormula, formula],
    );

    const runTest = useCallback(() => {
        setTestResult(null);
        setTestError('');
        try {
            const scope = {};
            for (const p of parameters) {
                const name = p.value?.trim();
                if (!name) continue;
                const n = parseFloat(testInputs[name]);
                if (isNaN(n)) throw new Error(`Enter a value for "${name}"`);
                scope[name] = n;
            }
            if (priceType === 'Formulate') {
                if (!formula.trim()) throw new Error('Formula is empty');
                setTestResult(`${parseFloat(mathjs.evaluate(formula, scope)).toFixed(3)} OMR`);
            } else {
                for (let i = 0; i < conditions.length; i++) {
                    const c = conditions[i];
                    if (!c.condition?.trim()) continue;
                    try {
                        const keys = Object.keys(scope);

                        const met = new Function(
                            ...keys,
                            `"use strict"; return !!(${c.condition})`,
                        )(...keys.map((k) => scope[k]));
                        if (met) {
                            setTestResult(
                                `Condition ${i + 1} matched — ${parseFloat(mathjs.evaluate(c.value || '0', scope)).toFixed(3)} OMR`,
                            );
                            return;
                        }
                    } catch {
                        /* skip malformed condition */
                    }
                }
                setTestResult('No condition matched');
            }
        } catch (e) {
            setTestError(e.message);
        }
    }, [parameters, testInputs, priceType, formula, conditions]);

    const renderParams = () => (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                }}
            >
                <Typography variant="subtitle2" color="text.secondary">
                    Parameters
                </Typography>
                <Button size="small" startIcon={<Add />} onClick={addParam}>
                    Add
                </Button>
            </Box>
            {parameters.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
                    No parameters yet.
                </Typography>
            ) : (
                <Stack gap={1}>
                    {parameters.map((p) => (
                        <Box key={p.id} sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                size="small"
                                fullWidth
                                value={p.value}
                                placeholder="e.g. age, weight"
                                onChange={(e) => updateParam(p.id, e.target.value)}
                                sx={{ '& .MuiInputBase-root': { fontFamily: 'monospace' } }}
                            />
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeParam(p.id)}
                            >
                                <Delete fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}
                </Stack>
            )}
        </Box>
    );

    const renderTester = () => {
        if (!paramNames.length) return null;
        return (
            <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Test
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-end' }}>
                    {paramNames.map((name) => (
                        <TextField
                            key={name}
                            size="small"
                            label={name}
                            type="number"
                            value={testInputs[name] ?? ''}
                            onChange={(e) =>
                                setTestInputs((prev) => ({ ...prev, [name]: e.target.value }))
                            }
                            sx={{ width: 110 }}
                            slotProps={{ htmlInput: { step: 'any' } }}
                        />
                    ))}
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<PlayArrow />}
                        onClick={runTest}
                    >
                        Run
                    </Button>
                </Box>
                {testResult && (
                    <Alert severity="success" sx={{ mt: 1.5, py: 0.5 }}>
                        {testResult}
                    </Alert>
                )}
                {testError && (
                    <Alert severity="error" sx={{ mt: 1.5, py: 0.5 }}>
                        {testError}
                    </Alert>
                )}
            </Box>
        );
    };

    return (
        <Stack gap={3}>
            {/* method selector */}
            <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={priceType}
                onChange={handleTypeChange}
                sx={{
                    mb: 1.5,
                    '& .MuiToggleButtonGroup-grouped': {
                        border: '1px solid',
                        borderColor: 'divider',
                    },
                }}
            >
                <ToggleButton value="Fix">Fixed</ToggleButton>
                <ToggleButton value="Formulate">Formula</ToggleButton>
                <ToggleButton value="Conditional">Conditional</ToggleButton>
            </ToggleButtonGroup>

            {/* fixed */}
            {priceType === 'Fix' && (
                <FormControl fullWidth>
                    <InputLabel error={Boolean(error)} required>
                        Amount
                    </InputLabel>
                    <OutlinedInput
                        type="number"
                        label="Amount"
                        value={price ?? 0}
                        error={Boolean(error)}
                        slotProps={{ htmlInput: { min: 0, step: 0.001 } }}
                        onChange={(e) => onPriceChange(e.target.value)}
                        endAdornment={
                            <InputAdornment position="end">
                                <Typography variant="caption" color="text.secondary">
                                    OMR
                                </Typography>
                            </InputAdornment>
                        }
                    />
                    {error && <FormHelperText error>{error}</FormHelperText>}
                </FormControl>
            )}

            {/* formula */}
            {priceType === 'Formulate' && (
                <Stack gap={2.5}>
                    {renderParams()}

                    {paramNames.length > 0 && (
                        <Box
                            sx={{
                                mt: 1,
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.75,
                                alignItems: 'center',
                            }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Insert:
                            </Typography>
                            {paramNames.map((name) => (
                                <Tooltip key={name} title="Append to formula">
                                    <Chip
                                        label={name}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => insertParam(name)}
                                        sx={{ fontFamily: 'monospace', cursor: 'pointer' }}
                                    />
                                </Tooltip>
                            ))}
                        </Box>
                    )}

                    <TextField
                        label="Formula"
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="e.g.  age * 0.5 + weight * 0.3 + 10"
                        helperText="Use the parameter names defined above"
                        sx={{ mt: 1, '& .MuiInputBase-root': { fontFamily: 'monospace' } }}
                    />

                    {renderTester()}
                </Stack>
            )}

            {/* conditional */}
            {priceType === 'Conditional' && (
                <Stack gap={2.5}>
                    {renderParams()}

                    <Box>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1,
                            }}
                        >
                            <Typography variant="subtitle2" color="text.secondary">
                                Conditions{' '}
                                <Typography component="span" variant="caption">
                                    (first match wins)
                                </Typography>
                            </Typography>
                            <Button size="small" startIcon={<Add />} onClick={addCond}>
                                Add
                            </Button>
                        </Box>

                        {conditions.length === 0 ? (
                            <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
                                No conditions yet.
                            </Typography>
                        ) : (
                            <Stack gap={1}>
                                {conditions.map((c, idx) => (
                                    <Box
                                        key={c.id}
                                        sx={{ display: 'flex', gap: 1, alignItems: 'center' }}
                                    >
                                        <Typography
                                            variant="caption"
                                            color="text.disabled"
                                            sx={{ minWidth: 16 }}
                                        >
                                            {idx + 1}
                                        </Typography>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            label="When true"
                                            value={c.condition}
                                            placeholder="e.g. age > 18"
                                            onChange={(e) =>
                                                updateCond(c.id, 'condition', e.target.value)
                                            }
                                            sx={{
                                                '& .MuiInputBase-root': { fontFamily: 'monospace' },
                                            }}
                                        />
                                        <TextField
                                            size="small"
                                            fullWidth
                                            label="Price"
                                            value={c.value}
                                            placeholder="e.g. 100 or age * 2"
                                            onChange={(e) =>
                                                updateCond(c.id, 'value', e.target.value)
                                            }
                                            sx={{
                                                '& .MuiInputBase-root': { fontFamily: 'monospace' },
                                            }}
                                        />
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => removeCond(c.id)}
                                        >
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Box>

                    {renderTester()}
                </Stack>
            )}
        </Stack>
    );
}
