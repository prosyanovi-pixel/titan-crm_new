/**
 * Utility for rendering text with clickable links
 * Converts URLs in plain text to clickable <a> elements
 */

import React from 'react';

/**
 * Regex pattern to match URLs including very long ones
 * Matches:
 * - http:// and https:// protocols
 * - www. prefixes
 * - Various domain extensions
 * - Query parameters and fragments (including very long ones like the Nalog.ru example)
 */
const URL_REGEX = /https?:\/\/[^\s<>[\]{}|"'()]*[^\s<>[\]{}|"'().,:;!?]/gi;

interface RenderLinkOptions {
  target?: string;
  rel?: string;
  className?: string;
}

/**
 * Parse text and convert URLs to clickable links
 * Handles very long URLs like https://service.nalog.ru/ri-repl.do?t=58A29C7C02057E68543FAEB3F0B60E9DACA57FCC277CB8AA7E59F5934CF2D2F6
 * 
 * @param text - Plain text that may contain URLs
 * @param options - Options for link rendering
 * @returns Array of React elements (text nodes and link elements)
 */
export function renderTextWithLinks(
  text: string,
  options: RenderLinkOptions = {}
): React.ReactElement[] {
  const {
    target = '_blank',
    rel = 'noopener noreferrer',
    className = 'text-blue-600 hover:text-blue-700 hover:underline cursor-pointer'
  } = options;

  if (!text) return [];

  const parts: React.ReactElement[] = [];
  let lastIndex = 0;
  let linkCount = 0;

  // Find all URLs in the text
  let match;
  const matches: Array<{ url: string; start: number; end: number }> = [];

  while ((match = URL_REGEX.exec(text)) !== null) {
    matches.push({
      url: match[0],
      start: match.index,
      end: match.index + match[0].length
    });
  }

  // Build parts array
  matches.forEach((urlMatch) => {
    // Add text before the URL
    if (urlMatch.start > lastIndex) {
      parts.push(
        React.createElement(
          React.Fragment,
          { key: `text-${lastIndex}` },
          text.substring(lastIndex, urlMatch.start)
        )
      );
    }

    // Add the clickable link
    parts.push(
      React.createElement(
        'a',
        {
          key: `link-${linkCount}`,
          href: urlMatch.url,
          target,
          rel,
          className,
          title: urlMatch.url,
          onClick: (e: React.MouseEvent) => {
            // Allow opening in new tab/window
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
              e.preventDefault();
              window.open(urlMatch.url, target);
            }
          }
        },
        // Display truncated URL if very long
        urlMatch.url.length > 60
          ? `${urlMatch.url.substring(0, 57)}...`
          : urlMatch.url
      )
    );

    linkCount++;
    lastIndex = urlMatch.end;
  });

  // Add remaining text after last URL
  if (lastIndex < text.length) {
    parts.push(
      React.createElement(
        React.Fragment,
        { key: `text-end-${lastIndex}` },
        text.substring(lastIndex)
      )
    );
  }

  // If no URLs found, return original text in array
  if (parts.length === 0) {
    return [React.createElement(React.Fragment, { key: 'text-only' }, text)];
  }

  return parts;
}

/**
 * Component that wraps text and converts URLs to clickable links
 */
export interface TextWithLinksProps {
  text: string;
  className?: string;
  linkClassName?: string;
  target?: string;
  rel?: string;
  as?: React.ElementType;
}

export const TextWithLinks: React.FC<TextWithLinksProps> = ({
  text,
  className,
  linkClassName,
  target = '_blank',
  rel = 'noopener noreferrer',
  as: Component = 'p'
}) => {
  const links = renderTextWithLinks(text, {
    target,
    rel,
    className: linkClassName
  });

  return React.createElement(
    Component,
    { className },
    ...links
  );
};

export default TextWithLinks;
