import {css} from 'lit';
export const globalStyles = css`
    :host {
        --accent: #d40000;
        --accent-bg: rgba(212, 0, 0, 0.15);
        --accent-border: rgba(212, 0, 0, 0.5);
        --bg: #fff;
        --border: #ccc;
        --chord-fg: #6b6375;
        --code-bg: #f4f3ec;
        --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
        --heading: system-ui, 'Segoe UI', Roboto, sans-serif;
        --mono: ui-monospace, Consolas, monospace;
        --shadow:
          rgba(0, 0, 0, 0.1) 0 10px 15px -3px,
          rgba(0, 0, 0, 0.05) 0 4px 6px -2px;
        --social-bg: rgba(255, 255, 255, 0.8);
        --song-font-scale: 1;
        --text: #6b5355;
        --text-h: #d40000;
    }
        @media (prefers-color-scheme: dark) {
        :host {
          --text: #9ca3af;
          --text-h: #ffcc00;
          --bg: #16171d;
          --border: #2e303a;
          --code-bg: #1f2028;
          --accent: #ffcc00;
          --accent-bg: rgba(255, 204, 0, 0.15);
          --accent-border: rgba(255, 204, 0, 0.5);
          --social-bg: rgba(47, 48, 58, 0.5);
          --shadow:
            rgba(0, 0, 0, 0.4) 0 10px 15px -3px,
            rgba(0, 0, 0, 0.25) 0 4px 6px -2px;
        }
      }
    `