import React, {useState, useEffect} from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Grid2 as Grid,
    Alert,
    Collapse,
    IconButton,
    Chip,
} from '@mui/material';
import {
    CalculateOutlined,
    PlayArrow,
    Refresh,
    Close,
    Check,
    Error
} from '@mui/icons-material';
import * as mathjs from 'mathjs';

/**
 * Component for testing formulas with parameter values
 *
 * @param {Object} props
 * @param {Array} props.parameters - Array of parameter objects
 * @param {String} props.formula - The formula string to evaluate
 * @param {Boolean} props.isConditional - Whether this is for conditional pricing
 * @param {Array} props.conditions - Array of condition objects (for conditional pricing)
 */
const FormulaTester = ({parameters = [], formula = '', isConditional = false, conditions = []}) => {
    const [paramValues, setParamValues] = useState({});
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [showTester, setShowTester] = useState(false);
    const [conditionResults, setConditionResults] = useState([]);

    // Initialize parameter values
    useEffect(() => {
        const initialValues = {};
        parameters.forEach(param => {
            initialValues[param.value] = '';
        });
        setParamValues(initialValues);
        setResult(null);
        setError('');
    }, [parameters, formula, conditions]);

    // Handle parameter value change
    const handleParamChange = (paramName, value) => {
        setParamValues(prev => ({
            ...prev,
            [paramName]: value
        }));
        // Clear results when changing values
        setResult(null);
        setError('');
        setConditionResults([]);
    };

    // Evaluate formula with current parameter values
    const evaluateFormula = () => {
        try {
            // Create a scope with current parameter values
            const scope = {...paramValues};

            // Validate all parameters have values
            const missingParams = Object.entries(scope).filter(([_, value]) => value === '');
            if (missingParams.length > 0) {
                throw new Error(`Please provide values for all parameters: ${missingParams.map(([key]) => key).join(', ')}`);
            }

            // Convert string values to numbers
            Object.keys(scope).forEach(key => {
                scope[key] = parseFloat(scope[key]);
                if (isNaN(scope[key])) {
                    throw new Error(`Invalid numeric value for parameter ${key}`);
                }
            });

            if (isConditional) {
                // Evaluate all conditions and find the matching one
                const results = conditions.map(condition => {
                    const conditionResult = evaluateCondition(condition.condition, scope);
                    let value = null;
                    let valueError = null;
                    try {
                        // Try to evaluate the price formula if condition is met
                        value = conditionResult ? mathjs.evaluate(condition.value, scope) : null;
                    } catch (err) {
                        valueError = err.message;
                    }

                    return {
                        condition: condition.condition,
                        conditionMet: conditionResult,
                        value: value !== null ? value : null,
                        priceFormula: condition.value,
                        error: valueError
                    };
                });

                setConditionResults(results);

                // Find the first condition that is met
                const matchingCondition = results.find(r => r.conditionMet && r.value !== null);
                if (matchingCondition) {
                    setResult(matchingCondition.value);
                    setError('');
                } else if (results.every(r => !r.conditionMet)) {
                    setError('No conditions were met with the provided parameter values');
                } else {
                    setError('Error evaluating price for the matching condition');
                }
            } else {
                // For simple formula-based pricing
                const result = mathjs.evaluate(formula, scope);
                setResult(result);
                setError('');
            }
        } catch (err) {
            setResult(null);
            setError(err.message);
        }
    };

    // Evaluate a single condition expression
    const evaluateCondition = (conditionStr, scope) => {
        try {
            return new Function(...Object.keys(scope), `return ${conditionStr}`)(...Object.values(scope));
        } catch (err) {
            return false;
        }
    };

    // Reset all parameter values
    const resetValues = () => {
        const resetValues = {};
        parameters.forEach(param => {
            resetValues[param.value] = '';
        });
        setParamValues(resetValues);
        setResult(null);
        setError('');
        setConditionResults([]);
    };

    // Format number for display
    const formatNumber = (num) => {
        return typeof num === 'number' ? num.toFixed(3) : 'N/A';
    };

    return (
        <Paper variant="outlined" sx={{mt: 2, mb: 2}}>
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    borderBottom: showTester ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                    bgcolor: showTester ? 'rgba(0, 0, 0, 0.03)' : 'transparent'
                }}
                onClick={() => setShowTester(!showTester)}
            >
                <Box sx={{display: 'flex', alignItems: 'center'}}>
                    <CalculateOutlined sx={{mr: 1}} color="primary"/>
                    <Typography variant="subtitle1" fontWeight="medium">
                        Formula Tester
                    </Typography>
                </Box>
                <IconButton size="small">
                    {showTester ? <Close fontSize="small"/> : <PlayArrow fontSize="small"/>}
                </IconButton>
            </Box>

            <Collapse in={showTester}>
                <Box sx={{p: 2}}>
                    <Alert severity="info" sx={{mb: 2}}>
                        Enter values for each parameter to
                        test {isConditional ? 'conditional pricing' : 'your formula'} and see the calculated result.
                    </Alert>

                    <Grid container spacing={2} sx={{mb: 2}}>
                        {parameters.length > 0 ? (
                            parameters.map((param, index) => (
                                <Grid size={{xs: 12, sm: 6, md: 4}} key={param.id || index}>
                                    <TextField
                                        label={`${param.value}`}
                                        placeholder="Enter value"
                                        fullWidth
                                        size="small"
                                        value={paramValues[param.value] || ''}
                                        onChange={(e) => handleParamChange(param.value, e.target.value)}
                                        type="number"
                                        slotProps={{
                                            htmlInput: {step: 'any'}
                                        }}
                                    />
                                </Grid>
                            ))
                        ) : (
                            <Grid size={12}>
                                <Alert severity="warning">
                                    No parameters defined. Add parameters to test your formula.
                                </Alert>
                            </Grid>
                        )}
                    </Grid>

                    {parameters.length > 0 && (
                        <Box sx={{display: 'flex', gap: 2, mb: 3}}>
                            <Button
                                variant="contained"
                                startIcon={<CalculateOutlined/>}
                                onClick={evaluateFormula}
                                disabled={parameters.length === 0}
                            >
                                Calculate
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<Refresh/>}
                                onClick={resetValues}
                            >
                                Reset Values
                            </Button>
                        </Box>
                    )}

                    {error && (
                        <Alert severity="error" sx={{mb: 2}}>
                            {error}
                        </Alert>
                    )}

                    {result !== null && (
                        <Paper sx={{p: 2, bgcolor: 'success.light', color: 'success.contrastText'}}>
                            <Typography variant="h6" gutterBottom>
                                Result: {formatNumber(result)} OMR
                            </Typography>
                            {!isConditional && (
                                <Typography variant="body2">
                                    Formula: {formula}
                                </Typography>
                            )}
                        </Paper>
                    )}

                    {isConditional && conditionResults.length > 0 && (
                        <Box sx={{mt: 3}}>
                            <Typography variant="subtitle2" gutterBottom>
                                Condition Evaluation Results:
                            </Typography>

                            {conditionResults.map((result, index) => (
                                <Paper
                                    key={index}
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        mb: 1,
                                        bgcolor: result.conditionMet ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                        borderColor: result.conditionMet ? 'success.main' : undefined
                                    }}
                                >
                                    <Box sx={{display: 'flex', alignItems: 'center', mb: 0.5}}>
                                        <Chip
                                            icon={result.conditionMet ? <Check/> : <Close/>}
                                            label={result.conditionMet ? "Condition Met" : "Not Met"}
                                            size="small"
                                            color={result.conditionMet ? "success" : "default"}
                                            sx={{mr: 1}}
                                        />
                                        <Typography variant="body2" fontFamily="monospace">
                                            {result.condition}
                                        </Typography>
                                    </Box>

                                    {result.conditionMet && (
                                        <Box sx={{mt: 1}}>
                                            <Typography variant="body2" color="text.secondary">
                                                Price Formula: <strong>{result.priceFormula}</strong>
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium"
                                                        color={result.error ? 'error.main' : 'success.main'}>
                                                {result.error ? `Error: ${result.error}` : `Result: ${formatNumber(result.value)} OMR`}
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            ))}
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
};

export default FormulaTester;
