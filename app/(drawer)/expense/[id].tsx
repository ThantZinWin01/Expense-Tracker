import { AppToast } from "@/components/AppToast";
import { useAuth } from "@/context/AuthContext";
import { getAll, getOne, run } from "@/lib/db/database";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
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
type ExpenseRow = {
  id: number;
  amount: number;
  date: string;
  note: string | null;
  category_id: number;
};

const nowIso = () => new Date().toISOString();
const pad2 = (n: number) => String(n).padStart(2, "0");

// Date -> "YYYY-MM-DD" (matches DB date format)
const toYmd = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

// "YYYY-MM-DD" -> Date (used for loading saved DB date into DateTimePicker)
const fromYmd = (ymd: string) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export default function ExpenseDetailScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id: string }>();
  const expenseId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [dateObj, setDateObj] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  // Uses a custom header, hide default ones
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Converts input string -> number safely
  const amountNumber = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) ? n : 0;
  }, [amount]);

  // Loads expense + categories when user is ready or the expenseId changes
  useEffect(() => {
    if (user) load();
  }, [user, expenseId]);

  // Fetches the expense by id + user_id, then fills the form state
  const load = () => {
    setLoading(true);
    try {
      const exp = getOne<ExpenseRow>(
        `SELECT * FROM expenses WHERE id = ? AND user_id = ?`,
        [expenseId, user!.id],
      );

      // If invalid id or not owned by user, go back
      if (!exp) {
        router.back();
        return;
      }

      setAmount(String(exp.amount));
      setNote(exp.note ?? "");
      setDateObj(fromYmd(exp.date));
      setCategoryId(exp.category_id);

      const cats = getAll<Category>(
        `SELECT id, name FROM categories WHERE user_id = ? AND is_active = 1 ORDER BY name ASC`,
        [user!.id],
      );
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  };

  // Validates input, updates DB, shows toast, then navigates back
  const onUpdate = () => {
    if (saving) return;

    if (amountNumber <= 0) {
      AppToast.error("Invalid amount", "Please enter a valid amount.");
      return;
    }

    if (!categoryId) {
      AppToast.error("Category required", "Please choose a category.");
      return;
    }

    setSaving(true);
    try {
      run(
        `UPDATE expenses
         SET category_id = ?, amount = ?, date = ?, note = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          categoryId,
          amountNumber,
          toYmd(dateObj),
          note.trim() || null,
          nowIso(),
          expenseId,
          user!.id,
        ],
      );

      AppToast.success("Updated", "Expense updated successfully.");

      setTimeout(() => router.back(), 350);
    } catch (error) {
      AppToast.error("Error", "Failed to update expense.");
    } finally {
      setSaving(false);
    }
  };

  // Loading state while fetching expense details
  if (loading) {
    return (
      <View style={[styles.mainContainer, styles.center]}>
        <Text style={{ color: "#0d9488" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={["top"]} style={styles.headerArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#0d9488" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Expense</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.underlineContainer}>
          <View style={styles.headerUnderline} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.glassCard}>
            <Text style={styles.label}>Amount (MMK)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#99bcba"
              selectionColor="#0d9488"
            />
          </View>

          <Text style={[styles.label, { marginTop: 24, marginBottom: 10 }]}>
            Category
          </Text>
          <View style={styles.chipsRow}>
            {categories.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setCategoryId(c.id)}
                style={[styles.chip, categoryId === c.id && styles.chipActive]}
              >
                <Text
                  style={
                    categoryId === c.id
                      ? styles.chipTextActive
                      : styles.chipText
                  }
                >
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 24 }]}>
            Transaction Date
          </Text>
          <Pressable
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons
              name="calendar"
              size={20}
              color="#0d9488"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.dateText}>{toYmd(dateObj)}</Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(e, d) => {
                if (Platform.OS !== "ios") setShowDatePicker(false);
                if (d) setDateObj(d);
              }}
            />
          )}

          <Text style={[styles.label, { marginTop: 24 }]}>Note (Optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            style={styles.textArea}
            multiline
            placeholder="What was this for?"
            placeholderTextColor="#99bcba"
            selectionColor="#0d9488"
          />

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.cancelBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => router.back()}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.saveBtn,
                pressed && { opacity: 0.9 },
                saving && { opacity: 0.7 },
              ]}
              onPress={onUpdate}
              disabled={saving}
            >
              <Text style={styles.saveText}>
                {saving ? "UPDATING..." : "UPDATE"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f0fdfa",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 40,
  },
  placeholder: {
    width: 40,
  },
  headerTitle: {
    color: "#134e4a",
    fontSize: 20,
    fontWeight: "900",
  },
  underlineContainer: {
    alignItems: "center",
    marginTop: 4,
  },
  headerUnderline: {
    width: 40,
    height: 4,
    backgroundColor: "#0d9488",
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 30,
    paddingBottom: 60,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5f9e98",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginLeft: 4,
  },
  input: {
    fontSize: 28,
    color: "#134e4a",
    fontWeight: "900",
    borderBottomWidth: 2,
    borderBottomColor: "#0d9488",
    paddingVertical: 10,
    marginTop: 5,
  },
  textArea: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 20,
    padding: 16,
    height: 100,
    textAlignVertical: "top",
    fontSize: 16,
    color: "#134e4a",
    fontWeight: "600",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
  },
  chipActive: {
    backgroundColor: "#0d9488",
  },
  chipText: {
    color: "#5f9e98",
    fontWeight: "700",
    fontSize: 13,
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
  },
  dateText: {
    fontSize: 16,
    color: "#134e4a",
    fontWeight: "700",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 40,
  },
  btn: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtn: {
    backgroundColor: "#134e4a",
  },
  cancelBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
  },
  saveText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
  cancelBtnText: {
    color: "#5f9e98",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
});
