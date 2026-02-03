import Toast from "react-native-toast-message";

type ToastKind = "success" | "error" | "info";

type ShowToastOptions = {
    title: string;
    message?: string;
    kind?: ToastKind;
    durationMs?: number;
};

export const AppToast = {
    show: ({ title, message, kind = "info", durationMs = 3000 }: ShowToastOptions) => {
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
