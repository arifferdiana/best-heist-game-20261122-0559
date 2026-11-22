// The alarm meter: one number, 0 to 100. Being seen fills it; staying hidden drains it.
// At 100 the wardens have the thief. The bands are what the HUD colours by.

import { ALARM } from './config.js';

/** A fresh meter, silent. */
export function createAlarm() {
  return { value: 0 };
}

/**
 * Move the meter one step: `seen` fills it, hidden drains it. Returns true the moment it
 * reaches 100 (the catch), false otherwise.
 */
export function updateAlarm(alarm, dt, seen) {
  alarm.value += (seen ? ALARM.rise : -ALARM.decay) * dt;
  if (alarm.value >= 100) {
    alarm.value = 100;
    return true;
  }
  if (alarm.value < 0) alarm.value = 0;
  return false;
}

/** The meter's band: calm below warn, wary up to critical, critical above it. */
export function alarmBand(alarm) {
  if (alarm.value >= ALARM.critical) return 'critical';
  if (alarm.value >= ALARM.warn) return 'wary';
  return 'calm';
}
