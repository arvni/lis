/**
 * Workflow parameters arrive either as an array or a JSON string depending on
 * how the state row was loaded — normalize to an array.
 */
export function parseParameters(parameters) {
    return typeof parameters !== 'string' ? parameters : JSON.parse(parameters);
}
