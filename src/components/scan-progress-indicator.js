import { LitElement, html, css } from 'lit';
import { t, LocalizeMixin } from '../services/i18n.js';

export class ScanProgressIndicator extends LocalizeMixin(LitElement) {
    static properties = {
        processed: { type: Number },
        found: { type: Number },
    };

    static styles = css`
        :host {
            display: block;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            max-height: 60px;
            background: var(--surface-color, #fff);
            box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
            padding: 0 16px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            gap: 8px;
            overflow: hidden;
        }
    `;

    constructor() {
        super();
        this.processed = 0;
        this.found = 0;
    }

    render() {
        return html`
            <span>${t('scan.progress', { processed: this.processed, found: this.found })}</span>
        `;
    }
}

customElements.define('scan-progress-indicator', ScanProgressIndicator);
