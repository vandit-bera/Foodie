import React from "react";
import { TextInput, StyleSheet, TextInputProps, View, Text } from "react-native";

interface Props extends TextInputProps {
  error?: string;
}

export default function Input({ error, style, ...props }: Props) {
  return (
    <View>
      <TextInput
        placeholderTextColor="#9ca3af"
        style={[styles.input, error ? styles.inputError : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    backgroundColor: "#fff",
    color: "#111827",
  },
  inputError: { borderColor: "#ef4444" },
  error: { color: "#ef4444", fontSize: 12, marginTop: 4 },
});
