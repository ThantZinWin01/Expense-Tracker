import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmLogoutModal({
  visible,
  onCancel,
  onConfirm,
}: Props) {
  return (
    // Sign out Modal
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Tap outside to cancel */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

        <View style={styles.card}>
          {/* Modal title */}
          <Text style={styles.title}>Sign Out</Text>

          <Text style={styles.message}>
            Are you sure you want to sign out from your account?
          </Text>

          {/* Cancel Action */}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.cancelBtn,
                pressed && styles.pressed,
              ]}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            {/* Confirm Sign-out Action */}
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.signOutBtn,
                pressed && styles.pressed,
              ]}
              onPress={onConfirm}
            >
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
              <Text style={styles.signOutText}>Sign Out</Text>
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
    padding: 24,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 6,
  },

  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#134e4a",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },

  message: {
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
    lineHeight: 22,
    marginBottom: 24,
  },

  actions: {
    flexDirection: "row",
    gap: 12,
  },

  btn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.2)",
  },

  cancelText: {
    fontWeight: "900",
    color: "#5f9e98",
    fontSize: 13,
    letterSpacing: 1,
  },

  signOutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.35)",
  },

  signOutText: {
    fontWeight: "900",
    color: "#ef4444",
    fontSize: 13,
    letterSpacing: 1,
  },

  pressed: {
    opacity: 0.7,
  },
});
