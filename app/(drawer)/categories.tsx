import ActionSheetModal from "@/components/ActionSheetModal";
import { AppToast } from "@/components/AppToast";
import ConfirmDeleteModal from "@/components/ConfirmDeleteModal";
import { useAuth } from "@/context/AuthContext";
import { getAll, getOne, run } from "@/lib/db/database";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Category = { id: number; name: string };

function nowIso() {
  return new Date().toISOString();
}

export default function CategoriesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");

  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [deleteVisible, setDeleteVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const load = () => {
    if (!user) return;

    const rows = getAll<Category>(
      `SELECT id, name FROM categories
       WHERE user_id = ? AND is_active = 1
       ORDER BY name ASC`,
      [user.id],
    );
    setCategories(rows);
  };

  useFocusEffect(
    useCallback(() => {
      load();
      setName("");
    }, [user]),
  );

  const normalizeCategoryName = (s: string) => s.trim().replace(/\s+/g, " ");

  const addCategory = () => {
    if (!user) return;

    const raw = name;
    const n = normalizeCategoryName(raw);

    if (!n) {
      AppToast.error("Invalid", "Please enter a category name.");
      return;
    }

    const exists = getOne<{ id: number }>(
      `SELECT id FROM categories
       WHERE user_id = ?
         AND is_active = 1
         AND lower(name) = lower(?)`,
      [user.id, n],
    );

    if (exists) {
      AppToast.error(
        "Already exists",
        `"${n}" is already in your category list.`,
      );
      return;
    }

    try {
      run(
        `INSERT INTO categories (user_id, name, created_at, is_active)
         VALUES (?, ?, ?, 1)`,
        [user.id, n, nowIso()],
      );

      setName("");
      Keyboard.dismiss();
      load();
      AppToast.success("Added", `"${n}" added successfully.`);
    } catch (e: any) {
      AppToast.error("Error", e?.message ?? "Could not add category.");
    }
  };

  const showOptions = (item: Category) => {
    setSelectedCategory(item);
    setMenuVisible(true);
  };

  const onAskDelete = () => {
    if (!selectedCategory) return;
    setMenuVisible(false);
    setDeleteVisible(true);
  };

  const onConfirmDelete = () => {
    if (!selectedCategory) return;

    try {
      run(`UPDATE categories SET is_active = 0 WHERE id = ?`, [
        selectedCategory.id,
      ]);

      const deletedName = selectedCategory.name;

      setDeleteVisible(false);
      setSelectedCategory(null);
      load();

      AppToast.success("Deleted", `"${deletedName}" removed.`);
    } catch {
      setDeleteVisible(false);
      AppToast.error("Error", "Could not delete category.");
    }
  };

  const onEdit = () => {
    if (!selectedCategory) return;

    setMenuVisible(false);

    router.push({
      pathname: "/category/[id]",
      params: { id: selectedCategory.id },
    });
  };

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
          <Text style={styles.headerTitle}>Categories</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.underlineContainer}>
          <View style={styles.headerUnderline} />
        </View>
      </SafeAreaView>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.inputCard}>
              <Text style={styles.label}>Create New</Text>

              <View style={styles.addRow}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Subscriptions"
                  style={styles.input}
                  placeholderTextColor="#99bcba"
                  selectionColor="#0d9488"
                />

                <Pressable
                  style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
                  onPress={addCategory}
                  disabled={!name.trim()}
                >
                  <Ionicons
                    name="add"
                    size={28}
                    color={name.trim() ? "#fff" : "#99bcba"}
                  />
                </Pressable>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Your List</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={48} color="#99bcba" />
            <Text style={styles.empty}>No categories yet.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.glassItem}>
            <View style={styles.iconCircle}>
              <Text style={styles.categoryLetter}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text style={styles.itemText}>{item.name}</Text>

            <Pressable
              onPress={() => showOptions(item)}
              style={styles.menuButton}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#0d9488" />
            </Pressable>
          </View>
        )}
      />

      <ActionSheetModal
        visible={menuVisible}
        title="Category"
        onClose={() => {
          setMenuVisible(false);
          setSelectedCategory(null);
        }}
        onPrimary={onEdit}
        onDanger={onAskDelete}
        primaryText="Rename"
        dangerText="Delete"
        items={[{ label: "Name", value: selectedCategory?.name ?? "" }]}
      />

      <ConfirmDeleteModal
        visible={deleteVisible}
        categoryName={selectedCategory?.name}
        message="This action cannot be undone."
        dangerText="Delete"
        cancelText="Cancel"
        onCancel={() => setDeleteVisible(false)}
        onConfirm={onConfirmDelete}
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

  inputCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
    marginBottom: 25,
    marginTop: 20,
  },

  label: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5f9e98",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  addRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  input: {
    flex: 1,
    fontSize: 18,
    color: "#134e4a",
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: "rgba(13, 148, 136, 0.2)",
    paddingVertical: 8,
  },

  addBtn: {
    width: 50,
    height: 50,
    backgroundColor: "#134e4a",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#134e4a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  addBtnDisabled: {
    backgroundColor: "rgba(13, 148, 136, 0.05)",
    elevation: 0,
    shadowOpacity: 0,
  },

  listContent: {
    paddingHorizontal: 25,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0d9488",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 15,
    marginLeft: 5,
  },

  glassItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#e0f2f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
  },

  categoryLetter: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0d9488",
  },

  itemText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#134e4a",
    flex: 1,
  },

  menuButton: {
    padding: 8,
    backgroundColor: "#f0fdfa",
    borderRadius: 12,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
  },

  empty: {
    marginTop: 15,
    color: "#99bcba",
    fontWeight: "700",
    fontSize: 14,
  },
});
