interface TaskWithUpdatedAt {
  status: string;
  updated_at?: string | null;
}

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function calculateStreakFromDates(completedDatesList: string[]): number {
  if (!completedDatesList || completedDatesList.length === 0) return 0;
  const completedDates = new Set(completedDatesList);

  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let checkDate = new Date();
  if (completedDates.has(todayStr)) {
    // Start from today
  } else if (completedDates.has(yesterdayStr)) {
    // Start from yesterday
    checkDate = yesterday;
  } else {
    return 0;
  }

  let streak = 0;
  while (true) {
    const checkDateStr = getLocalDateString(checkDate);
    if (completedDates.has(checkDateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates the active streak based on consecutive days with at least one task completed.
 * A day counts only if at least one task is marked as "done".
 * If today has no completed tasks but yesterday did, the streak is maintained.
 * 
 * @param tasks List of user tasks from Supabase
 * @returns number Active streak count
 */
export function calculateStreak(tasks: TaskWithUpdatedAt[]): number {
  if (!tasks) return 0;
  const completedTasks = tasks.filter(t => t.status === "done");
  if (completedTasks.length === 0) return 0;

  const completedDatesList: string[] = [];
  completedTasks.forEach(task => {
    if (task.updated_at) {
      completedDatesList.push(getLocalDateString(new Date(task.updated_at)));
    }
  });

  return calculateStreakFromDates(completedDatesList);
}
