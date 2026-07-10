/**
 * Validates the workflow action form. Required parameters must have a value;
 * rejection additionally requires details and a return-to section.
 * Returns an errors object keyed by field/parameter name — empty when valid.
 */
export function validateWorkflowAction(acceptanceItemState, isReject) {
    let errors = {};

    acceptanceItemState?.parameters?.forEach((item) => {
        if (!item.value && item.required)
            errors = { ...errors, [item.name]: `Please enter ${item.name} value` };
    });

    if (isReject) {
        if (!acceptanceItemState.details)
            errors = { ...errors, details: `Please provide rejection details` };

        if (acceptanceItemState.next == null)
            errors = { ...errors, next: `Please select a section to return to` };
    }

    return errors;
}
