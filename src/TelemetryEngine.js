export const TelemetryEngine = {
  log: (event, metadata = {}) => {
    const logEntry = {
      event,
      timestamp: Date.now(),
      metadata,
    };
    console.log(JSON.stringify(logEntry));
  }
};
