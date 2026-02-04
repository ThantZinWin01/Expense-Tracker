import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  categoryName?: string;
  message?: string;
  dangerText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeleteModal({
  visible,
  categoryName,
  message = "This action cannot be undone.",
  dangerText = "Delete",
  cancelText = "Cancel",
  onCancel,
  onConfirm,
}: Props) {
  const title = categoryName?.trim()
    ? `Delete ${categoryName.trim()}?`
    : "Delete transaction?";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.btn,
                styles.btnCancel,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.btnCancelText}>{cancelText}</Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.btn,
                styles.btnDanger,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
              <Text style={styles.btnDangerText}>{dangerText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.18)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 6,
  },

  headerRow: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    color: "#134e4a",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    paddingTop: 6,
  },

  message: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    lineHeight: 18,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(13, 148, 136, 0.10)",
    backgroundColor: "rgba(240, 253, 250, 0.6)",
  },

  btn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  btnCancel: {
    backgroundColor: "rgba(13, 148, 136, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.18)",
  },

  btnCancelText: {
    color: "#0d9488",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  btnDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.30)",
  },

  btnDangerText: {
    color: "#ef4444",
    fontWeight: "900",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  pressed: { opacity: 0.7 },
});
