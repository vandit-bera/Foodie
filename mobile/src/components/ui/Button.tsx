import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from "react-native";

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  style?: ViewStyle;
}

export default function Button({ title, onPress, loading, disabled, variant = "primary", style }: Props) {
  const isPrimary = variant === "primary";
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[styles.base, isPrimary ? styles.primary : styles.ghost, (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#fff" : "#f97316"} size="small" />
      ) : (
        <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textGhost]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: "#f97316" },
  ghost: { backgroundColor: "#f5f5f5" },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: "600" },
  textPrimary: { color: "#fff" },
  textGhost: { color: "#374151" },
});
