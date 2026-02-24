
import { STORAGE_KEYS, PRICE_PER_MILLION, TOTAL_CREDITS_CHARS } from '../constants';
import { UsageEntry, UsageStats } from '../types';

export function logUsage(chars: number, accountIndex: number = 0) {
  let key = STORAGE_KEYS.USAGE_LOG;
  if (accountIndex === 1) key = STORAGE_KEYS.USAGE_LOG_SECONDARY;
  else if (accountIndex === 2) key = STORAGE_KEYS.USAGE_LOG_THIRD;
  else if (accountIndex === 3) key = STORAGE_KEYS.USAGE_LOG_FOURTH;
  else if (accountIndex === 4) key = STORAGE_KEYS.USAGE_LOG_FIFTH;

  const log: UsageEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
  log.push({ timestamp: Date.now(), chars });
  localStorage.setItem(key, JSON.stringify(log));
}

export function getUsageStats(accountIndex: number = 0): UsageStats {
  let key = STORAGE_KEYS.USAGE_LOG;
  if (accountIndex === 1) key = STORAGE_KEYS.USAGE_LOG_SECONDARY;
  else if (accountIndex === 2) key = STORAGE_KEYS.USAGE_LOG_THIRD;
  else if (accountIndex === 3) key = STORAGE_KEYS.USAGE_LOG_FOURTH;
  else if (accountIndex === 4) key = STORAGE_KEYS.USAGE_LOG_FIFTH;

  const log: UsageEntry[] = JSON.parse(localStorage.getItem(key) || '[]');
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  const todayChars = log.filter(e => now - e.timestamp < dayMs).reduce((acc, e) => acc + e.chars, 0);
  const weekChars = log.filter(e => now - e.timestamp < weekMs).reduce((acc, e) => acc + e.chars, 0);
  const totalChars = log.reduce((acc, e) => acc + e.chars, 0);

  const calculateCost = (chars: number) => (chars / 1_000_000) * PRICE_PER_MILLION;

  return {
    today: { chars: todayChars, cost: calculateCost(todayChars) },
    week: { chars: weekChars, cost: calculateCost(weekChars) },
    total: { chars: totalChars, cost: calculateCost(totalChars) }
  };
}

export function getCreditInfo(totalUsedChars: number) {
  const remaining = Math.max(TOTAL_CREDITS_CHARS - totalUsedChars, 0);
  const remainingCost = (remaining / 1_000_000) * PRICE_PER_MILLION;
  const percent = (remaining / TOTAL_CREDITS_CHARS) * 100;

  return { remaining, remainingCost, percent };
}
