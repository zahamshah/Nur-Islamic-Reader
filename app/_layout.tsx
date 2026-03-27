import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ReaderSettingsProvider } from "@/context/ReaderSettingsContext";
import { ReadingProgressProvider } from "@/context/ReadingProgressContext";
import { AppSettingsProvider, useAppSettings } from "@/context/AppSettingsContext";
import { ReadingHistoryProvider } from "@/context/ReadingHistoryContext";

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { theme } = useAppSettings();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="series/[seriesId]" />
      <Stack.Screen name="read/[seriesId]/[chapterId]" />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AppSettingsProvider>
          <ReaderSettingsProvider>
            <ReadingProgressProvider>
              <ReadingHistoryProvider>
                <RootLayoutNav />
              </ReadingHistoryProvider>
            </ReadingProgressProvider>
          </ReaderSettingsProvider>
        </AppSettingsProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
