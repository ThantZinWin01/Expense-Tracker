import ActionSheetModal from "@/components/ActionSheetModal";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { useAuth } from "@/context/AuthContext";
import { getAll, getOne, run } from "@/lib/db/database";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type Expense = {
  id: number;
  amount: number;
  date: string;
  note: string | null;
  category: string;
};

type Filter = "today" | "this week" | "this month";

type SectionItem = Expense;

type Section = {
  key: string;
  titleLeft: string;
  titleRight: string;
  data: SectionItem[];
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYmd = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const monthKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

function parseYmd(ymd: string) {
  // Safe local date (avoid timezone shifting)
  return new Date(`${ymd}T00:00:00`);
}

function monthLabel(d: Date) {
  return d.toLocaleString("default", { month: "long", year: "numeric" });
}

function weekdayUpper(d: Date) {
  return d.toLocaleString("default", { weekday: "long" }).toUpperCase();
}

// "Feb 7, 2026"
function prettyDate(d: Date) {
  return d.toLocaleString("default", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// returns a new Date at Monday
function weekStartMonday(d: Date) {
  const out = new Date(d);
  const day = out.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + diff);
  out.setHours(0, 0, 0, 0);
  return out;
}

function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function weekRangeLabel(monday: Date) {
  const sunday = addDays(monday, 6);

  const sameMonth =
    monday.getFullYear() === sunday.getFullYear() &&
    monday.getMonth() === sunday.getMonth();

  const left = monday.toLocaleString("default", {
    month: "short",
    day: "numeric",
  });

  const right = sunday.toLocaleString("default", {
    month: sameMonth ? "long" : "short",
    day: "numeric",
  });

  return `${left} – ${right}`; // Mar 2 – March 8 (same month)
}

export default function ExpensesScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<Filter>("today");

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  // Histogram area width (remaining space after amount)
  const [histoAreaWidth, setHistoAreaWidth] = useState(0);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const currentMonthKey = useMemo(() => monthKey(new Date()), []);
  const monthHint = useMemo(() => monthLabel(new Date()), []);
  const [monthTotal, setMonthTotal] = useState(0);

  const loadMonthTotal = useCallback(() => {
    if (!user) return;

    const stats = getOne<{ total: number }>(
      `SELECT IFNULL(SUM(amount), 0) as total
       FROM expenses
       WHERE user_id = ? AND date LIKE ?`,
      [user.id, `${currentMonthKey}%`],
    );

    setMonthTotal(stats?.total ?? 0);
  }, [user, currentMonthKey]);

  useFocusEffect(
    useCallback(() => {
      loadMonthTotal();
      loadExpenses();
    }, [filter, user, loadMonthTotal]),
  );

  // Builds date range filter SQL and fetches expenses joined with category name
  const loadExpenses = () => {
    if (!user) return;

    let where = "";
    const params: (string | number)[] = [user.id];

    if (filter === "today") {
      where = "AND e.date = ?";
      params.push(toYmd(new Date()));
    } else if (filter === "this month") {
      where = "AND e.date LIKE ?";
      params.push(`${currentMonthKey}%`);
    } else {
      // this week (Mon–Sun)
      const now = new Date();
      const start = weekStartMonday(now);
      const end = addDays(start, 6);

      // clamp to current month boundaries (no cross-month)
      const monthStart = firstDayOfMonthKey(currentMonthKey);
      const monthEnd = lastDayOfMonthKey(currentMonthKey);

      if (start < monthStart) start.setTime(monthStart.getTime());
      if (end > monthEnd) end.setTime(monthEnd.getTime());

      where = "AND e.date BETWEEN ? AND ?";
      params.push(toYmd(start), toYmd(end));
    }

    const rows = getAll<Expense>(
      `SELECT e.id, e.amount, e.date, e.note, c.name as category
       FROM expenses e
       JOIN categories c ON c.id = e.category_id
       WHERE e.user_id = ? ${where}
       ORDER BY e.date DESC, e.id DESC`,
      params,
    );

    setExpenses(rows);
  };

  const goSummary = () =>
    router.push({
      pathname: "/(drawer)/summary",
      params: { from: "dashboard" },
    });

  const goAddExpense = () => router.push("/(drawer)/add-expense");

  // Opens action sheet for selected transaction
  const showOptions = (item: Expense) => {
    setSelectedExpense(item);
    setMenuVisible(true);
  };

  // Goes to expense detail screen for editing
  const onEdit = () => {
    if (!selectedExpense) return;
    setMenuVisible(false);
    router.push(`/expense/${selectedExpense.id}`);
  };

  const onDelete = () => {
    if (!selectedExpense) return;
    setMenuVisible(false);
    setConfirmDeleteVisible(true);
  };

  // Deletes expense, refreshes list, and clears selection
  const confirmDelete = () => {
    if (!selectedExpense) return;

    run("DELETE FROM expenses WHERE id = ?", [selectedExpense.id]);
    setConfirmDeleteVisible(false);
    setSelectedExpense(null);
    loadMonthTotal();
    loadExpenses();
  };

  const emptyCopy = useMemo(() => {
    if (filter === "today") return "No expenses recorded today.";
    if (filter === "this week") return "No expenses recorded this week.";
    return "No expenses recorded this month.";
  }, [filter]);

  // Histogram (auto-fit width)
  const baseBars = useMemo(() => {
    const count = 14;
    const minH = 14;
    const maxH = 54;

    const heights = Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      const eased = t * t * (3 - 2 * t);
      return Math.round(minH + (maxH - minH) * eased);
    });

    const opacities = Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      return 0.06 + t * 0.12;
    });

    return { heights, opacities };
  }, []);

  const visibleBars = useMemo(() => {
    const width = histoAreaWidth;

    // gap shrinks when space is small
    const gap = width < 140 ? 6 : width < 220 ? 8 : 10;

    const minBarW = 14;
    const preferredBarW = 22;

    // maximum bars possible if using min bar width
    const maxPossible =
      width > 0 ? Math.floor((width + gap) / (minBarW + gap)) : 0;

    // keep at least 5 bars if possible
    const n =
      width <= 0
        ? 0
        : Math.max(5, Math.min(baseBars.heights.length, maxPossible));

    // compute a bar width that actually fills the space nicely
    const computedW =
      n > 0 ? Math.floor((width - gap * (n - 1)) / n) : preferredBarW;

    const barW = Math.max(minBarW, Math.min(preferredBarW, computedW));

    const start = baseBars.heights.length - n;

    return {
      heights: baseBars.heights.slice(start),
      opacities: baseBars.opacities.slice(start),
      barW,
      gap,
      n,
    };
  }, [histoAreaWidth, baseBars]);

  function weekdayShort(d: Date) {
    return d.toLocaleString("default", { weekday: "short" }); // Sun, Mon...
  }

  function firstDayOfMonthKey(monthKeyStr: string) {
    const [y, m] = monthKeyStr.split("-").map(Number);
    return new Date(y, m - 1, 1, 0, 0, 0, 0);
  }

  function lastDayOfMonthKey(monthKeyStr: string) {
    const [y, m] = monthKeyStr.split("-").map(Number);
    return new Date(y, m, 0, 0, 0, 0, 0); // day 0 of next month = last day
  }

  function clampDate(d: Date, min: Date, max: Date) {
    return new Date(
      Math.min(Math.max(d.getTime(), min.getTime()), max.getTime()),
    );
  }

  // For month sections header: show only the range inside the month
  function weekRangeLabelClipped(monday: Date, monthKeyStr: string) {
    const sunday = addDays(monday, 6);
    const min = firstDayOfMonthKey(monthKeyStr);
    const max = lastDayOfMonthKey(monthKeyStr);

    const start = clampDate(monday, min, max);
    const end = clampDate(sunday, min, max);

    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleString("default", {
        month: "short",
        day: "numeric",
      }); // Mar 1
    }

    const sameMonth =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth();

    const left = start.toLocaleString("default", {
      month: "short",
      day: "numeric",
    });
    const right = end.toLocaleString("default", {
      month: sameMonth ? "long" : "short",
      day: "numeric",
    });

    return `${left} – ${right}`;
  }

  // Sections: week by day / month by week
  const sections: Section[] = useMemo(() => {
    if (expenses.length === 0) return [];

    if (filter === "today") {
      return [
        {
          key: "today",
          titleLeft: "",
          titleRight: "",
          data: expenses,
        },
      ];
    }

    // group by date
    if (filter === "this week") {
      const map = new Map<string, Expense[]>();
      for (const e of expenses) {
        const key = e.date; // YYYY-MM-DD
        const arr = map.get(key) ?? [];
        arr.push(e);
        map.set(key, arr);
      }

      const keys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));

      return keys.map((k) => {
        const d = parseYmd(k);
        return {
          key: `day-${k}`,
          titleLeft: `${prettyDate(d)} (${weekdayShort(d)})`, // Mar 1, 2026 (Sun)
          titleRight: "",
          data: map.get(k) ?? [],
        };
      });
    }

    // this month: group by Monday-week range (Mon–Sun)
    const map = new Map<string, { monday: Date; items: Expense[] }>();

    for (const e of expenses) {
      const d = parseYmd(e.date);
      const mon = weekStartMonday(d);
      const wkKey = toYmd(mon); // monday ymd

      const existing = map.get(wkKey);
      if (existing) {
        existing.items.push(e);
      } else {
        map.set(wkKey, { monday: mon, items: [e] });
      }
    }

    const keys = Array.from(map.keys()).sort((a, b) => (a < b ? 1 : -1));

    return keys.map((wkKey) => {
      const entry = map.get(wkKey)!;
      return {
        key: `week-${wkKey}`,
        titleLeft: weekRangeLabelClipped(entry.monday, currentMonthKey),
        titleRight: "",
        data: entry.items,
      };
    });
  }, [expenses, filter]);

  const showSectionHeader = filter !== "today";

  // Header: month card + tabs
  const ListHeader = (
    <View>
      {/* Monthly spend card */}
      <View style={styles.monthCard}>
        {/* Background gradient */}
        <LinearGradient
          colors={[
            "#ffffff",
            "rgba(13, 148, 136, 0.15)", // bottom tint
          ]}
          locations={[0.25, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Card content */}
        <View style={styles.monthCardContent}>
          <View style={styles.monthCardTopRow}>
            <View style={styles.monthHintRow}>
              <Ionicons name="calendar-outline" size={16} color="#94a3b8" />
              <Text style={styles.monthHintText}>{monthHint}</Text>
            </View>

            <Pressable
              onPress={goSummary}
              style={({ pressed }) => [
                styles.monthCardBadge,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Ionicons name="analytics" size={14} color="#0d9488" />
              <Text style={styles.monthCardBadgeText}>Summary</Text>
            </Pressable>
          </View>

          <View style={styles.amountAndHistoRow}>
            <View style={styles.amountBlock}>
              <Text style={styles.monthValue}>
                {monthTotal.toLocaleString()}
              </Text>
              <Text style={styles.monthCurrency}>MMK</Text>
            </View>

            {/* Histogram */}
            <View
              pointerEvents="none"
              style={styles.histoArea}
              onLayout={(e) => setHistoAreaWidth(e.nativeEvent.layout.width)}
            >
              <View style={[styles.histoRow, { gap: visibleBars.gap }]}>
                {visibleBars.heights.map((h, idx) => (
                  <View
                    key={idx}
                    style={[styles.histoCol, { width: visibleBars.barW }]}
                  >
                    <View
                      style={[
                        styles.histoBar,
                        { height: h, opacity: visibleBars.opacities[idx] },
                      ]}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabSection}>
        <View style={styles.segmentTrack}>
          {(["today", "this week", "this month"] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.segmentBtn,
                filter === f && styles.segmentBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  filter === f && styles.segmentTextActive,
                ]}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={["top"]} style={styles.headerArea}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (navigation as any).openDrawer()}
            style={styles.menuBtn}
          >
            <Ionicons name="menu" size={28} color="#0d9488" />
          </Pressable>

          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.headerUnderline} />
      </SafeAreaView>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          styles.listPadding,
          { paddingBottom: 40 + insets.bottom + 70 },
          expenses.length === 0 && { flexGrow: 1 },
        ]}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={48} color="#99bcba" />
            <Text style={styles.emptyTitle}>No Transactions</Text>
            <Text style={styles.emptyText}>{emptyCopy}</Text>
          </View>
        }
        renderSectionHeader={({ section }) => {
          if (!showSectionHeader) return null;

          const hasRight = !!section.titleRight?.trim();

          return (
            <View style={styles.sectionHeaderWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitleLeft}>{section.titleLeft}</Text>

                {hasRight ? (
                  <Text style={styles.sectionTitleRight}>
                    {section.titleRight}
                  </Text>
                ) : null}
              </View>
              <View style={styles.sectionDivider} />
            </View>
          );
        }}
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
                <Text style={styles.amountLabel}>
                  {item.amount.toLocaleString()}
                </Text>
                <Text style={styles.currencyLabel}>MMK</Text>
              </View>

              <Pressable
                onPress={() => showOptions(item)}
                style={({ pressed }) => [
                  styles.moreBtn,
                  pressed && { opacity: 0.5 },
                ]}
              >
                <Ionicons name="ellipsis-vertical" size={18} color="#99bcba" />
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* New Expense Button */}
      <Pressable
        onPress={goAddExpense}
        style={({ pressed }) => [
          styles.fab,
          { bottom: 18 + insets.bottom }, // ✅ safe area aware
          pressed && { transform: [{ scale: 0.96 }], opacity: 0.9 },
        ]}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </Pressable>

      <ActionSheetModal
        visible={menuVisible}
        title="Transaction"
        onClose={() => setMenuVisible(false)}
        onPrimary={onEdit}
        onDanger={onDelete}
        items={[
          { label: "Category", value: selectedExpense?.category ?? "" },
          {
            label: "Amount",
            value: selectedExpense
              ? selectedExpense.amount.toLocaleString() + " MMK"
              : "",
          },
          { label: "Date", value: selectedExpense?.date ?? "" },
          { label: "Note", value: selectedExpense?.note ?? "—" },
        ]}
      />

      <ConfirmDeleteModal
        visible={confirmDeleteVisible}
        categoryName={selectedExpense?.category}
        onCancel={() => setConfirmDeleteVisible(false)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdfa" },

  headerArea: { paddingHorizontal: 20, paddingTop: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuBtn: { width: 40 },
  placeholder: { width: 40 },
  headerTitle: { color: "#134e4a", fontSize: 20, fontWeight: "900" },
  headerUnderline: {
    width: 30,
    height: 4,
    backgroundColor: "#0d9488",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 4,
  },

  listPadding: { paddingHorizontal: 20 },

  /* Monthly Card */
  monthCard: {
    marginTop: 18,
    marginBottom: 18,
    borderRadius: 26,
    borderWidth: 1.6,
    borderColor: "rgba(13, 148, 136, 0.22)",
    backgroundColor: "#ffffff",
    overflow: "hidden",
    position: "relative",
  },

  monthCardContent: {
    padding: 16,
    position: "relative",
    zIndex: 1,
  },

  monthCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  monthHintRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  monthHintText: {
    color: "rgba(100, 116, 139, 0.68)",
    fontSize: 15,
    fontWeight: "800",
  },

  monthCardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(13, 148, 136, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.18)",
  },
  monthCardBadgeText: {
    color: "#0d9488",
    fontSize: 13,
    fontWeight: "900",
  },

  amountAndHistoRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-end",
  },

  amountBlock: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexShrink: 0,
  },

  monthValue: {
    fontSize: 34,
    fontWeight: "900",
    color: "#134e4a",
    letterSpacing: -0.7,
  },

  monthCurrency: {
    marginLeft: 10,
    marginBottom: 7,
    fontSize: 14,
    fontWeight: "900",
    color: "#0d9488",
  },

  histoArea: {
    flex: 1,
    marginLeft: 16,
    height: 56,
    justifyContent: "flex-end",
    overflow: "hidden",
    position: "relative",
  },

  histoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },

  histoCol: {
    height: "100%",
    justifyContent: "flex-end",
  },

  histoBar: {
    width: "100%",
    borderRadius: 999,
    backgroundColor: "rgba(13, 148, 136, 0.7)",
  },

  /* Tabs */
  tabSection: { paddingTop: 6, paddingBottom: 18 },
  segmentTrack: {
    flexDirection: "row",
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    borderRadius: 25,
    padding: 5,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 20,
  },
  segmentBtnActive: { backgroundColor: "#0d9488" },
  segmentText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5f9e98",
    textTransform: "uppercase",
  },
  segmentTextActive: { color: "#fff" },

  /* Section headers */
  sectionHeaderWrap: {
    marginTop: 6,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sectionTitleLeft: {
    fontSize: 10,
    fontWeight: "900",
    color: "rgba(15, 118, 110, 0.85)",
    letterSpacing: 1.2,
  },
  sectionTitleRight: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(100, 116, 139, 0.70)",
  },
  sectionDivider: {
    marginTop: 8,
    height: 1,
    backgroundColor: "rgba(13, 148, 136, 0.10)",
  },

  /* List Rows */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.78)",
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.10)",
  },
  leftGroup: { flexDirection: "row", alignItems: "center", flex: 1 },
  textStack: { flex: 1 },
  indicatorTeal: {
    width: 4,
    height: 35,
    borderRadius: 2,
    backgroundColor: "#0d9488",
    marginRight: 12,
  },
  categoryLabel: { fontSize: 16, fontWeight: "800", color: "#134e4a" },
  noteLabel: { fontSize: 13, color: "#475569", fontWeight: "600" },
  dateLabel: {
    fontSize: 10,
    color: "#5f9e98",
    marginTop: 2,
    fontWeight: "700",
  },

  rightGroup: { flexDirection: "row", alignItems: "center" },
  amountContainer: { alignItems: "flex-end", marginRight: 10 },
  amountLabel: { fontSize: 17, fontWeight: "900", color: "#0f172a" },
  currencyLabel: { fontSize: 10, color: "#0d9488", fontWeight: "900" },
  moreBtn: {
    padding: 8,
    backgroundColor: "#f0fdfa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.12)",
  },

  /* Empty State */
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 80,
    paddingHorizontal: 30,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "900",
    color: "#134e4a",
    textAlign: "center",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#99bcba",
    textAlign: "center",
  },

  emptyCtaText: {
    color: "#0d9488",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 0.5,
    textAlign: "center",
  },

  /* New Expense Button */
  fab: {
    position: "absolute",
    right: 22,
    bottom: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0d9488",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#0f766e",
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 8 },
    }),
  },
});
