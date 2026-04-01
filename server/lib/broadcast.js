// Shared broadcast state — extracted to break circular dependency between app.js and routes
export const activeConnections = new Map();
export const activeJobs = new Map();

export function broadcast(data) {
  const message = JSON.stringify(data);
  activeConnections.forEach((ws) => {
    if (ws.readyState === ws.OPEN) ws.send(message);
  });
}
