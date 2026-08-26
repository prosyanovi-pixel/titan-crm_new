import React, { useRef, useEffect } from 'react';
import { Mail as MailIcon } from 'lucide-react';
import { Mail } from '../types';
import { sanitizeHtml } from '../utils/componentUtils';

interface MailDisplayContentProps {
  mail: Mail;
}

export function MailDisplayContent({ mail }: MailDisplayContentProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const adjustIframeHeight = (iframe: HTMLIFrameElement | null) => {
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc?.body) return;
    const height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight, 400);
    iframe.style.height = `${height}px`;
  };

  return (
    <div className="px-8 py-4">
      {mail.htmlContent ? (
        <iframe
          ref={iframeRef}
          srcDoc={
            mail.htmlContent?.toLowerCase().includes('<html')
              ? sanitizeHtml(mail.htmlContent)
              : `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="UTF-8">
                    <style>
                      body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        padding: 0;
                        margin: 0;
                        line-height: 1.5;
                        color: #1a1a1a;
                        background-color: transparent;
                        word-wrap: break-word;
                      }
                      img {
                        max-width: 100% !important;
                        height: auto !important;
                      }
                      a {
                        color: #0066cc;
                        text-decoration: underline;
                      }
                      blockquote {
                        border-left: 3px solid #dee2e6;
                        margin: 1.5em 0;
                        padding-left: 1.5em;
                        color: #6c757d;
                      }
                      table {
                        border-collapse: collapse;
                      }
                    </style>
                  </head>
                  <body>
                    <div style="max-width: 100%; margin: 0 auto;">
                      ${sanitizeHtml(mail.htmlContent)}
                    </div>
                  </body>
                </html>
              `
          }
          sandbox="allow-same-origin allow-popups"
          style={{ width: '100%', border: 'none', minHeight: '400px' }}
          title="Content"
          onLoad={(e) => {
            const iframe = e.target as HTMLIFrameElement;
            adjustIframeHeight(iframe);
            if (iframe.contentDocument?.body) {
              new ResizeObserver(() => adjustIframeHeight(iframe)).observe(iframe.contentDocument.body);
            }
          }}
        />
      ) : (
        <div className="bg-muted/5 p-6 rounded-2xl border border-dashed border-muted-foreground/10">
          <div className="flex items-center gap-2 mb-4 text-muted-foreground/40">
            <MailIcon className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Текстовая версия</span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed font-mono">
            {mail.content || 'Нет содержимого'}
          </p>
        </div>
      )}
    </div>
  );
}
