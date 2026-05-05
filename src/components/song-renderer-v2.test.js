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
    expect(chordSpan.textContent).toBe('\u00A0');
  });
  it('renders multiple chords in one line', () => {
    const tpl = SongRendererV2.processSongLine('[Am]This is [F]a test [E7]line');
    const container = document.createElement('div');
    render(tpl, container);

    const chordSpans = container.querySelectorAll('span.chord');
    expect(chordSpans).toHaveLength(3);
    expect(chordSpans[0].getAttribute('data-text')).toBe('Am');
    expect(chordSpans[0].textContent).toBe('T');
    expect(chordSpans[1].getAttribute('data-text')).toBe('F');
    expect(chordSpans[1].textContent).toBe('a');
    expect(chordSpans[2].getAttribute('data-text')).toBe('E7');
    expect(chordSpans[2].textContent).toBe('l');
  });
  it('handles a line with only chords', () => {
    const tpl = SongRendererV2.processSongLine('[G][D][F#][Em][C][D]');
    const container = document.createElement('div');
    render(tpl, container);

    const chordSpans = container.querySelectorAll('span.chord');
    expect(chordSpans).toHaveLength(6);
    expect(chordSpans[0].getAttribute('data-text')).toBe('G');
    expect(chordSpans[0].textContent).toBe('\u00A0');
    expect(chordSpans[1].getAttribute('data-text')).toBe('D');
    expect(chordSpans[1].textContent).toBe('\u00A0');
    expect(chordSpans[2].getAttribute('data-text')).toBe('F#');
    expect(chordSpans[2].textContent).toBe('\u00A0');
    expect(chordSpans[3].getAttribute('data-text')).toBe('Em');
    expect(chordSpans[3].textContent).toBe('\u00A0');
    expect(chordSpans[4].getAttribute('data-text')).toBe('C');
    expect(chordSpans[4].textContent).toBe('\u00A0');
    expect(chordSpans[5].getAttribute('data-text')).toBe('D');
    expect(chordSpans[5].textContent).toBe('\u00A0');
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
