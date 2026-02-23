import CustomDrawerContent from "@/components/CustomDrawerContent";
import { Ionicons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: "#fff",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#f1f5f9",
        },
        headerTitleStyle: {
          fontWeight: "800",
          fontSize: 16,
          color: "#0f172a",
          letterSpacing: -0.5,
        },
        headerTintColor: "#0d9488",

        drawerType: "slide",
        drawerStyle: {
          width: 280,
          backgroundColor: "#fff",
        },

        drawerActiveBackgroundColor: "#f0fdfa",
        drawerActiveTintColor: "#0d9488",
        drawerInactiveTintColor: "#64748b",

        drawerLabelStyle: {
          marginLeft: -10,
          fontWeight: "700",
          fontSize: 14,
        },
        drawerItemStyle: {
          borderRadius: 12,
          paddingHorizontal: 12,
          marginVertical: 4,
          marginHorizontal: 8,
        },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Dashboard",
          drawerIcon: ({ color }) => (
            <Ionicons name="grid-outline" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="add-expense"
        options={{
          title: "New Expense",
          drawerIcon: ({ color }) => (
            <Ionicons name="add-circle-outline" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="categories"
        options={{
          title: "Categories",
          drawerIcon: ({ color }) => (
            <Ionicons name="pricetags-outline" size={20} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="summary"
        options={{
          title: "Summary",
          drawerIcon: ({ color }) => (
            <Ionicons name="pie-chart-outline" size={20} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          drawerItemPress: (e) => {
            // Stop default behavior (which merges params)
            e.preventDefault();

            // Navigate to summary but REPLACE params (clear "from")
            navigation.navigate({
              name: "summary",
              params: {},      // or { from: undefined }
              merge: false,
            });
          },
        })}
      />

      <Drawer.Screen
        name="settings"
        options={{
          title: "Setting",
          drawerIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={20} color={color} />
          ),
        }}
      />

      <Drawer.Screen
        name="expense/[id]"
        options={{
          drawerItemStyle: { display: "none" },
          headerTitle: "Edit Expense",
        }}
      />
      <Drawer.Screen
        name="category/[id]"
        options={{
          drawerItemStyle: { display: "none" },
          headerShown: false,
        }}
      />
    </Drawer>
  );
}
