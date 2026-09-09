import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Cross-origin bridge between ERP shell and embedded chatbot admin iframe. */
@Injectable({ providedIn: 'root' })
export class ChatbotSsoBridgeService {
  private frameWindow: Window | null = null;
  private readonly chatbotOrigin = new URL(environment.chatbotAdminUrl).origin;

  registerFrame(frameWindow: Window | null): void {
    this.frameWindow = frameWindow;
  }

  sendToken(token: string): void {
    if (!token) return;
    this.frameWindow?.postMessage({ type: 'nm-chatbot-sso', token }, this.chatbotOrigin);
  }

  sendLogout(): void {
    this.frameWindow?.postMessage({ type: 'nm-chatbot-sso-logout' }, this.chatbotOrigin);
  }
}
