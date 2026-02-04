import { useAuth } from "@/context/AuthContext";
import { getAll, getOne } from "@/lib/db/database";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type CategorySum = {
  category: string;
  total: number;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

const monthKeyFromDate = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

const addMonths = (monthKey: string, diff: number) => {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + diff, 1);
  return monthKeyFromDate(d);
};

const monthLabelFromKey = (monthKey: string) => {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("default", { month: "long", year: "numeric" });
};

export default function SummaryScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const currentMonthKey = useMemo(() => monthKeyFromDate(new Date()), []);
  const [month, setMonth] = useState(() => monthKeyFromDate(new Date()));

  const [totalSpent, setTotalSpent] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [byCategory, setByCategory] = useState<CategorySum[]>([]);

  const canGoNext = month < currentMonthKey;

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const load = () => {
    if (!user) return;

    const stats = getOne<{ total: number; count: number }>(
      `SELECT IFNULL(SUM(amount), 0) as total, COUNT(id) as count
       FROM expenses
       WHERE user_id = ? AND date LIKE ?`,
      [user.id, `${month}%`],
    );

    setTotalSpent(stats?.total ?? 0);
    setTransactionCount(stats?.count ?? 0);

    const rows = getAll<CategorySum>(
      `SELECT c.name as category, IFNULL(SUM(e.amount), 0) as total
       FROM expenses e
       JOIN categories c ON c.id = e.category_id
       WHERE e.user_id = ? AND e.date LIKE ?
       GROUP BY c.id
       ORDER BY total DESC`,
      [user.id, `${month}%`],
    );
    setByCategory(rows);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [user, month]),
  );

  const renderHeader = () => (
    <View style={styles.summaryStatsArea}>
      <View style={styles.monthRow}>
        <Pressable
          onPress={() => setMonth((m) => addMonths(m, -1))}
          style={styles.monthNavBtn}
        >
          <Ionicons name="chevron-back" size={18} color="#0d9488" />
        </Pressable>

        <View style={styles.monthPill}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color="#0d9488"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.monthPillText}>{monthLabelFromKey(month)}</Text>
        </View>

        <Pressable
          onPress={() => setMonth((m) => addMonths(m, +1))}
          disabled={!canGoNext}
          style={[styles.monthNavBtn, !canGoNext && { opacity: 0.35 }]}
        >
          <Ionicons name="chevron-forward" size={18} color="#0d9488" />
        </Pressable>
      </View>

      <View style={styles.statsGlassCard}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>MONTHLY SPEND</Text>
          <Text style={styles.statValue}>{totalSpent.toLocaleString()}</Text>
          <Text style={styles.currencyLabel}>MMK</Text>
        </View>

        <View style={styles.vDivider} />

        <View style={styles.statBox}>
          <Text style={styles.statLabel}>TRANSACTIONS</Text>
          <Text style={styles.statValue}>{transactionCount}</Text>
          <Text style={styles.currencyLabel}>ENTRIES</Text>
        </View>
      </View>

      {totalSpent === 0 && (
        <Text style={styles.noDataHint}>
          No spending recorded for {monthLabelFromKey(month)}.
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={["top"]} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => (navigation as any).openDrawer()}
            style={styles.menuBtn}
          >
            <Ionicons name="menu" size={28} color="#0d9488" />
          </Pressable>

          <Text style={styles.headerTitle}>Summary</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.underlineContainer}>
          <View style={styles.headerUnderline} />
        </View>
      </SafeAreaView>

      <FlatList
        data={byCategory}
        keyExtractor={(item) => item.category}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {renderHeader()}
            <Text style={styles.sectionTitle}>Spending by Category</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="analytics" size={40} color="#99bcba" />
            </View>
            <Text style={styles.empty}>
              No entries for {monthLabelFromKey(month)}.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const percentage =
            totalSpent > 0 ? (item.total / totalSpent) * 100 : 0;

          return (
            <View style={styles.categoryCard}>
              <View style={styles.cardTop}>
                <View style={styles.catInfo}>
                  <View style={styles.dot} />
                  <Text style={styles.catName}>{item.category}</Text>
                </View>

                <Text style={styles.catAmount}>
                  {item.total.toLocaleString()}{" "}
                  <Text style={styles.minCurrency}>MMK</Text>
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressBar, { width: `${percentage}%` }]}
                />
              </View>

              <View style={styles.cardBottom}>
                <Text style={styles.percentText}>
                  {percentage.toFixed(1)}% of total
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdfa",
  },

  headerArea: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  menuBtn: {
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

  summaryStatsArea: {
    paddingHorizontal: 25,
    paddingTop: 20,
    paddingBottom: 12,
  },

  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(13, 148, 136, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.12)",
  },

  monthPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(13, 148, 136, 0.10)",
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.12)",
  },

  monthPillText: {
    color: "#0d9488",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  statsGlassCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
    shadowColor: "#0d9488",
  },

  statBox: {
    flex: 1,
    alignItems: "center",
  },

  statLabel: {
    color: "#5f9e98",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },

  statValue: {
    color: "#134e4a",
    fontSize: 24,
    fontWeight: "900",
  },

  currencyLabel: {
    color: "#0d9488",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },

  vDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "rgba(13, 148, 136, 0.15)",
    alignSelf: "center",
  },

  noDataHint: {
    marginTop: 10,
    textAlign: "center",
    color: "#7aa9a6",
    fontSize: 12,
    fontWeight: "700",
  },

  listContent: {
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0d9488",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 5,
    marginBottom: 15,
    marginLeft: 30,
  },

  categoryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    marginHorizontal: 25,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  catInfo: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0d9488",
    marginRight: 10,
  },

  catName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#134e4a",
  },

  catAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: "#134e4a",
  },

  minCurrency: {
    fontSize: 9,
    color: "#5f9e98",
    fontWeight: "700",
  },

  progressTrack: {
    height: 10,
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    borderRadius: 5,
    width: "100%",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#0d9488",
    borderRadius: 5,
  },

  cardBottom: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  percentText: {
    fontSize: 10,
    color: "#5f9e98",
    fontWeight: "800",
    textTransform: "uppercase",
  },

  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },

  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(13, 148, 136, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  empty: {
    textAlign: "center",
    color: "#99bcba",
    fontWeight: "700",
    fontSize: 14,
  },
});
