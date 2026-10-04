/**
 * Ported from the former client-side `exceed()` in src/client/scripts/maxSpeed.ts.
 * Computes the severity (warning/alert) of exceeding a location's legal speed limit,
 * using an hdop-based margin to account for GPS inaccuracy.
 */

// hdop margin multiplier for the lower/"main" (warning) threshold
const HDOP_MULTIPLIER_WARNING = 1.5;
// hdop margin multiplier for the higher/"alert" threshold
const HDOP_MULTIPLIER_ALERT = 1;
// additional buffer (km/h) added on top of the limit for the alert threshold
const ALERT_SPEED_BUFFER_KMH = 10;

export function getMaxSpeedSeverity(entry: { speed: { gps: number, total?: number }, hdop: number }, limit: number): Models.IMaxSpeed {
  const currentSpeed = entry.speed.gps * 3.6;
  const calcSpeed = entry.speed.total ? entry.speed.total * 3.6 : null;
  const harmonicMean = calcSpeed ? 2 * (currentSpeed * calcSpeed) / (currentSpeed + calcSpeed) : 0; // Harmonic Mean
  const raw = Math.floor(Math.max(currentSpeed, harmonicMean));

  const alert = Math.floor(raw - entry.hdop * HDOP_MULTIPLIER_ALERT) > limit + ALERT_SPEED_BUFFER_KMH;
  const warning = alert || Math.floor(raw - entry.hdop * HDOP_MULTIPLIER_WARNING) > limit;

  return { value: limit, warning, alert };
}
