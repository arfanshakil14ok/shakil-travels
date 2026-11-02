import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { APP_CONFIG } from '../config/appConfig';

interface SystemViewerProps {
  currentUrl: string;
  onUrlChange?: (url: string) => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  iframeRef?: React.RefObject<any>;
  webViewRef?: React.RefObject<any>;
  iframeKey?: number;
}

export const SystemViewer: React.FC<SystemViewerProps> = ({
  currentUrl,
  onUrlChange,
  iframeRef,
  iframeKey,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [currentUrl]);

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.navy.primary} />
          <Text style={styles.loadingText}>শাকিল ট্রাভেলস সিস্টেম লোড হচ্ছে...</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>সার্ভারের সাথে সংযোগ ব্যর্থ</Text>
          <Text style={styles.errorSub}>
            অনুগ্রহ করে নিশ্চিত করুন যে ব্যাকএন্ড সার্ভার (port 3000) সচল রয়েছে।
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setError(false);
              setLoading(true);
            }}
          >
            <Text style={styles.retryBtnText}>পুনরায় চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <iframe
          key={iframeKey || currentUrl}
          ref={iframeRef as any}
          src={currentUrl}
          style={webStyles.iframe as any}
          title="SHAKIL TRAVELS ERP & PORTAL"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          allow="camera; microphone; geolocation"
        />
      )}
    </View>
  );
};

const webStyles = {
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    backgroundColor: '#ffffff',
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.navy.primary,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background.page,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.status.error,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: colors.navy.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
