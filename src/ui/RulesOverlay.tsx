import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';

interface RulesOverlayProps {
  visible: boolean;
  onClose: () => void;
}

export function RulesOverlay({ visible, onClose }: RulesOverlayProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>🐯 How to Play 🐐</Text>
          <Text style={styles.subtitle}>Bagh Chal · Aadu Puli Aatam</Text>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Rule
              emoji="🐐"
              title="Goats (20 total)"
              body="Place all 20 goats on empty points one at a time. Once every goat is placed, goats slide one step along a line to an empty neighboring point. Goats win by trapping every tiger so none can move."
            />
            <Rule
              emoji="🐯"
              title="Tigers (4 total)"
              body="Tigers start on the four corners. On their turn a tiger either slides one step to an empty neighboring point, or jumps in a straight line over an adjacent goat into an empty point beyond it, capturing that goat. Tigers win by capturing 5 goats."
            />
            <Rule
              emoji="✨"
              title="Tips"
              body="Captures are optional, never mandatory — a tiger can choose a quiet step instead. As goats, avoid lining up in a way that opens a jump. As tigers, spread out early before goats can wall you in."
            />
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Rule({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <View style={styles.rule}>
      <Text style={styles.ruleHeading}>
        {emoji} {title}
      </Text>
      <Text style={styles.ruleBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: theme.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 22,
  },
  title: {
    color: theme.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  scroll: {
    maxHeight: 340,
  },
  rule: {
    marginBottom: 14,
  },
  ruleHeading: {
    color: theme.gold,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  ruleBody: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: theme.success,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#0a1f18',
    fontWeight: '800',
    fontSize: 15,
  },
});
