import AppButton from "@/components/AppButton";
import AppInput from "@/components/AppInput";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const emailRegex = /^\S+@\S+\.\S+$/;

type Field = "username" | "email" | "password" | "confirm";
type FieldErrors = Partial<Record<Field, string>>;

export default function LoginScreen() {
  const { login, register, setUser } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const timersRef = useRef<Partial<Record<Field, ReturnType<typeof setTimeout>>>>({});

  const [helperErrors, setHelperErrors] = useState<FieldErrors>({});
  const helperTimersRef = useRef<Partial<Record<Field, ReturnType<typeof setTimeout>>>>({});

  const clearError = (field: Field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

    const t = timersRef.current[field];
    if (t) {
      clearTimeout(t);
      delete timersRef.current[field];
    }
  };

  const showError = (field: Field, msg: string) => {
    setErrors((prev) => ({ ...prev, [field]: msg }));

    const old = timersRef.current[field];
    if (old) clearTimeout(old);

    timersRef.current[field] = setTimeout(() => {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      delete timersRef.current[field];
    }, 3000);
  };

  const clearHelperError = (field: Field) => {
    setHelperErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

    const t = helperTimersRef.current[field];
    if (t) {
      clearTimeout(t);
      delete helperTimersRef.current[field];
    }
  };

  const showHelperError = (field: Field, msg: string) => {
    setHelperErrors((prev) => ({ ...prev, [field]: msg }));

    const old = helperTimersRef.current[field];
    if (old) clearTimeout(old);

    helperTimersRef.current[field] = setTimeout(() => {
      setHelperErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      delete helperTimersRef.current[field];
    }, 3000);
  };

  const clearAllErrors = () => {
    setErrors({});
    Object.values(timersRef.current).forEach((t) => t && clearTimeout(t));
    timersRef.current = {};

    setHelperErrors({});
    Object.values(helperTimersRef.current).forEach((t) => t && clearTimeout(t));
    helperTimersRef.current = {};
  };

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => t && clearTimeout(t));
      Object.values(helperTimersRef.current).forEach((t) => t && clearTimeout(t));
    };
  }, []);

  const setField = (field: Field, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) clearError(field);
    if (helperErrors[field]) clearHelperError(field);
  };

  const validate = () => {
    clearAllErrors();

    const username = form.username.trim();
    const email = form.email.trim();
    const password = form.password;
    const confirm = form.confirm;

    if (!username) {
      showError("username", "Please enter username.");
      return false;
    }

    if (!isLogin) {
      if (!email) {
        showError("email", "Please enter email address.");
        return false;
      }

      if (!emailRegex.test(email)) {
        showError("email", "Please enter a valid email (example: name@gmail.com).");
        return false;
      }
    }

    if (!password.trim()) {
      showError("password", "Please enter password.");
      return false;
    }

    if (password.length < 4) {
      showError("password", "Password must be at least 4 characters.");
      return false;
    }

    if (!isLogin) {
      if (!confirm.trim()) {
        showError("confirm", "Please confirm your password.");
        return false;
      }

      if (password !== confirm) {
        showHelperError("confirm", "Password doesn't match.");
        return false;
      }
    }

    return true;
  };


  const placeAuthError = (msg: string) => {
    const m = msg.toLowerCase();

    if (m.includes("username already exists")) return showHelperError("username", msg);
    if (m.includes("email already exists")) return showHelperError("email", msg);

    if (m.includes("user not found")) return showHelperError("password", msg);
    if (m.includes("invalid password")) return showHelperError("password", msg);

    if (isLogin) return showHelperError("password", msg);
    return showHelperError("confirm", msg);
  };

  const handleAuth = async () => {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const { username, email, password } = form;

      if (isLogin) {
        const userData = await login(username, password);
        setUser(userData);
        return;
      }

      await register(username, email, password);

      setIsLogin(true);
      setForm((prev) => ({
        username: prev.username.trim(),
        email: prev.email.trim(),
        password: "",
        confirm: "",
      }));
      setShowPass(false);
      setShowConfirm(false);
      clearAllErrors();
    } catch (e: any) {
      placeAuthError(e?.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  };

  const onSwitchMode = () => {
    setIsLogin((v) => !v);
    setLoading(false);
    setShowPass(false);
    setShowConfirm(false);
    setForm({ username: "", email: "", password: "", confirm: "" });
    clearAllErrors();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.brandSection}>
              <Text style={styles.brandMain}>Expense</Text>
              <Text style={styles.brandSub}>Tracker</Text>
            </View>

            <View style={styles.formWrapper}>
              <View style={styles.authCard}>
                <View style={styles.cardHeader}>
                  <Text style={styles.formTitle}>{isLogin ? "Sign In" : "Register"}</Text>
                  <View style={styles.titleLine} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Username</Text>
                  <AppInput
                    placeholder="Enter username"
                    value={form.username}
                    onChangeText={(t) => setField("username", t)}
                    error={errors.username}
                    helperError={helperErrors.username}
                  />
                </View>

                {!isLogin && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.fieldLabel}>Email Address</Text>
                    <AppInput
                      placeholder="email@example.com"
                      value={form.email}
                      onChangeText={(t) => setField("email", t)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      error={errors.email}
                      helperError={helperErrors.email}
                    />
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View style={styles.passwordContainer}>
                    <AppInput
                      placeholder="••••••••"
                      value={form.password}
                      onChangeText={(t) => setField("password", t)}
                      secureTextEntry={!showPass}
                      error={errors.password}
                      helperError={helperErrors.password}
                      style={styles.passwordInput}
                    />
                    <Pressable style={styles.eyeBtn} onPress={() => setShowPass((v) => !v)}>
                      <Ionicons
                        name={showPass ? "eye-outline" : "eye-off-outline"}
                        size={22}
                        color="#94a3b8"
                      />
                    </Pressable>
                  </View>
                </View>

                {!isLogin && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.fieldLabel}>Confirm Password</Text>
                    <View style={styles.passwordContainer}>
                      <AppInput
                        placeholder="••••••••"
                        value={form.confirm}
                        onChangeText={(t) => setField("confirm", t)}
                        secureTextEntry={!showConfirm}
                        error={errors.confirm}
                        helperError={helperErrors.confirm}
                        style={styles.passwordInput}
                      />
                      <Pressable
                        style={styles.eyeBtn}
                        onPress={() => setShowConfirm((v) => !v)}
                      >
                        <Ionicons
                          name={showConfirm ? "eye-outline" : "eye-off-outline"}
                          size={22}
                          color="#94a3b8"
                        />
                      </Pressable>
                    </View>
                  </View>
                )}

                <View style={styles.buttonContainer}>
                  {loading ? (
                    <ActivityIndicator color="#0d9488" size="large" />
                  ) : (
                    <AppButton
                      title={isLogin ? "CONTINUE" : "GET STARTED"}
                      onPress={handleAuth}
                      style={styles.actionButton}
                    />
                  )}
                </View>

                <Pressable onPress={onSwitchMode} style={styles.switchBtn}>
                  <Text style={styles.switchText}>
                    {isLogin ? "Don't have an account? " : "Back to "}
                    <Text style={styles.switchLink}>{isLogin ? "Create New" : "Login"}</Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  brandSection: { paddingTop: 80, paddingBottom: 40, alignItems: "center" },
  brandMain: {
    fontSize: 52,
    fontWeight: "300",
    color: "#0f172a",
    fontStyle: "italic",
    fontFamily: Platform.OS === "ios" ? "Times New Roman" : "serif",
  },
  brandSub: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0d9488",
    textTransform: "uppercase",
    letterSpacing: 8,
    marginTop: -10,
    marginLeft: 10,
  },

  formWrapper: { flex: 1, paddingHorizontal: 25 },

  authCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 35,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  cardHeader: { marginBottom: 30 },
  formTitle: { fontSize: 22, fontWeight: "700", color: "#1e293b" },
  titleLine: { width: 30, height: 3, backgroundColor: "#0d9488", marginTop: 4, borderRadius: 2 },

  inputGroup: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748b",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  passwordContainer: { justifyContent: "center" },
  eyeBtn: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center",
    zIndex: 10,
  },

  passwordInput: {
    paddingRight: 52,
  },

  buttonContainer: { marginTop: 6 },
  actionButton: { backgroundColor: "#0d9488", height: 56, borderRadius: 12 },

  switchBtn: { marginTop: 25, alignItems: "center" },
  switchText: { color: "#94a3b8", fontSize: 14, fontWeight: "500" },
  switchLink: { color: "#0d9488", fontWeight: "700" },
});
