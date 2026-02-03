import { AppToast } from "@/components/AppToast";
import { useAuth } from "@/context/AuthContext";
import { getAll, getOne, run } from "@/lib/db/database";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Category = { id: number; name: string };

const nowIso = () => new Date().toISOString();
const pad2 = (n: number) => String(n).padStart(2, "0");
const toYmd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export default function AddExpenseScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [amountError, setAmountError] = useState<string | null>(null);
  const amountErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const amountNumber = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  const showAmountError = (msg: string) => {
    setAmountError(msg);

    if (amountErrorTimer.current) {
      clearTimeout(amountErrorTimer.current);
    }

    amountErrorTimer.current = setTimeout(() => {
      setAmountError(null);
      amountErrorTimer.current = null;
    }, 3000);
  };

  const clearAmountError = () => {
    if (amountErrorTimer.current) {
      clearTimeout(amountErrorTimer.current);
      amountErrorTimer.current = null;
    }
    setAmountError(null);
  };

  const resetForm = useCallback(() => {
    setAmount("");
    setNote("");
    setDateObj(new Date());
    setShowDatePicker(false);
    setCategoryId(null);
    clearAmountError();
    setSaving(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      ensureDefaultCategories();
      loadCategories();

      return () => resetForm();
    }, [user, resetForm])
  );

  const ensureDefaultCategories = () => {
    const countRow = getOne<{ c: number }>(`SELECT COUNT(*) as c FROM categories WHERE user_id = ?`, [
      user!.id,
    ]);

    if ((countRow?.c ?? 0) > 0) return;

    const defaults = ["Food", "Transport", "Shopping", "Bill", "Health", "Other"];

    run("BEGIN");
    try {
      for (const name of defaults) {
        run(
          `INSERT INTO categories (user_id, name, created_at, is_active)
           VALUES (?, ?, ?, 1)`,
          [user!.id, name, nowIso()]
        );
      }
      run("COMMIT");
    } catch {
      run("ROLLBACK");
    }
  };

  const loadCategories = () => {
    const rows = getAll<Category>(
      `SELECT id, name FROM categories
       WHERE user_id = ? AND is_active = 1
       ORDER BY name ASC`,
      [user!.id]
    );

    setCategories(rows);

    if (rows.length > 0 && categoryId === null) {
      setCategoryId(rows[0].id);
    }
  };

  const handleDatePress = () => {
    Keyboard.dismiss();
    setShowDatePicker(true);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android" && event.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }

    if (selectedDate) setDateObj(selectedDate);
    if (Platform.OS === "android") setShowDatePicker(false);
  };

  const onSaveExpense = () => {
    if (!user) return;
    if (saving) return;

    if (amountNumber <= 0) {
      const msg = "Please enter a valid amount.";
      showAmountError(msg);
      AppToast.error("Invalid amount", msg);
      return;
    }

    if (!categoryId) {
      AppToast.error("Category required", "Please select a category.");
      return;
    }

    setSaving(true);
    try {
      run(
        `INSERT INTO expenses
         (user_id, category_id, amount, date, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.id, categoryId, amountNumber, toYmd(dateObj), note.trim() || null, nowIso(), nowIso()]
      );

      AppToast.success("Saved", "Expense added successfully.");

      resetForm();

      setTimeout(() => {
        router.replace("/(drawer)");
      }, 350);
    } catch {
      AppToast.error("Error", "Could not save expense.");
      setSaving(false);
    }
  };

  const onCancel = () => {
    resetForm();
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={["top"]} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={onCancel} style={styles.menuBtn}>
            <Ionicons name="chevron-back" size={28} color="#0d9488" />
          </Pressable>

          <Text style={styles.headerTitle}>New Expense</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.underlineContainer}>
          <View style={styles.headerUnderline} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.glassCard}>
            <Text style={styles.inputLabel}>Amount (MMK)</Text>

            <TextInput
              value={amount}
              onChangeText={(t) => {
                setAmount(t);
                if (amountError) clearAmountError();
              }}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#99bcba"
              style={[styles.amountInput, amountError && styles.amountInputError]}
              autoFocus
              selectionColor="#0d9488"
            />

            {amountError && <Text style={styles.amountHelperError}>{amountError}</Text>}
          </View>

          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.chipsRow}>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                style={[styles.chip, categoryId === c.id && styles.chipActive]}
              >
                <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.glassCard, { marginTop: 25 }]}>
            <Pressable style={styles.detailRow} onPress={handleDatePress}>
              <View style={styles.iconCircle}>
                <Ionicons name="calendar" size={20} color="#0d9488" />
              </View>
              <View>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{toYmd(dateObj)}</Text>
              </View>
            </Pressable>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="document-text" size={20} color="#0d9488" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Note (Optional)</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="What was this for?"
                  placeholderTextColor="#94a3b8"
                  style={styles.noteInput}
                  selectionColor="#0d9488"
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={onCancel}
              disabled={saving}
              style={({ pressed }) => [styles.btnBase, styles.cancelBtn, pressed && !saving && { opacity: 0.8 }, saving && { opacity: 0.7 }]}
            >
              <Text style={styles.cancelText}>CANCEL</Text>
            </Pressable>

            <Pressable
              onPress={onSaveExpense}
              disabled={saving}
              style={({ pressed }) => [styles.btnBase, styles.saveBtn, pressed && !saving && { opacity: 0.9 }, saving && { opacity: 0.75 }]}
            >
              <Text style={styles.saveBtnText}>{saving ? "SAVING..." : "SAVE"}</Text>
            </Pressable>
          </View>

          {Platform.OS === "android" && showDatePicker && (
            <DateTimePicker value={dateObj} mode="date" display="calendar" onChange={onDateChange} />
          )}

          {Platform.OS === "ios" && (
            <Modal transparent visible={showDatePicker} animationType="slide">
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Pressable onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.doneText}>Done</Text>
                    </Pressable>
                  </View>

                  <DateTimePicker value={dateObj} mode="date" display="spinner" onChange={onDateChange} />
                </View>
              </View>
            </Modal>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdfa" },

  headerArea: { paddingHorizontal: 20, paddingTop: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuBtn: { width: 40 },
  placeholder: { width: 40 },
  headerTitle: { color: "#134e4a", fontSize: 20, fontWeight: "900" },

  underlineContainer: { alignItems: "center", marginTop: 4 },
  headerUnderline: {
    width: 40,
    height: 4,
    backgroundColor: "#0d9488",
    borderRadius: 2,
  },

  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 40,
  },

  glassCard: {
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(13,148,136,0.1)",
  },

  inputLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5f9e98",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  amountInput: {
    fontSize: 36,
    fontWeight: "900",
    color: "#134e4a",
    borderBottomWidth: 2,
    borderBottomColor: "#0d9488",
    paddingVertical: 10,
    marginTop: 5,
  },

  amountInputError: {
    borderBottomColor: "rgba(239,68,68,0.45)",
  },

  amountHelperError: {
    marginTop: 6,
    marginLeft: 2,
    fontSize: 12,
    fontWeight: "600",
    color: "#ef4444",
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0d9488",
    textTransform: "uppercase",
    marginTop: 30,
    marginBottom: 15,
    marginLeft: 5,
    letterSpacing: 1.2,
  },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(13,148,136,0.1)",
  },

  chipActive: { backgroundColor: "#0d9488", borderColor: "#0d9488" },
  chipText: { color: "#5f9e98", fontWeight: "700", fontSize: 13 },
  chipTextActive: { color: "#fff" },

  detailRow: { flexDirection: "row", alignItems: "center", paddingVertical: 5 },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e0f2f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  detailLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
  },

  detailValue: { fontSize: 16, fontWeight: "700", color: "#134e4a" },

  noteInput: {
    fontSize: 16,
    fontWeight: "600",
    color: "#134e4a",
    paddingVertical: 2,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(13,148,136,0.1)",
    marginVertical: 12,
  },

  buttonRow: { flexDirection: "row", gap: 12, marginTop: 26 },

  btnBase: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  saveBtn: {
    backgroundColor: "#134e4a",
    shadowColor: "#134e4a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },

  saveBtnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1,
  },

  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(13,148,136,0.12)",
  },

  cancelText: {
    color: "#5f9e98",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },

  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "flex-end",
  },

  doneText: {
    color: "#0d9488",
    fontWeight: "bold",
    fontSize: 17,
  },
});
