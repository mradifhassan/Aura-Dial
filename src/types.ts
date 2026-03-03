export interface Dial {
  id: string;
  url: string;
  title: string;
  groupId?: string;
  order: number;
}

export interface Group {
  id: string;
  name: string;
  order: number;
}

export interface AppState {
  dials: Dial[];
  groups: Group[];
}
