// Kalkulyator — simple 4-function calculator with memory.

import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '../../theme/brand';

const BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
] as const;

export default function CalculatorScreen() {
  const colors = useColors();
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [waitNext, setWaitNext] = useState(false);

  const calculate = (a: number, operation: string, b: number): number => {
    switch (operation) {
      case '+': return a + b;
      case '−': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? 0 : a / b;
      default: return b;
    }
  };

  const press = (btn: string) => {
    if (btn === 'C') {
      setDisplay('0'); setPrev(null); setOp(null); setWaitNext(false);
    } else if (btn === '±') {
      setDisplay(String(-Number(display)));
    } else if (btn === '%') {
      setDisplay(String(Number(display) / 100));
    } else if (['+', '−', '×', '÷'].includes(btn)) {
      setPrev(Number(display)); setOp(btn); setWaitNext(true);
    } else if (btn === '=') {
      if (prev !== null && op) {
        const result = calculate(prev, op, Number(display));
        setDisplay(String(result));
        setPrev(null); setOp(null); setWaitNext(false);
      }
    } else if (btn === '⌫') {
      setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
    } else if (btn === '.') {
      if (waitNext) { setDisplay('0.'); setWaitNext(false); return; }
      if (!display.includes('.')) setDisplay(display + '.');
    } else {
      // digit
      if (waitNext) { setDisplay(btn); setWaitNext(false); }
      else setDisplay(display === '0' ? btn : display + btn);
    }
  };

  const isOp = (btn: string) => ['+', '−', '×', '÷'].includes(btn);
  const isEq = (btn: string) => btn === '=';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Display */}
      <View style={[styles.displayWrap, { backgroundColor: colors.surface }]}>
        {op && <Text style={[styles.opLabel, { color: colors.textMuted }]}>{prev} {op}</Text>}
        <Text style={[styles.display, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.grid}>
        {BUTTONS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((btn) => {
              const isOperator = isOp(btn);
              const isEquals = isEq(btn);
              const isActive = btn === op;
              return (
                <TouchableOpacity
                  key={btn}
                  style={[
                    styles.btn,
                    isEquals && { backgroundColor: colors.primary },
                    isOperator && !isEquals && { backgroundColor: isActive ? colors.primary : '#E0F2FE' },
                    !isOperator && !isEquals && { backgroundColor: colors.surface },
                  ]}
                  onPress={() => press(btn)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.btnText,
                    isEquals && { color: '#fff' },
                    isOperator && !isEquals && { color: isActive ? '#fff' : '#0369A1' },
                    !isOperator && !isEquals && { color: colors.text },
                    btn === 'C' && { color: '#EF4444' },
                  ]}>
                    {btn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:      { flex: 1, padding: 16 },
  displayWrap: { borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'flex-end', minHeight: 100, justifyContent: 'flex-end' },
  opLabel:     { fontSize: 16, marginBottom: 4 },
  display:     { fontSize: 48, fontWeight: '300' },
  grid:        { gap: 12 },
  row:         { flexDirection: 'row', gap: 12 },
  btn:         { flex: 1, aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnText:     { fontSize: 22, fontWeight: '500' },
});
