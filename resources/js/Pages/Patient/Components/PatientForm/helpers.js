// Calculate age from date of birth
export function calculateAge(dob) {
    if (!dob) return '';

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age.toString();
}

// Calculate date of birth from age
export function calculateDOB(ageValue) {
    if (!ageValue || isNaN(parseInt(ageValue))) return '';

    const today = new Date();
    const birthYear = today.getFullYear() - parseInt(ageValue);

    // Set to current month and day
    const dob = new Date(birthYear, today.getMonth(), today.getDate());

    // Format date as YYYY-MM-DD for input field
    return dob.toISOString().split('T')[0];
}
