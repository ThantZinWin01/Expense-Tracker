import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  helperError?: string | null;
}

export default function AppInput({
  label,
  style,
  error,
  helperError,
  value,
  placeholder,
  ...props
}: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const textValue =
    typeof value === "string"
      ? value
      : value === null || value === undefined
        ? ""
        : String(value);

  //  Detects error state
  const hasAnyError = !!error || !!helperError;

  const showErrorInPlaceholder = !!error && textValue.trim().length === 0;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        value={textValue}
        style={[
          styles.input,
          style,
          isFocused && styles.inputFocused,
          hasAnyError && styles.inputError,
        ]}
        placeholder={showErrorInPlaceholder ? error! : placeholder}
        placeholderTextColor={
          showErrorInPlaceholder ? "rgba(239,68,68,0.9)" : "#cbd5e1"
        }
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        {...props}
      />

      {/* Logic error shown below the input */}
      {!!helperError && <Text style={styles.helperError}>{helperError}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 4, width: "100%" },

  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  input: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 12,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
    minHeight: 54,
  },

  inputFocused: {
    backgroundColor: "#fff",
    borderColor: "#0d9488",
  },

  inputError: {
    backgroundColor: "rgba(239, 68, 68, 0.04)",
    borderColor: "rgba(239, 68, 68, 0.35)",
  },

  helperError: {
    marginTop: 6,
    marginLeft: 4,
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
});
