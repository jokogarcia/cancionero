import { render } from 'lit/html.js';
import { SongRendererV2 } from './song-renderer-v2.js';

describe('SongRendererV2.processSongLine', () => {
  it('has a placeholder test file setup', () => {
    expect(SongRendererV2).toBeDefined();
  });

  it('renders plain text with no chord markers', () => {
    const tpl = SongRendererV2.processSongLine('just lyrics');
    const container = document.createElement('div');
    render(tpl, container);

    expect(container.textContent).toBe('just lyrics');
    expect(container.querySelectorAll('span.chord')).toHaveLength(0);
  });

  it('wraps the next character after a chord marker', () => {
    const tpl = SongRendererV2.processSongLine('Hello [C]world');
    const container = document.createElement('div');
    render(tpl, container);

    const chordSpan = container.querySelector('span.chord');
    expect(chordSpan).not.toBeNull();
    expect(chordSpan.getAttribute('data-text')).toBe('C');
    expect(chordSpan.textContent).toBe('w');
    expect(container.textContent).toBe('Hello world');
  });

  it('renders trailing chord with a space placeholder', () => {
    const tpl = SongRendererV2.processSongLine('Line end [G]');
    const container = document.createElement('div');
    render(tpl, container);

    const chordSpan = container.querySelector('span.chord');
    expect(chordSpan).not.toBeNull();
    expect(chordSpan.getAttribute('data-text')).toBe('G');
    expect(chordSpan.textContent).toBe(' ');
  });
  
  it('returns preformatted blocks as <pre>', () => {
    const tpl = SongRendererV2.processSongLine('<pre>  A  B  </pre>');
    const container = document.createElement('div');
    render(tpl, container);

    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre.textContent).toBe('  A  B  ');
  });
});
