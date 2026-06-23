// Map temperature logs to chart points.
export const buildTemperatureData = (collectRequest) => {
    if (!collectRequest?.logistic_information?.temperature_logs) return [];

    return collectRequest.logistic_information.temperature_logs.map((log) => ({
        time: new Date(log.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        }),
        temperature: parseFloat(log.value),
        fullTimestamp: new Date(log.timestamp).toLocaleString(),
    }));
};

// Min/max/avg/count over the temperature logs (null when none).
export const buildTemperatureStats = (collectRequest) => {
    if (!collectRequest?.logistic_information?.temperature_logs?.length) return null;

    const temps = collectRequest.logistic_information.temperature_logs.map((l) =>
        parseFloat(l.value),
    );
    return {
        min: Math.min(...temps).toFixed(2),
        max: Math.max(...temps).toFixed(2),
        avg: (temps.reduce((sum, t) => sum + t, 0) / temps.length).toFixed(2),
        count: temps.length,
    };
};
