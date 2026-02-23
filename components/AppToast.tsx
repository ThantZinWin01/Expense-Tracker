import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Toast from "react-native-toast-message";

type ToastKind = "success" | "error" | "info";

type ShowToastOptions = {
  title: string;
  message?: string;
  kind?: ToastKind;
  durationMs?: number;
};

export const AppToast = {
  show: ({
    title,
    message,
    kind = "info",
    durationMs = 3000,
  }: ShowToastOptions) => {
    Toast.show({
      type: kind,
      text1: title,
      text2: message,
      position: "top",
      visibilityTime: durationMs,
      autoHide: true,
      topOffset: 55,
    });
  },

  success: (title: string, message?: string) =>
    AppToast.show({ title, message, kind: "success" }),

  error: (title: string, message?: string) =>
    AppToast.show({ title, message, kind: "error" }),

  info: (title: string, message?: string) =>
    AppToast.show({ title, message, kind: "info" }),
};

/* ✅ Custom visual config */
export const toastConfig = {
  success: ({ text1, text2 }: any) => (
    <ToastCard
      icon="checkmark-circle"
      accent="#0d9488"
      title={text1}
      message={text2}
    />
  ),

  error: ({ text1, text2 }: any) => (
    <ToastCard
      icon="close-circle"
      accent="#ef4444"
      title={text1}
      message={text2}
    />
  ),

  info: ({ text1, text2 }: any) => (
    <ToastCard
      icon="information-circle"
      accent="#0284c7"
      title={text1}
      message={text2}
    />
  ),
};

/* 🔹 Toast Card UI */
function ToastCard({
  icon,
  accent,
  title,
  message,
}: {
  icon: any;
  accent: string;
  title: string;
  message?: string;
}) {
  return (
    <View style={[styles.toast, { borderLeftColor: accent }]}>
      <Ionicons name={icon} size={22} color={accent} />
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderLeftWidth: 5,
    shadowColor: "#0f766e",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  textWrap: {
    flex: 1,
  },

  title: {
    fontSize: 14,
    fontWeight: "900",
    color: "#134e4a",
  },

  message: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
});
