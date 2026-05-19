export interface SearchProfile {
  id: string;
  name: string;
  modifier: string;
  enabled: boolean;
  isDefault: boolean;
}

export interface SearchEngineDescriptor {
  id: string;
  name: string;
  hostnames: readonly string[];
  queryParam: string;
  isResultsPage: (url: URL) => boolean;
}

export interface TabState {
  filterDisabled: boolean;
  activeProfileId?: string;
}

export type RuntimeMessage =
  | { type: 'getState' }
  | { type: 'setFilterDisabled'; disabled: boolean }
  | { type: 'setActiveProfile'; profileId: string | null }
  | { type: 'openOptions' }
  | { type: 'invokeAction'; action: 'toggle' | 'enable' | 'disable' | 'cycle' | 'cycleBack' };

export type RuntimeResponse =
  | {
      type: 'state';
      profiles: SearchProfile[];
      tabState: TabState;
      activeProfile: SearchProfile | null;
    }
  | { type: 'ack' };
