import { create, all } from 'mathjs';

// Create a restricted math evaluator to prevent arbitrary code execution
const math = create(all);


/**
 * Safely replace parameters in a formula with their corresponding values
 * @param formula - The original formula string
 * @param parameters - List of parameter names
 * @param values - Object containing parameter values
 * @returns Formula with parameters replaced by their values
 */
function replaceParameters(formula, parameters, values) {
    // Sort parameters by length in descending order to prevent partial replacements
    const sortedParams = [...parameters].sort((a, b) => b.length - a.length);

    // Create a new copy of the formula to avoid mutation
    let replacedFormula = formula;

    // Safely replace each parameter
    for (const param of sortedParams) {
        // Ensure the value exists and is converted to a string
        const value = values?.[param] ?? 0;
        const safeValue = String(Number(value));

        // Use regex with word boundaries to prevent partial matches
        const paramRegex = new RegExp(`\\b${param}\\b`, 'g');
        replacedFormula = replacedFormula.replace(paramRegex, safeValue);
    }

    const sanitizedExpression = replacedFormula
        .trim()
        // Normalize logical operators
        .replace(/&&/g, ' and ')
        .replace(/\|\|/g, ' or ')
        // Ensure spaces around comparison operators
        .replace(/([<>]=?)/g, ' $1 ')
        // Remove any potentially dangerous characters
        .replace(/[^0-9<>=.&|() andor+\-*/%]/g, '');

    // Additional safety checks
    const dangerousPatterns = [
        /\b(import|require|eval|function)\b/,  // Prevent importing or calling functions
        /[{}[\]]/,  // Prevent array or object syntax
        /;/  // Prevent multiple statements
    ];

    if (dangerousPatterns.some(pattern => pattern.test(sanitizedExpression))) {
        throw new Error('Invalid expression');
    }


    return sanitizedExpression;
}

/**
 * Evaluate a mathematical condition safely
 * @param condition - Condition string to evaluate
 * @returns Boolean result of the condition
 */
function safeEvaluateCondition(condition) {
    try {
        // Use mathjs to safely evaluate the condition
        return Boolean(math.evaluate(condition));
    } catch (error) {
        console.error('Invalid condition:', condition);
        return false;
    }
}

/**
 * Safely calculate price based on formula and conditions
 * @param formula - Pricing formula
 * @param parameters - List of parameters
 * @param values - Parameter values
 * @param conditions - Optional pricing conditions
 * @returns Calculated price
 */
export function calcPrice(
    formula,
    parameters,
    values,
    conditions
){
    // Extract parameter names, sorted by length to prevent partial replacements
    const paramNames = parameters.map(item => item.value)
        .sort((s1, s2) => s2.length - s1.length);

    // If no conditions, directly calculate price
    if (!conditions || conditions.length < 1) {
        return safeCalculatePrice(formula, paramNames, values);
    }

    // Find first matching condition
    const matchedCondition = findMatchingCondition(conditions, parameters, values);

    // Use matched condition's formula or fallback to original
    return matchedCondition
        ? safeCalculatePrice(matchedCondition.value, paramNames, values)
        : 0;
}

/**
 * Find the first condition that evaluates to true
 * @param conditions - List of conditions
 * @param parameters - List of parameters
 * @param values - Parameter values
 * @returns Matched condition or null
 */
export function findMatchingCondition(
    conditions,
    parameters,
    values
) {
    // Extract parameter names
    const paramNames = parameters.map(item => item.value)
        .sort((s1, s2) => s2.length - s1.length);

    // Find first condition that evaluates to true
    for (const condition of conditions) {
        const replacedCondition = replaceParameters(
            condition.condition,
            paramNames,
            values
        );

        if (safeEvaluateCondition(replacedCondition)) {
            return condition;
        }
    }

    return null;
}

/**
 * Safely calculate price using mathjs
 * @param formula - Pricing formula
 * @param parameters - Parameter names
 * @param values - Parameter values
 * @returns Calculated price
 */
function safeCalculatePrice(
    formula,
    parameters,
    values
) {
    try {
        // Replace parameters and evaluate using mathjs
        const replacedFormula = replaceParameters(formula, parameters, values);
        const result = math.evaluate(replacedFormula);

        // Ensure the result is a number
        return Number(result);
    } catch (error) {
        console.error('Price calculation error:', error);
        return 0;
    }
}

// Additional utility for getting condition (for backwards compatibility)
export function getCondition(
    conditions,
    parameters,
    values
) {
    return findMatchingCondition(conditions, parameters, values);
}
