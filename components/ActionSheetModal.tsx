import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

type ItemRow = { label: string; value?: string | number | null };

type Props = {
    visible: boolean;
    title: string;
    items: ItemRow[];
    primaryText?: string;   // " For Edit"
    dangerText?: string;    // "For Delete"
    onClose: () => void;
    onPrimary: () => void;
    onDanger: () => void;
};

export default function ActionSheetModal({
    visible,
    title,
    items,
    primaryText = "Edit",
    dangerText = "Delete",
    onClose,
    onPrimary,
    onDanger,
}: Props) {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <View style={styles.card}>

                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{title}</Text>

                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color="#0d9488" />
                        </Pressable>
                    </View>

                    <View style={styles.content}>
                        {items.map((it) => (
                            <View key={it.label} style={styles.itemRow}>
                                <Text style={styles.itemLabel}>{it.label}</Text>
                                <Text style={styles.itemValue} numberOfLines={1}>
                                    {it.value === null || it.value === undefined || it.value === ""
                                        ? "—"
                                        : String(it.value)}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.actions}>
                        <Pressable
                            onPress={onPrimary}
                            style={({ pressed }) => [styles.btn, styles.btnPrimary, pressed && styles.pressed]}
                        >
                            <Ionicons name="pencil" size={16} color="#ffffff" />
                            <Text style={styles.btnPrimaryText}>{primaryText}</Text>
                        </Pressable>

                        <Pressable
                            onPress={onDanger}
                            style={({ pressed }) => [styles.btn, styles.btnDanger, pressed && styles.pressed]}
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
        paddingTop: 16,
        paddingBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    title: {
        fontSize: 15,
        fontWeight: "900",
        color: "#134e4a",
        letterSpacing: 1,
        textTransform: "uppercase",
    },

    closeBtn: {
        width: 34,
        height: 34,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(13, 148, 136, 0.10)",
        borderWidth: 1,
        borderColor: "rgba(13, 148, 136, 0.12)",
    },

    content: {
        paddingHorizontal: 18,
        paddingBottom: 14,
    },

    itemRow: {
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "rgba(13, 148, 136, 0.10)",
    },

    itemLabel: {
        fontSize: 10,
        fontWeight: "900",
        color: "#5f9e98",
        textTransform: "uppercase",
        letterSpacing: 1.6,
        marginBottom: 4,
    },

    itemValue: {
        fontSize: 15,
        fontWeight: "700",
        color: "#0f172a",
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

    btnPrimary: {
        backgroundColor: "#0d9488",
    },

    btnPrimaryText: {
        color: "#fff",
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

    pressed: {
        opacity: 0.7,
    },

});
