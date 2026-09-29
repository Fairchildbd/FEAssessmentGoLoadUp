import { designTokens } from '@pet-sitting/shared/design-tokens';
import type { ReactNode } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Appbar, Button } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const { color } = designTokens;

interface MobileFullScreenModalProps {
  visible: boolean;
  accessibilityLabel: string;
  onDismiss: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  children: ReactNode;
}

export function MobileFullScreenModal({
  visible,
  accessibilityLabel,
  onDismiss,
  onSave,
  saveDisabled,
  children,
}: MobileFullScreenModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onDismiss}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen} accessibilityLabel={accessibilityLabel}>
          <Appbar style={styles.header}>
            <Appbar.Action icon="close" accessibilityLabel="Close" onPress={onDismiss} />
            <View style={styles.spacer} />
            <Button onPress={onSave} disabled={saveDisabled} accessibilityLabel="Save">
              Save
            </Button>
          </Appbar>
          <View style={styles.body}>{children}</View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surface },
  header: { backgroundColor: color.surface },
  spacer: { flex: 1 },
  body: { flex: 1 },
});
