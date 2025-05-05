export const calcPrice = (formula, parameters, values, conditions) => {
    const paras = parameters.map(item => item.value).sort((s1, s2) => s1.length - s2.length);
    if (!conditions || conditions.length < 1)
        return getPrice(formula, paras, values);
    let condition = getCondition( conditions,parameters, values);
    if (condition)
        return getPrice(condition["value"], paras, values);
    return 0;
}
function getPrice(formula, paras, values) {
    return eval(replaceParameters(formula, paras, values));
}
export function getCondition(conditions, parameters, values) {
    const paras = parameters.map(item => item.value).sort((s1, s2) => s1.length - s2.length);
    if (conditions.length)
        for (let j = 0; j < conditions.length; j++) {
            let condition=replaceParameters(conditions[j]["condition"], paras, values)
            if (eval(condition))
                return conditions[j]
        }
    return null;
}
function replaceParameters(formula, paras, values) {
    let temp = formula + "";
    for (let i = 0; i < paras.length; i++) {
        temp = temp.replaceAll(paras[i], String(Number(values?.[paras[i]])));
    }
    return temp;
}
