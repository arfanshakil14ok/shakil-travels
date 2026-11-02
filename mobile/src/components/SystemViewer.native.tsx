import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  BackHandler,
  Linking,
  Platform,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { colors } from '../theme/colors';

interface SystemViewerProps {
  currentUrl: string;
  onUrlChange?: (url: string) => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  iframeRef?: React.RefObject<any>;
  webViewRef?: React.RefObject<any>;
}

export const SystemViewer: React.FC<SystemViewerProps> = ({
  currentUrl,
  onUrlChange,
  webViewRef: externalRef,
}) => {
  const localRef = useRef<WebView>(null);
  const webView = externalRef || localRef;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBackState, setCanGoBackState] = useState(false);

  // Hardware Back Handler for Android
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (canGoBackState && webView.current) {
        webView.current.goBack();
        return true;
      }
      return false; // Exit app
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBackState, webView]);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBackState(navState.canGoBack);
    if (onUrlChange && navState.url) {
      onUrlChange(navState.url);
    }
  };

  const handleShouldStartLoad = (request: { url: string }) => {
    const url = request.url;

    // Handle deep links like tel:, whatsapp:, mailto:
    if (
      url.startsWith('tel:') ||
      url.startsWith('whatsapp:') ||
      url.startsWith('mailto:') ||
      url.includes('wa.me')
    ) {
      Linking.openURL(url).catch((err) => {
        console.warn('Failed to open external URL:', err);
      });
      return false; // Don't load inside WebView
    }

    return true;
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.navy.primary} />
          <Text style={styles.loadingText}>লোড হচ্ছে...</Text>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>সার্ভারের সাথে সংযোগ পাওয়া যায়নি</Text>
          <Text style={styles.errorSub}>
            ইন্টারনেট বা লোকাল সার্ভার সংযোগ পরীক্ষা করুন।
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setError(false);
              setLoading(true);
              webView.current?.reload();
            }}
          >
            <Text style={styles.retryBtnText}>পুনরায় চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webView as any}
          source={{ uri: currentUrl }}
          style={styles.webView}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
          cacheEnabled={true}
          userAgent="ShakilTravelsApp/1.0.0 (Android)"
          originWhitelist={['*']}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
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
