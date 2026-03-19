import { useMemo } from 'react';

// Gamification: Streaks, Badges, Level, Daily Challenge

const ALL_BADGES = [
  { id: 'iron-sleeper', name: 'Iron Sleeper', icon: '😴', desc: '7+ hours sleep for 7 consecutive days', color: '#448AFF', requirement: 7 },
  { id: 'recovery-king', name: 'Recovery King', icon: '👑', desc: 'Hit 90%+ recovery score', color: '#00E676', requirement: 1 },
  { id: 'beast-mode', name: 'Beast Mode', icon: '💪', desc: '18+ strain in a single day', color: '#FF5252', requirement: 1 },
  { id: 'consistent', name: 'Consistent', icon: '📊', desc: '30-day data streak', color: '#B388FF', requirement: 30 },
  { id: 'zen-master', name: 'Zen Master', icon: '🧘', desc: 'HRV above personal average for 7 days', color: '#18FFFF', requirement: 7 },
  { id: 'early-bird', name: 'Early Bird', icon: '🌅', desc: 'Asleep before 11 PM for 7 consecutive days', color: '#FFD600', requirement: 7 },
  { id: 'night-owl', name: 'Night Owl', icon: '🦉', desc: 'Strain after 10 PM (late workout)', color: '#7C4DFF', requirement: 1 },
  { id: 'hydrated', name: 'Hydrated', icon: '💧', desc: 'Recovery green for 3 consecutive days', color: '#00BFA5', requirement: 3 },
  { id: 'marathon', name: 'Marathon', icon: '🏃', desc: '14+ strain for 3 days in a row', color: '#FF6D00', requirement: 3 },
  { id: 'comeback', name: 'Comeback', icon: '🔄', desc: 'Yellow/red recovery followed by green next day', color: '#69F0AE', requirement: 1 },
];

export function useGamification(records, sleepDebtAlltime) {
  return useMemo(() => {
    if (!records || records.length === 0) return { streaks: {}, badges: [], allBadges: [], level: {}, challenge: null, xpBreakdown: {}, longestStreak: 0, daysTracked: 0, badgeProgress: {} };

    const sorted = [...records].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // === STREAKS ===
    let recoveryStreak = 0;
    let sleepStreak = 0;
    let dataStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].recovery?.score > 66) recoveryStreak++;
      else break;
    }
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].sleep?.total_sleep_hrs >= 7) sleepStreak++;
      else break;
    }
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].recovery || sorted[i].sleep || sorted[i].strain) dataStreak++;
      else break;
    }

    // === LONGEST STREAK ===
    let longestStreak = 0;
    let currentRun = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].recovery || sorted[i].sleep || sorted[i].strain) {
        currentRun++;
        longestStreak = Math.max(longestStreak, currentRun);
      } else {
        currentRun = 0;
      }
    }

    // === BADGE PROGRESS ===
    const badgeProgress = {};
    const earnedBadges = [];
    const latest = sorted[sorted.length - 1];

    // Iron Sleeper progress
    let ironProgress = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].sleep?.total_sleep_hrs >= 7) ironProgress++;
      else break;
    }
    badgeProgress['iron-sleeper'] = { current: Math.min(ironProgress, 7), target: 7 };
    if (ironProgress >= 7) earnedBadges.push('iron-sleeper');

    // Recovery King progress
    const hasRecoveryKing = sorted.some(r => r.recovery?.score >= 90);
    badgeProgress['recovery-king'] = { current: hasRecoveryKing ? 1 : 0, target: 1, best: Math.max(...sorted.map(r => r.recovery?.score || 0)) };
    if (hasRecoveryKing) earnedBadges.push('recovery-king');

    // Beast Mode progress
    const hasBeastMode = sorted.some(r => r.strain?.strain >= 18);
    badgeProgress['beast-mode'] = { current: hasBeastMode ? 1 : 0, target: 1, best: Math.max(...sorted.map(r => r.strain?.strain || 0)) };
    if (hasBeastMode) earnedBadges.push('beast-mode');

    // Consistent progress
    badgeProgress['consistent'] = { current: Math.min(dataStreak, 30), target: 30 };
    if (dataStreak >= 30) earnedBadges.push('consistent');

    // Zen Master progress - HRV above personal average for 7 days
    const hrvValues = sorted.filter(r => r.recovery?.hrv != null).map(r => r.recovery.hrv);
    const avgHrv = hrvValues.length > 0 ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length : 0;
    let zenStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].recovery?.hrv != null && sorted[i].recovery.hrv > avgHrv) zenStreak++;
      else break;
    }
    badgeProgress['zen-master'] = { current: Math.min(zenStreak, 7), target: 7 };
    if (zenStreak >= 7) earnedBadges.push('zen-master');

    // Early Bird progress - asleep before 11 PM for 7 days
    let earlyStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const start = sorted[i].sleep?.start;
      if (start) {
        const hour = new Date(start).getHours();
        if (hour < 23 || hour >= 18) earlyStreak++;
        else break;
      } else break;
    }
    badgeProgress['early-bird'] = { current: Math.min(earlyStreak, 7), target: 7 };
    if (earlyStreak >= 7) earnedBadges.push('early-bird');

    // Night Owl - strain after 10 PM (any workout ending late)
    const hasNightOwl = sorted.some(r => {
      if (!r.strain?.workouts) return false;
      return r.strain.workouts.some(w => {
        const end = w.end ? new Date(w.end).getHours() : null;
        return end !== null && (end >= 22 || end < 4);
      });
    });
    badgeProgress['night-owl'] = { current: hasNightOwl ? 1 : 0, target: 1 };
    if (hasNightOwl) earnedBadges.push('night-owl');

    // Hydrated - recovery green (66%+) for 3 consecutive days
    let hydratedStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].recovery?.score >= 66) hydratedStreak++;
      else break;
    }
    badgeProgress['hydrated'] = { current: Math.min(hydratedStreak, 3), target: 3 };
    if (hydratedStreak >= 3) earnedBadges.push('hydrated');

    // Marathon - 14+ strain for 3 days in a row
    let marathonStreak = 0;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].strain?.strain >= 14) marathonStreak++;
      else break;
    }
    badgeProgress['marathon'] = { current: Math.min(marathonStreak, 3), target: 3 };
    if (marathonStreak >= 3) earnedBadges.push('marathon');

    // Comeback - yellow/red recovery followed by green next day
    let hasComeback = false;
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].recovery?.score;
      const curr = sorted[i].recovery?.score;
      if (prev != null && curr != null && prev < 66 && curr >= 66) {
        hasComeback = true;
        break;
      }
    }
    badgeProgress['comeback'] = { current: hasComeback ? 1 : 0, target: 1 };
    if (hasComeback) earnedBadges.push('comeback');

    // === BUILD BADGES ARRAYS ===
    const badges = ALL_BADGES
      .filter(b => earnedBadges.includes(b.id))
      .map(b => ({ ...b, earned: true, earnedDate: sorted[sorted.length - 1]?.date }));

    const allBadges = ALL_BADGES.map(b => ({
      ...b,
      earned: earnedBadges.includes(b.id),
      earnedDate: earnedBadges.includes(b.id) ? sorted[sorted.length - 1]?.date : null,
      progress: badgeProgress[b.id] || { current: 0, target: 1 },
    }));

    // === LEVEL SYSTEM ===
    const recentRecords = sorted.slice(-30);
    const avgRecovery = recentRecords.filter(r => r.recovery?.score != null).reduce((s, r) => s + r.recovery.score, 0) / (recentRecords.filter(r => r.recovery?.score != null).length || 1);
    const avgSleep = recentRecords.filter(r => r.sleep?.total_sleep_hrs != null).reduce((s, r) => s + r.sleep.total_sleep_hrs, 0) / (recentRecords.filter(r => r.sleep?.total_sleep_hrs != null).length || 1);

    const recoveryXp = Math.round(avgRecovery * 0.4);
    const sleepXp = Math.round((avgSleep / 9 * 100) * 0.3);
    const consistencyXp = Math.round(Math.min(dataStreak, 60) / 60 * 20);
    const badgeXp = earnedBadges.length * 5;
    const streakXp = Math.min(Math.max(recoveryStreak, sleepStreak, dataStreak), 30);

    const xp = recoveryXp + sleepXp + consistencyXp + badgeXp + streakXp;
    const levelNum = Math.max(1, Math.floor(xp / 8));
    const xpInLevel = xp % 8;
    const xpForNextLevel = 8;

    const xpBreakdown = {
      recovery: recoveryXp,
      sleep: sleepXp,
      consistency: consistencyXp,
      badges: badgeXp,
      streaks: streakXp,
      total: xp,
    };

    const levelNames = ['Rookie', 'Beginner', 'Regular', 'Committed', 'Dedicated', 'Strong', 'Advanced', 'Expert', 'Pro', 'Elite', 'Master', 'Legend', 'Mythic', 'Transcendent', 'Immortal'];
    const levelName = levelNames[Math.min(levelNum - 1, levelNames.length - 1)];

    const level = { num: levelNum, name: levelName, xp, xpInLevel, xpForNextLevel, progress: (xpInLevel / xpForNextLevel) * 100 };

    // === DAILY CHALLENGE ===
    let challenge = null;
    let challengesCompleted = 0;
    if (latest) {
      const sleep = latest.sleep?.total_sleep_hrs || 0;
      const recovery = latest.recovery?.score || 0;
      const strain = latest.strain?.strain || 0;

      // Count past "challenges completed" (days with good metrics)
      sorted.forEach(r => {
        let completed = 0;
        if (r.sleep?.total_sleep_hrs >= 7) completed++;
        if (r.recovery?.score >= 66) completed++;
        if (r.strain?.strain >= 10) completed++;
        if (completed >= 2) challengesCompleted++;
      });

      if (sleep < 7) {
        challenge = { text: 'Get 7+ hours of sleep tonight', icon: '🌙', color: '#448AFF', progress: Math.round((sleep / 7) * 100) };
      } else if (recovery < 50) {
        challenge = { text: 'Focus on recovery — take it easy today', icon: '🧘', color: '#00E676', progress: Math.round(recovery) };
      } else if (strain < 10 && recovery > 66) {
        challenge = { text: 'Push yourself — aim for 14+ strain', icon: '🔥', color: '#FF5252', progress: Math.round((strain / 14) * 100) };
      } else if (recoveryStreak >= 3) {
        challenge = { text: `Keep the streak alive! ${recoveryStreak} days strong`, icon: '🎯', color: '#FFD600', progress: 100 };
      } else {
        challenge = { text: 'Maintain balance — sleep well, train smart', icon: '⚡', color: '#B388FF', progress: 75 };
      }
      challenge.completedCount = challengesCompleted;
    }

    // === COMPARISON VS LAST WEEK ===
    const comparisons = {};
    if (sorted.length >= 14) {
      const thisWeek = sorted.slice(-7);
      const lastWeek = sorted.slice(-14, -7);

      const thisRecovery = thisWeek.filter(r => r.recovery?.score != null).reduce((s, r) => s + r.recovery.score, 0) / (thisWeek.filter(r => r.recovery?.score != null).length || 1);
      const lastRecovery = lastWeek.filter(r => r.recovery?.score != null).reduce((s, r) => s + r.recovery.score, 0) / (lastWeek.filter(r => r.recovery?.score != null).length || 1);
      comparisons.recovery = { diff: Math.round(thisRecovery - lastRecovery), improved: thisRecovery > lastRecovery };

      const thisSleep = thisWeek.filter(r => r.sleep?.total_sleep_hrs != null).reduce((s, r) => s + r.sleep.total_sleep_hrs, 0) / (thisWeek.filter(r => r.sleep?.total_sleep_hrs != null).length || 1);
      const lastSleep = lastWeek.filter(r => r.sleep?.total_sleep_hrs != null).reduce((s, r) => s + r.sleep.total_sleep_hrs, 0) / (lastWeek.filter(r => r.sleep?.total_sleep_hrs != null).length || 1);
      comparisons.sleep = { diff: Math.round((thisSleep - lastSleep) * 10) / 10, improved: thisSleep > lastSleep };

      const thisStrain = thisWeek.filter(r => r.strain?.strain != null).reduce((s, r) => s + r.strain.strain, 0) / (thisWeek.filter(r => r.strain?.strain != null).length || 1);
      const lastStrain = lastWeek.filter(r => r.strain?.strain != null).reduce((s, r) => s + r.strain.strain, 0) / (lastWeek.filter(r => r.strain?.strain != null).length || 1);
      comparisons.strain = { diff: Math.round((thisStrain - lastStrain) * 10) / 10, improved: thisStrain > lastStrain };
    }

    return {
      streaks: { recovery: recoveryStreak, sleep: sleepStreak, data: dataStreak },
      badges,
      allBadges,
      level,
      challenge,
      comparisons,
      xpBreakdown,
      longestStreak,
      daysTracked: sorted.length,
      badgeProgress,
    };
  }, [records, sleepDebtAlltime]);
}
