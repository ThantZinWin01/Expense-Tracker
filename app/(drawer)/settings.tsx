import ConfirmLogoutModal from "@/components/ConfirmLogoutModal";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const navigation = useNavigation();

  const [logoutVisible, setLogoutVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const handleLogout = async () => {
    await logout();
    setLogoutVisible(false);
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <SafeAreaView edges={["top"]} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => (navigation as any).openDrawer()} style={styles.menuBtn}>
            <Ionicons name="menu" size={28} color="#0d9488" />
          </Pressable>
          <Text style={styles.headerTitle}>Setting</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.underlineContainer}>
          <View style={styles.headerUnderline} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Account Information</Text>

        <View style={styles.glassCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="person" size={20} color="#0d9488" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.label}>Username</Text>
              <Text style={styles.value}>{user?.username}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail" size={20} color="#0d9488" />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 35 }]}>App Action</Text>

        <View style={styles.glassCard}>
          <Pressable
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
            onPress={() => setLogoutVisible(true)}
          >
            <View style={styles.logoutLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "#fee2e2" }]}>
                <Ionicons name="log-out" size={20} color="#ef4444" />
              </View>
              <Text style={styles.logoutLabel}>Sign Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </Pressable>
        </View>
      </View>

      <ConfirmLogoutModal
        visible={logoutVisible}
        onCancel={() => setLogoutVisible(false)}
        onConfirm={handleLogout}
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
    alignItems: 'center',
    marginTop: 4,
  },

  headerUnderline: {
    width: 40,
    height: 4,
    backgroundColor: "#0d9488",
    borderRadius: 2,
  },

  content: {
    paddingHorizontal: 25,
    paddingTop: 25,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#0d9488",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 5,
  },

  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(13, 148, 136, 0.1)",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#e0f2f1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },

  infoText: {
    flex: 1,
  },

  label: {
    fontSize: 10,
    color: "#94a3b8",
    fontWeight: "800",
    textTransform: 'uppercase',
  },

  value: {
    fontSize: 17,
    fontWeight: "700",
    color: "#134e4a",
    marginTop: 1,
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    marginVertical: 15,
    marginLeft: 60,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoutLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ef4444",
  },

  pressed: {
    opacity: 0.6,
  },

  footer: {
    marginTop: 40,
    alignItems: 'center',
  },

  madeWith: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "700",
  },

});