import ActionSheetModal from "@/components/ActionSheetModal";
import { useAuth } from "@/context/AuthContext";
import { getAll, run } from "@/lib/db/database";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import { FlatList, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Expense = {
  id: number;
  amount: number;
  date: string;
  note: string | null;
  category: string;
};

type Filter = "today" | "this week" | "this month";

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYmd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export default function ExpensesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<Filter>("today");
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);


  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [filter, user])
  );

  const loadExpenses = () => {
    if (!user) return;
    let where = "";
    const params: (string | number)[] = [user.id];

    if (filter === "today") {
      where = "AND e.date = ?";
      params.push(toYmd(new Date()));
    } else if (filter === "this month") {
      where = "AND e.date LIKE ?";
      params.push(`${new Date().getFullYear()}-${pad2(new Date().getMonth() + 1)}%`);
    } else if (filter === "this week") {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const start = new Date(now);
      start.setDate(now.getDate() + diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      where = "AND e.date BETWEEN ? AND ?";
      params.push(toYmd(start), toYmd(end));
    }

    const rows = getAll<Expense>(
      `SELECT e.id, e.amount, e.date, e.note, c.name as category
       FROM expenses e
       JOIN categories c ON c.id = e.category_id
       WHERE e.user_id = ? ${where}
       ORDER BY e.date DESC`,
      params
    );
    setExpenses(rows);
  };

  const showOptions = (item: Expense) => {
    setSelectedExpense(item);
    setMenuVisible(true);
  };

  const onDelete = () => {
    if (!selectedExpense) return;
    run("DELETE FROM expenses WHERE id = ?", [selectedExpense.id]);
    setMenuVisible(false);
    loadExpenses();
  };

  const onEdit = () => {
    if (!selectedExpense) return;
    setMenuVisible(false);
    router.push(`/expense/${selectedExpense.id}`);
  };

  const emptyMessage = () => {
    if (filter === "today") return "No expenses recorded today.";
    if (filter === "this week") return "No expenses recorded this week.";
    return "No expenses recorded this month.";
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.header}>
          <Pressable onPress={() => (navigation as any).openDrawer()} style={styles.menuBtn}>
            <Ionicons name="menu" size={28} color="#0d9488" />
          </Pressable>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.headerUnderline} />
      </SafeAreaView>

      <View style={styles.tabSection}>
        <View style={styles.segmentTrack}>
          {(["today", "this week", "this month"] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.segmentBtn, filter === f && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentText, filter === f && styles.segmentTextActive]}>
                {f}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[
          styles.listPadding,
          expenses.length === 0 && { flexGrow: 1 }
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={48} color="#99bcba" />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptyText}>{emptyMessage()}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.leftGroup}>
              <View style={styles.indicatorTeal} />
              <View style={styles.textStack}>
                <Text style={styles.categoryLabel} numberOfLines={1}>
                  {item.category}
                </Text>

                {item.note ? (
                  <Text style={styles.noteLabel} numberOfLines={1}>
                    {item.note}
                  </Text>
                ) : null}

                <Text style={styles.dateLabel}>{item.date}</Text>
              </View>
            </View>

            <View style={styles.rightGroup}>
              <View style={styles.amountContainer}>
                <Text style={styles.amountLabel}>{item.amount.toLocaleString()}</Text>
                <Text style={styles.currencyLabel}>MMK</Text>
              </View>

              <Pressable
                onPress={() => showOptions(item)}
                style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.5 }]}
              >
                <Ionicons name="ellipsis-vertical" size={18} color="#99bcba" />
              </Pressable>
            </View>
          </View>
        )}
      />
      
      <ActionSheetModal
        visible={menuVisible}
        title="Transaction"
        onClose={() => setMenuVisible(false)}
        onPrimary={onEdit}
        onDanger={onDelete}
        items={[
          { label: "Category", value: selectedExpense?.category ?? "" },
          { label: "Amount", value: selectedExpense ? selectedExpense.amount.toLocaleString() + " MMK" : "" },
          { label: "Date", value: selectedExpense?.date ?? "" },
          { label: "Note", value: selectedExpense?.note ?? "—" },
        ]}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdfa" },

  headerArea: { paddingHorizontal: 20, paddingTop: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  menuBtn: { width: 40 },
  placeholder: { width: 40 },
  headerTitle: { color: "#134e4a", fontSize: 20, fontWeight: "900" },
  headerUnderline: { width: 30, height: 4, backgroundColor: "#0d9488", borderRadius: 2, alignSelf: 'center', marginTop: 4 },

  tabSection: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 25 },
  segmentTrack: { flexDirection: 'row', backgroundColor: "rgba(13, 148, 136, 0.08)", borderRadius: 25, padding: 5 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
  segmentBtnActive: { backgroundColor: "#0d9488" },
  segmentText: { fontSize: 11, fontWeight: "800", color: "#5f9e98", textTransform: 'uppercase' },
  segmentTextActive: { color: "#fff" },

  listPadding: { paddingHorizontal: 20, paddingBottom: 40 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
  },
  leftGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  textStack: { flex: 1 },
  indicatorTeal: { width: 4, height: 35, borderRadius: 2, backgroundColor: "#0d9488", marginRight: 12 },
  categoryLabel: { fontSize: 16, fontWeight: "700", color: "#134e4a" },
  noteLabel: { fontSize: 13, color: "#475569", fontWeight: "500" },
  dateLabel: { fontSize: 10, color: "#5f9e98", marginTop: 2, fontWeight: "600" },

  rightGroup: { flexDirection: 'row', alignItems: 'center' },
  amountContainer: { alignItems: 'flex-end', marginRight: 10 },
  amountLabel: { fontSize: 17, fontWeight: "900", color: "#0f172a" },
  currencyLabel: { fontSize: 10, color: "#0d9488", fontWeight: "800" },
  moreBtn: {
    padding: 8,
    backgroundColor: '#f0fdfa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.1)'
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "800",
    color: "#134e4a",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#99bcba",
  },

});