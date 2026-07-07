import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';

export function useIdleLogout({
  idleMs = 4 * 60 * 1000,
  warnMs = 60 * 1000,
  onWarn,
  onReset,
  onLogout,
} = {}) {
  const idleTimer = useRef(null);
  const warnTimer = useRef(null);
  const isWarning = useRef(false);
  const backgroundTime = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(idleTimer.current);
    clearTimeout(warnTimer.current);
  }, []);

  const startIdleTimer = useCallback(() => {
    clearTimers();
    isWarning.current = false;

    idleTimer.current = setTimeout(() => {
      isWarning.current = true;
      onWarn?.();

      warnTimer.current = setTimeout(() => {
        onLogout?.();
      }, warnMs);
    }, idleMs);
  }, [clearTimers, idleMs, warnMs, onWarn, onLogout]);

  // Called from SessionGuard on every touch
  const resetActivity = useCallback(() => {
    if (isWarning.current) {
      onReset?.();
    }
    startIdleTimer();
  }, [startIdleTimer, onReset]);

  // AppState — detect background/foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTime.current = Date.now();
        clearTimers();
      } else if (nextState === 'active') {
        if (backgroundTime.current) {
          const elapsed = Date.now() - backgroundTime.current;
          backgroundTime.current = null;
          if (elapsed > idleMs) {
            // Was in background longer than idle threshold → warn immediately
            isWarning.current = true;
            onWarn?.();
            warnTimer.current = setTimeout(() => onLogout?.(), warnMs);
          } else {
            startIdleTimer();
          }
        }
      }
    });

    startIdleTimer(); // kick off on mount

    return () => {
      clearTimers();
      subscription.remove();
    };
  }, [startIdleTimer, clearTimers, idleMs, warnMs, onWarn, onLogout]);

  const cancelIdleWatch = useCallback(() => clearTimers(), [clearTimers]);

  return { resetActivity, cancelIdleWatch };
}
