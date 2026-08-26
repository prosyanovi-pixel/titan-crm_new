
import { api } from './api';

type LogLevel = 'info' | 'warn' | 'error';

class Logger {
  private userId: string | null = '1'; // Default mock user

  public setUserId(id: string) {
    this.userId = id;
  }

  private async log(level: LogLevel, message: string, details?: unknown) {
    // Always log to browser console
    if (level === 'error') {
      console.error(message, details);
    } else if (level === 'warn') {
      console.warn(message, details);
    } else {
      console.log(message, details);
    }

    // Send to backend
    try {
      await api.post('/logs', {
        level,
        source: 'frontend',
        message,
        details,
        userId: this.userId
      });
    } catch (e) {
      // Prevent infinite loop if logger fails
      console.error('Failed to send log to server', e);
    }
  }

  public info(message: string, details?: unknown) {
    this.log('info', message, details);
  }

  public warn(message: string, details?: unknown) {
    this.log('warn', message, details);
  }

  public error(message: string, details?: unknown) {
    this.log('error', message, details);
  }
}

export const logger = new Logger();
