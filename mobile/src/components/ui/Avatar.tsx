import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { mediaUrl } from "@/lib/api";

interface Props {
  url?: string | null;
  username: string;
  size?: number;
}

export default function Avatar({ url, username, size = 40 }: Props) {
  const r = size / 2;
  if (url) {
    return (
      <Image
        source={{ uri: mediaUrl(url) }}
        style={{ width: size, height: size, borderRadius: r }}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: r }]}>
      <Text style={[styles.letter, { fontSize: size * 0.38 }]}>
        {username[0]?.toUpperCase() ?? "?"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { backgroundColor: "#ffedd5", alignItems: "center", justifyContent: "center" },
  letter: { color: "#f97316", fontWeight: "700" },
});
