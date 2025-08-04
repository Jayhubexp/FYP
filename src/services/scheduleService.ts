import { Schedule, PlaylistItem } from '../types/app';

class ScheduleService {
  private schedules: Schedule[] = [];

  initialize() {
    // Initialize with empty schedules array
    this.schedules = [];
  }

  getAllSchedules(): Schedule[] {
    return this.schedules;
  }

  createSchedule(scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>): Schedule {
    const newSchedule: Schedule = {
      ...scheduleData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.schedules.push(newSchedule);
    return newSchedule;
  }

  updateSchedule(id: string, updates: Partial<Schedule>): Schedule | null {
    const index = this.schedules.findIndex(schedule => schedule.id === id);
    if (index === -1) return null;

    this.schedules[index] = {
      ...this.schedules[index],
      ...updates,
      updatedAt: new Date()
    };

    return this.schedules[index];
  }

  deleteSchedule(id: string): boolean {
    const index = this.schedules.findIndex(schedule => schedule.id === id);
    if (index === -1) return false;

    this.schedules.splice(index, 1);
    return true;
  }

  addItemToSchedule(scheduleId: string, item: PlaylistItem): boolean {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) return false;

    schedule.items.push(item);
    schedule.updatedAt = new Date();
    return true;
  }

  removeItemFromSchedule(scheduleId: string, itemId: string): boolean {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) return false;

    const itemIndex = schedule.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;

    schedule.items.splice(itemIndex, 1);
    schedule.updatedAt = new Date();
    return true;
  }

  reorderScheduleItems(scheduleId: string, fromIndex: number, toIndex: number): boolean {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (!schedule) return false;

    const items = [...schedule.items];
    const [movedItem] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, movedItem);

    schedule.items = items;
    schedule.updatedAt = new Date();
    return true;
  }
}

export const scheduleService = new ScheduleService();