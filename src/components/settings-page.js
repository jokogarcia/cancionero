import { LitElement, html, css } from 'lit';
import { getSettings, updateSettings, resetSettings, applyTheme, applyFontSize } from '../services/settings.js';
import { getFavorites } from '../services/favorites.js';
import {
    clearLocalFolder,
    getLocalFolderName,
    isLocalFolderSupported,
    setLocalFolderHandle,
} from '../services/local-folder.js';
import './scan-progress-indicator.js';
import { startFolderScan } from '../services/local-songs-v2.js';
import { t, getLanguageSetting, setLanguageSetting, LocalizeMixin } from '../services/i18n.js';
import './app-icon.js';
function navigate(path) {
    history.pushState(null, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}
async function pickLocalFolder() {
    if (!isLocalFolderSupported()) {
        throw new Error('Your browser does not support selecting a local folder');
    }
    
    try {
        const handle = await window.showDirectoryPicker({ id: 'cancionero-songs', mode: 'read' });
        return handle;
    } catch (err) {
        if (err && err.name === 'AbortError') return null;
        throw err;
    }
}
export class SettingsPage extends LocalizeMixin(LitElement) {
    static properties = {
        _settings: { type: Object, state: true },
        _favCount: { type: Number, state: true },
        _folderName: { type: String, state: true },
        _isScanning: { type: Boolean, state: true },
        _scannedFilesCount: { type: Number, state: true },
        _foundSongsCount: { type: Number, state: true },
    };

    constructor() {
        super();
        this._settings = getSettings();
        this._favCount = getFavorites().length;
        this._folderName = getLocalFolderName();
    }

    _onScrollRateChange(e) {
        const v = parseFloat(e.target.value);
        if (!Number.isNaN(v) && v > 0) {
            this._settings = updateSettings({ scrollRate: v });
        }
    }

    _onFontSizeChange(e) {
        const v = parseFloat(e.target.value);
        if (!Number.isNaN(v) && v > 0) {
            this._settings = updateSettings({ fontSize: v });
            applyFontSize(v);
        }
    }

    _onThemeChange(e) {
        const theme = e.target.value;
        this._settings = updateSettings({ theme });
        applyTheme(theme);
    }

    _clearFavorites() {
        if (!confirm(t('settings.confirmClearFavorites'))) return;
        localStorage.removeItem('cancionero_favorites');
        this._favCount = 0;
    }

    _reset() {
        if (!confirm(t('settings.confirmReset'))) return;
        this._settings = resetSettings();
        applyTheme(this._settings.theme);
        applyFontSize(this._settings.fontSize);
    }

    async _pickFolder() {
        try {
            const result = await pickLocalFolder();
            if (result) {
                this._folderName = result.name;
                this._isScanning = true;
                // The actual scan will be triggered by the home page when it detects the folder name change, so we just need to wait for that to finish
                const onScanProgress = (e) => {
                    if (e.detail.finished) {
                        this._isScanning = false;
                        window.removeEventListener('local-folder-scan-progress', onScanProgress);
                    }
                    this._scannedFilesCount = e.detail.processed;
                    this._foundSongsCount = e.detail.found;
                };
                window.addEventListener('local-folder-scan-progress', onScanProgress);
                updateSettings({ localFolder: { name: result.name } });
                await setLocalFolderHandle(result);
                startFolderScan(result);
                
            }
        } catch (err) {
            alert('Could not select folder: ' + err.message);
        }
    }

    async _clearFolder() {
        await clearLocalFolder();
        this._folderName = null;
    }

    _onLanguageChange(e) {
        setLanguageSetting(e.target.value);
    }

    render() {
        const { scrollRate, fontSize, theme } = this._settings;
        const langSetting = getLanguageSetting();
        const favHint = this._favCount === 1
            ? t('settings.favoritesHint')
            : t('settings.favoritesHintPlural', { count: this._favCount });
        return html`
            <header>
                <button class="back-btn" title=${t('settings.back')} aria-label=${t('settings.back')} @click=${() => navigate('/')}><app-icon name="arrow-left" .size=${20}></app-icon></button>
                <h1>${t('settings.title')}</h1>
            </header>

            <main>
                <section>
                    <h2>${t('settings.playback')}</h2>
                    <label class="row">
                        <span class="label">
                            <span class="name">${t('settings.scrollRate')}</span>
                            <span class="hint">${t('settings.scrollRateHint')}</span>
                        </span>
                        <input
                            type="number"
                            min="0.001"
                            max="0.5"
                            step="0.001"
                            .value=${String(scrollRate)}
                            @input=${this._onScrollRateChange}
                        />
                    </label>
                </section>

                <section>
                    <h2>${t('settings.display')}</h2>
                    <label class="row">
                        <span class="label">
                            <span class="name">${t('settings.fontSize')}</span>
                            <span class="hint">${t('settings.fontSizeHint', { size: fontSize.toFixed(2) })}</span>
                        </span>
                        <input
                            type="range"
                            min="0.75"
                            max="2"
                            step="0.05"
                            .value=${String(fontSize)}
                            @input=${this._onFontSizeChange}
                        />
                    </label>
                    <label class="row">
                        <span class="label">
                            <span class="name">${t('settings.theme')}</span>
                            <span class="hint">${t('settings.themeHint')}</span>
                        </span>
                        <select .value=${theme} @change=${this._onThemeChange}>
                            <option value="system">${t('settings.themeSystem')}</option>
                            <option value="light">${t('settings.themeLight')}</option>
                            <option value="dark">${t('settings.themeDark')}</option>
                        </select>
                    </label>
                    <label class="row">
                        <span class="label">
                            <span class="name">${t('settings.language')}</span>
                            <span class="hint">${t('settings.languageHint')}</span>
                        </span>
                        <select .value=${langSetting} @change=${this._onLanguageChange}>
                            <option value="system">${t('settings.languageSystem')}</option>
                            <option value="en">${t('settings.languageEn')}</option>
                            <option value="es">${t('settings.languageEs')}</option>
                            <option value="de">${t('settings.languageDe')}</option>
                        </select>
                    </label>
                </section>

                <section>
                    <h2>${t('settings.library')}</h2>
                    <div class="row">
                        <span class="label">
                            <span class="name">${t('settings.localLocation')}</span>
                            <span class="hint">
                                ${!isLocalFolderSupported()
                                    ? t('settings.notSupported')
                                    : this._folderName
                                        ? html`${t('settings.scanningFolderPrefix')}<code>${this._folderName}</code>${t('settings.scanningFolderSuffix')}`
                                        : t('settings.selectFolderHint')}
                            </span>
                        </span>
                        <span class="button-group">
                            <button
                                class="action-btn"
                                ?disabled=${!isLocalFolderSupported()}
                                @click=${this._pickFolder}
                            >${this._folderName ? t('settings.changeFolder') : t('settings.selectFolder')}</button>
                            ${this._folderName ? html`
                                <button class="danger-btn" @click=${this._clearFolder}>${t('settings.clear')}</button>
                            ` : ''}
                        </span>
                    </div>
                </section>

                <section>
                    <h2>${t('settings.data')}</h2>
                    <div class="row">
                        <span class="label">
                            <span class="name">${t('settings.favoritesName')}</span>
                            <span class="hint">${favHint}</span>
                        </span>
                        <button class="danger-btn" ?disabled=${this._favCount === 0} @click=${this._clearFavorites}>
                            ${t('settings.clearFavorites')}
                        </button>
                    </div>
                    <div class="row">
                        <span class="label">
                            <span class="name">${t('settings.resetSettings')}</span>
                            <span class="hint">${t('settings.resetHint')}</span>
                        </span>
                        <button class="danger-btn" @click=${this._reset}>${t('settings.reset')}</button>
                    </div>
                </section>
            </main>
            ${this._isScanning ? html`
            <scan-progress-indicator
                .processed=${this._scannedFilesCount}
                .found=${this._foundSongsCount}
            ></scan-progress-indicator>
            ` : ''}
        `;
    }

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            width: 100%;
            min-height: 100svh;
            box-sizing: border-box;
        }

        header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 20px 16px 12px;
            border-bottom: 1px solid var(--border, #e5e4e7);
        }

        h1 {
            margin: 0;
            font-size: 1.6rem;
            color: var(--text-h, #08060d);
        }

        h2 {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-h, #08060d);
            margin: 0 0 8px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .back-btn {
            background: none;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 6px;
            width: 40px;
            height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            cursor: pointer;
            color: var(--text-h, #08060d);
        }

        .back-btn:hover {
            background: var(--accent-bg, rgba(170, 59, 255, 0.08));
        }

        main {
            flex: 1;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        section {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            gap: 16px;
            border-radius: 8px;
        }

        .row:hover {
            background: var(--accent-bg, rgba(170, 59, 255, 0.06));
        }

        .label {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
            text-align: left;
        }

        .name {
            font-weight: 600;
            font-size: 1rem;
            color: var(--text-h, #08060d);
        }

        .hint {
            font-size: 0.85rem;
            color: var(--text, #6b6375);
        }

        input[type="number"],
        select {
            height: 36px;
            padding: 4px 10px;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 6px;
            background: var(--bg, #fff);
            color: var(--text-h, #08060d);
            font: inherit;
        }

        input[type="number"] {
            width: 96px;
            text-align: right;
        }

        input[type="range"] {
            width: 180px;
        }

        .button-group {
            display: inline-flex;
            gap: 8px;
        }

        .action-btn {
            background: var(--accent, #aa3bff);
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 8px 14px;
            font: inherit;
            cursor: pointer;
            transition: opacity 0.15s;
        }

        .action-btn:hover:not(:disabled) {
            opacity: 0.88;
        }

        .action-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        code {
            font-family: var(--mono, ui-monospace, monospace);
            padding: 1px 4px;
            background: var(--code-bg, #f4f3ec);
            border-radius: 3px;
        }

        .danger-btn {
            background: none;
            border: 1px solid var(--border, #e5e4e7);
            border-radius: 6px;
            padding: 8px 14px;
            font: inherit;
            color: #c0392b;
            cursor: pointer;
            transition: background 0.15s;
        }

        .danger-btn:hover:not(:disabled) {
            background: rgba(192, 57, 43, 0.08);
            border-color: rgba(192, 57, 43, 0.5);
        }

        .danger-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        @media (min-width: 600px) {
            header {
                padding: 20px 24px 16px;
            }

            main {
                padding: 24px;
            }
        }

        @media (min-width: 900px) {
            header {
                padding: 24px 32px 20px;
            }

            main {
                padding: 28px 32px;
            }
        }
    `;
}

customElements.define('settings-page', SettingsPage);
