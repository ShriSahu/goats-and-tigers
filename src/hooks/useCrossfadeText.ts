import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

/** Crossfades displayed text whenever `value` changes, instead of snapping instantly. */
export function useCrossfadeText(value: string, outMs = 120, inMs = 200) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    prevValue.current = value;
    Animated.timing(opacity, { toValue: 0, duration: outMs, useNativeDriver: true }).start(() => {
      setDisplay(value);
      Animated.timing(opacity, { toValue: 1, duration: inMs, useNativeDriver: true }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return { display, opacity };
}
