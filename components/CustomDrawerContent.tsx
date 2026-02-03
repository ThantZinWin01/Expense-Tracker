import { DrawerContentScrollView, DrawerItemList } from "@react-navigation/drawer";
import { Platform, StyleSheet, Text, View } from "react-native";

export default function CustomDrawerContent(props: any) {
  return (
    <View style={styles.container}>

      <View style={styles.drawerHeader}>
        <Text style={styles.brandMain}>Expense</Text>
        <Text style={styles.brandSub}>Tracker</Text>
        <View style={styles.accentLine} />
      </View>

      <DrawerContentScrollView {...props} contentContainerStyle={styles.scrollContent}>
        <View style={styles.listWrapper}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      <View style={styles.drawerFooter}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#fff"
  },

  drawerHeader: {
    paddingTop: 60,
    paddingBottom: 30,
    alignItems: "center",
    backgroundColor: "#f0fdfa",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(13, 148, 136, 0.1)",
  },

  brandMain: {
    fontSize: 32,
    fontWeight: "300",
    color: "#0f172a",
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },

  brandSub: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0d9488",
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginTop: -5,
    marginLeft: 5,
  },

  accentLine: {
    width: 20,
    height: 2,
    backgroundColor: "#0d9488",
    marginTop: 8,
    borderRadius: 1,
    opacity: 0.5,
  },

  scrollContent: {
    paddingTop: 20
  },

  listWrapper: {
    paddingHorizontal: 12,
  },

  drawerFooter: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },

  versionText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1
  }

});