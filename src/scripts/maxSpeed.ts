/**
 * Flags an entry whose speed exceeds the legal limit of its location (warning/alert).
 * The hdop (GPS inaccuracy) and a fixed buffer are added to the limit before it counts as exceeded.
 */

const warningBuffer = 2; // km/h above limit + hdop
const alertBuffer = 10; // km/h above limit + hdop

export function getMaxSpeedSeverity(entry: { speed: { gps: number, total?: number }, hdop: number }, limit: number): Models.IMaxSpeed {
  const currentSpeed = entry.speed.gps * 3.6;
  const calcSpeed = entry.speed.total ? entry.speed.total * 3.6 : null;
  const harmonicMean = calcSpeed ? 2 * (currentSpeed * calcSpeed) / (currentSpeed + calcSpeed) : 0; // Harmonic Mean
  const raw = Math.floor(Math.max(currentSpeed, harmonicMean));

  const exceeds = (buffer: number) => raw > limit + entry.hdop + buffer;

  return { value: limit, warning: exceeds(warningBuffer), alert: exceeds(alertBuffer) };
}
