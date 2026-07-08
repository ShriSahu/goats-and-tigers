import * as Haptics from 'expo-haptics';

let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

function safe(fn: () => Promise<void>): void {
  if (!enabled) return;
  fn().catch(() => {
    // Haptics are a non-critical enhancement; ignore failures.
  });
}

export const haptics = {
  select(): void {
    safe(() => Haptics.selectionAsync());
  },
  move(): void {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },
  capture(): void {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  },
  win(): void {
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  lose(): void {
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  },
};
