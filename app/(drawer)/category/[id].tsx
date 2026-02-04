import { AppToast } from "@/components/AppToast";
import { useAuth } from "@/context/AuthContext";
import { getOne, run } from "@/lib/db/database";
import { Ionicons } from "@expo/vector-icons";
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

const normalizeCategoryName = (s: string) => s.trim().replace(/\s+/g, " ");

export default function EditCategoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useEffect(() => {
    if (!user || !id) return;

    const cat = getOne<{ name: string }>(
      "SELECT name FROM categories WHERE id = ? AND user_id = ?",
      [id, user.id],
    );

    if (cat) setName(cat.name);
  }, [user, id]);

  const canSave = useMemo(
    () => name.trim().length > 0 && !saving,
    [name, saving],
  );

  const onUpdate = () => {
    if (!user || !id) return;
    if (saving) return;

    const n = normalizeCategoryName(name);

    if (!n) {
      AppToast.error("Invalid name", "Category name cannot be empty.");
      return;
    }

    // CASE-INSENSITIVE duplicate check (excluding current category)
    const exists = getOne<{ id: number }>(
      `SELECT id FROM categories
       WHERE user_id = ?
         AND is_active = 1
         AND lower(name) = lower(?)
         AND id != ?`,
      [user.id, n, Number(id)],
    );

    if (exists) {
      AppToast.error("Already exists", `"${n}" already exists.`);
      return;
    }

    try {
      setSaving(true);

      run("UPDATE categories SET name = ? WHERE id = ? AND user_id = ?", [
        n,
        id,
        user.id,
      ]);

      AppToast.success("Updated", "Category renamed successfully.");

      setTimeout(() => {
        router.replace("/(drawer)/categories");
      }, 350);
    } catch {
      AppToast.error("Error", "Could not rename category.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={["top"]} style={styles.headerArea}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.replace("/(drawer)/categories")}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={28} color="#0d9488" />
          </Pressable>

          <Text style={styles.headerTitle}>Edit Category</Text>

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
        >
          <View style={styles.glassCard}>
            <Text style={styles.label}>Category Name</Text>

            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="e.g. Shopping"
              placeholderTextColor="#99bcba"
              autoFocus
              selectionColor="#0d9488"
            />

            <Text style={styles.helperText}>
              Keep it simple. Changes will update all existing expenses in this
              category.
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.cancelBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => router.replace("/(drawer)/categories")}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.btn,
                styles.saveBtn,
                !canSave && styles.btnDisabled,
                pressed && canSave && { opacity: 0.9 },
                saving && { opacity: 0.75 },
              ]}
              onPress={onUpdate}
              disabled={!canSave}
            >
              <Text style={styles.saveText}>
                {saving ? "SAVING..." : "UPDATE"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },

  input: {
    fontSize: 22,
    color: "#134e4a",
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: "#0d9488",
    paddingVertical: 10,
    marginTop: 5,
  },

  helperText: {
    marginTop: 15,
    color: "#99bcba",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 30,
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

  btnDisabled: {
    backgroundColor: "#cbd5e1",
  },

  saveText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },

  cancelBtnText: {
    color: "#5f9e98",
    fontWeight: "900",
    fontSize: 14,
  },
});
