export interface Alarm {
  id: string;
  time: string;
  period: 'AM' | 'PM';
  days: string[];
  sound: string;
  enabled: boolean;
  focus: 'Career' | 'Wellness' | 'Creativity' | 'Mindfulness';
  customImage?: string;
}

export interface Task {
  id: string;
  text: string;
  subtext: string;
  icon: string;
  completed: boolean;
}

export type Screen = 'alarms' | 'feed' | 'profile' | 'new-alarm' | 'wake-up' | 'motivate';
