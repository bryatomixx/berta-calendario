import type { Status, Task } from './types';

/** True when a task is moving into "hecho" without recorded hours. */
export function needsHoursPrompt(task: Task, newStatus: Status): boolean {
  return newStatus === 'hecho' && (task.hours == null || task.hours === 0);
}

/**
 * Move `taskId` into `newStatus` at `newIndex`, then renumber `position`
 * for every task in the destination column. Returns a new array; the
 * input is not mutated. Tasks in other columns keep their position.
 */
export function reorderTasks(
  tasks: Task[],
  taskId: string,
  newStatus: Status,
  newIndex: number,
): Task[] {
  const moved = tasks.find((t) => t.id === taskId);
  if (!moved) return tasks;

  const destination = tasks
    .filter((t) => t.status === newStatus && t.id !== taskId)
    .sort((a, b) => a.position - b.position);

  destination.splice(newIndex, 0, { ...moved, status: newStatus });

  const positionById = new Map<string, number>();
  destination.forEach((t, index) => positionById.set(t.id, index));

  return tasks.map((t) => {
    if (t.id === taskId) {
      return { ...t, status: newStatus, position: positionById.get(taskId) ?? 0 };
    }
    if (positionById.has(t.id)) {
      return { ...t, position: positionById.get(t.id)! };
    }
    return t;
  });
}
