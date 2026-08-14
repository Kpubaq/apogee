/**
 * Apogee - Session & Multi-User Manager
 */

export interface UserSession {
  userId: string;
  channelId: 'telegram' | 'discord' | 'cli' | 'api';
  chatId: string;
  activeAppTarget: 'ide' | 'agent' | 'ag2';
  lastActive: number;
}

export class SessionManager {
  private sessions: Map<string, UserSession> = new Map();
  private allowedUsers: Set<string> = new Set();
  private selfChatMode: boolean = false;

  constructor(allowedUsersList: string[] = []) {
    allowedUsersList.forEach(u => this.allowedUsers.add(u.trim().toLowerCase()));
  }

  public isAuthorized(channel: string, userId: string): boolean {
    if (this.allowedUsers.size === 0) return true;
    return this.allowedUsers.has(userId.toLowerCase());
  }

  public getOrCreateSession(
    channelId: 'telegram' | 'discord' | 'cli' | 'api',
    userId: string,
    chatId: string
  ): UserSession {
    const key = `${channelId}:${userId}`;
    let session = this.sessions.get(key);

    if (!session) {
      session = {
        userId,
        channelId,
        chatId,
        activeAppTarget: 'ide',
        lastActive: Date.now()
      };
      this.sessions.set(key, session);
    } else {
      session.lastActive = Date.now();
    }

    return session;
  }

  public setAppTarget(userId: string, channelId: string, target: 'ide' | 'agent' | 'ag2'): void {
    const key = `${channelId}:${userId}`;
    const session = this.sessions.get(key);
    if (session) {
      session.activeAppTarget = target;
    }
  }
}
