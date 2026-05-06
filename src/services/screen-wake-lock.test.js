import { acquireWakeLock, releaseWakeLock, isWakeLockActive } from './screen-wake-lock.js';
import { jest } from '@jest/globals';

describe('screen wake lock service', () => {
  let requestMock;
  let releaseMock;
  let originalWakeLock;
  let hiddenDescriptor;

  beforeEach(() => {
    hiddenDescriptor = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });

    releaseMock = jest.fn().mockResolvedValue(undefined);
    const addEventListenerMock = jest.fn();
    const sentinel = {
      release: releaseMock,
      addEventListener: addEventListenerMock,
    };

    requestMock = jest.fn().mockResolvedValue(sentinel);
    originalWakeLock = navigator.wakeLock;
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: {
        request: requestMock,
      },
    });
  });

  afterEach(() => {
    releaseWakeLock();

    if (hiddenDescriptor) {
      Object.defineProperty(document, 'hidden', hiddenDescriptor);
    }

    if (typeof originalWakeLock === 'undefined') {
      delete navigator.wakeLock;
    } else {
      Object.defineProperty(navigator, 'wakeLock', {
        configurable: true,
        value: originalWakeLock,
      });
    }
  });

  it('acquires wake lock when API is available', async () => {
    const ok = await acquireWakeLock();

    expect(ok).toBe(true);
    expect(requestMock).toHaveBeenCalledWith('screen');
    expect(isWakeLockActive()).toBe(true);
  });

  it('returns false when API is not available', async () => {
    delete navigator.wakeLock;

    const ok = await acquireWakeLock();

    expect(ok).toBe(false);
    expect(isWakeLockActive()).toBe(false);
  });

  it('is idempotent when already active', async () => {
    await acquireWakeLock();
    await acquireWakeLock();

    expect(requestMock).toHaveBeenCalledTimes(1);
  });

  it('releases lock and clears active state', async () => {
    await acquireWakeLock();

    releaseWakeLock();

    expect(releaseMock).toHaveBeenCalledTimes(1);
    expect(isWakeLockActive()).toBe(false);
  });

  it('re-requests wake lock when tab becomes visible again', async () => {
    await acquireWakeLock();
    releaseMock.mockClear();
    requestMock.mockClear();

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await Promise.resolve();
    expect(releaseMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await Promise.resolve();
    expect(requestMock).toHaveBeenCalledTimes(1);
  });
});
