import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ChatbotSsoBridgeService } from '../../../../core/chatbot/chatbot-sso-bridge.service';
import { TokenStorageService } from '../../../../core/auth/token-storage.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-chatbot-shell',
  templateUrl: './chatbot-shell.component.html',
  styleUrl: './chatbot-shell.component.scss',
})
export class ChatbotShellComponent implements OnInit, OnDestroy {
  @ViewChild('chatbotFrame') private chatbotFrame?: ElementRef<HTMLIFrameElement>;

  private readonly sanitizer = inject(DomSanitizer);
  private readonly tokenStorage = inject(TokenStorageService);
  private readonly chatbotSsoBridge = inject(ChatbotSsoBridgeService);

  protected readonly adminUrl: SafeResourceUrl =
    this.sanitizer.bypassSecurityTrustResourceUrl(
      `${environment.chatbotAdminUrl.replace(/\/$/, '')}/`,
    );

  private readonly chatbotOrigin = new URL(environment.chatbotAdminUrl).origin;

  private readonly messageHandler = (event: MessageEvent): void => {
    if (event.origin !== this.chatbotOrigin) return;
    const data = event.data as { type?: string } | null;
    if (data?.type === 'nm-chatbot-sso-ready' || data?.type === 'nm-chatbot-sso-expired') {
      this.sendSsoToken();
    }
  };

  ngOnInit(): void {
    window.addEventListener('message', this.messageHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.messageHandler);
    this.chatbotSsoBridge.registerFrame(null);
  }

  protected onIframeLoad(): void {
    const frameWindow = this.chatbotFrame?.nativeElement.contentWindow ?? null;
    this.chatbotSsoBridge.registerFrame(frameWindow);
    this.sendSsoToken();
  }

  private sendSsoToken(): void {
    const token = this.tokenStorage.getAccessToken();
    if (!token) return;
    this.chatbotSsoBridge.sendToken(token);
  }
}
