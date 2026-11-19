// Map validation errors (client-side or from the server) onto the form's steps.
// Server keys can be nested ("method_tests.0.method.id"), so a step owns a field and
// everything under it.

const owns = (field, key) => key === field || key.startsWith(`${field}.`);

/** Error keys that belong to one step. */
export const stepErrorKeys = (step, errors = {}) =>
    Object.keys(errors ?? {}).filter((key) =>
        (step?.errorFields ?? []).some((field) => owns(field, key)),
    );

/** Index of the first step with an error, or -1. */
export const firstErrorStep = (steps, errors = {}) =>
    steps.findIndex((step) => stepErrorKeys(step, errors).length > 0);

/**
 * Every error as { key, message, stepIndex } so the form can list them all; stepIndex is -1
 * for an error no step owns.
 */
export const listErrors = (steps, errors = {}) =>
    Object.entries(errors ?? {}).map(([key, message]) => ({
        key,
        message: Array.isArray(message) ? message.join(' ') : String(message),
        stepIndex: steps.findIndex((step) =>
            (step.errorFields ?? []).some((field) => owns(field, key)),
        ),
    }));
