import React, { useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useLocationStore } from "@/store/locationStore";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Toast from "react-native-toast-message";

export default function CreateScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { lat, lng } = useLocationStore();

  const [foodName, setFoodName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [price, setPrice] = useState("");
  const [caption, setCaption] = useState("");
  const [locationName, setLocationName] = useState("");
  const [city, setCity] = useState("");
  const [images, setImages] = useState<{ uri: string; type: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  if (!isAuthenticated) {
    return (
      <View style={styles.authGate}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.authTitle}>Login required</Text>
        <Text style={styles.authSub}>Sign in to share food posts</Text>
        <Button title="Sign in" onPress={() => router.push("/auth/login")} style={styles.authBtn} />
      </View>
    );
  }

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 5 - images.length,
    });
    if (result.canceled) return;
    const picked = result.assets.map((a) => ({
      uri: a.uri,
      type: a.mimeType ?? "image/jpeg",
      name: a.fileName ?? `photo_${Date.now()}.jpg`,
    }));
    setImages((prev) => [...prev, ...picked].slice(0, 5));
  };

  const removeImage = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!foodName.trim()) { Toast.show({ type: "error", text1: "Food name required" }); return; }
    if (!restaurantName.trim()) { Toast.show({ type: "error", text1: "Restaurant name required" }); return; }
    if (images.length === 0) { Toast.show({ type: "error", text1: "Add at least one photo" }); return; }

    setSubmitting(true);
    const form = new FormData() as any;
    form.append("food_name", foodName);
    form.append("restaurant_name", restaurantName);
    if (price) form.append("price", price);
    if (caption) form.append("caption", caption);
    if (locationName) form.append("location_name", locationName);
    if (city) form.append("city", city);
    if (lat) form.append("latitude", String(lat));
    if (lng) form.append("longitude", String(lng));
    images.forEach((img) => form.append("images", { uri: img.uri, type: img.type, name: img.name } as any));

    try {
      const { data: post } = await api.post("/posts", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Toast.show({ type: "success", text1: "Post shared!" });
      router.push(`/post/${post.id}`);
    } catch (e: any) {
      Toast.show({ type: "error", text1: e.response?.data?.detail ?? "Failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Share a food experience</Text>

      {/* Image picker */}
      <TouchableOpacity onPress={pickImages} style={styles.imagePicker}>
        <Ionicons name="camera" size={28} color="#9ca3af" />
        <Text style={styles.imagePickerText}>Add photos (up to 5)</Text>
      </TouchableOpacity>

      {images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {images.map((img, i) => (
            <View key={i} style={styles.imageThumb}>
              <Image source={{ uri: img.uri }} style={styles.thumbImg} />
              <TouchableOpacity onPress={() => removeImage(i)} style={styles.removeBtn}>
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Food section */}
      <Text style={styles.sectionLabel}>Food details</Text>
      <View style={styles.card}>
        <Input value={foodName} onChangeText={setFoodName} placeholder="Food name *" style={styles.field} />
        <Input value={restaurantName} onChangeText={setRestaurantName} placeholder="Restaurant name *" style={styles.field} />
        <Input value={price} onChangeText={setPrice} placeholder="Price (optional)" keyboardType="numeric" style={styles.field} />
        <TextInput
          value={caption}
          onChangeText={setCaption}
          placeholder="Write a review or caption..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          style={[styles.fieldBase, styles.textArea]}
        />
      </View>

      {/* Location section */}
      <Text style={styles.sectionLabel}>📍 Location</Text>
      <View style={styles.card}>
        <Input value={locationName} onChangeText={setLocationName} placeholder="Location name" style={styles.field} />
        <Input value={city} onChangeText={setCity} placeholder="City" />
        {lat && lng && (
          <View style={styles.gpsBanner}>
            <Ionicons name="location" size={14} color="#f97316" />
            <Text style={styles.gpsText}>GPS coordinates will be attached</Text>
          </View>
        )}
      </View>

      <Button title="Share post" onPress={handleSubmit} loading={submitting} style={styles.submitBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 16 },
  imagePicker: { borderWidth: 2, borderStyle: "dashed", borderColor: "#d1d5db", borderRadius: 16, padding: 24, alignItems: "center", gap: 8, marginBottom: 12, backgroundColor: "#fff" },
  imagePickerText: { fontSize: 14, color: "#9ca3af" },
  imageThumb: { position: "relative", marginRight: 8 },
  thumbImg: { width: 80, height: 80, borderRadius: 12 },
  removeBtn: { position: "absolute", top: -5, right: -5, backgroundColor: "#ef4444", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, gap: 12, marginBottom: 16 },
  field: { marginBottom: 0 },
  fieldBase: { borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: "#111827" },
  textArea: { height: 90, textAlignVertical: "top" },
  gpsBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff7ed", borderRadius: 10, padding: 10 },
  gpsText: { fontSize: 13, color: "#f97316", fontWeight: "500" },
  submitBtn: { marginTop: 8 },
  authGate: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8 },
  lockIcon: { fontSize: 48 },
  authTitle: { fontSize: 22, fontWeight: "700", color: "#111827" },
  authSub: { fontSize: 15, color: "#6b7280" },
  authBtn: { marginTop: 12, width: "100%" },
});
