export interface HpCamSession {
  sessionId: string;
  pairingCode: string;
  deviceId: string;
  status: 'waiting' | 'paired' | 'active' | 'ended';
  hasViewer: boolean;
  viewerDeviceId?: string;
  createdAt: string;
  pairedAt?: string;
  expiresAt: string;
  lastActivity: string;
}

export interface WebRTCSignal {
  id: string;
  sessionId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  from: 'mobile' | 'viewer';
  to: 'mobile' | 'viewer';
  data: any;
  timestamp: string;
  delivered: boolean;
}

export interface CreateSessionInput {
  deviceId: string;
}

export interface JoinSessionInput {
  pairingCode?: string;
  sessionId?: string;
  deviceId: string;
}

export interface SendSignalInput {
  sessionId: string;
  type: string;
  from: string;
  data: any;
}

export interface GetSignalsQuery {
  forDevice: 'mobile' | 'viewer';
  since?: string;
}
