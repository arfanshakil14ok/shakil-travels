import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from './src/theme/colors';
import { APP_CONFIG } from './src/config/appConfig';
import { HomeScreen } from './src/screens/HomeScreen';
import { JobsScreen } from './src/screens/JobsScreen';
import { TrackingScreen } from './src/screens/TrackingScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
import { PortalScreen } from './src/screens/PortalScreen';
import { BottomNavBar, TabKey } from './src/components/BottomNavBar';
import { SystemViewer } from './src/components/SystemViewer';

export type DeviceViewMode = 'android' | 'iphone' | 'fullscreen';
export type AppDisplayMode = 'candidate_app' | 'web_view';

export default function App() {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Mode state: Default is 100% Native Candidate Mobile App
  const [appMode, setAppMode] = useState<AppDisplayMode>('candidate_app');
  const [deviceMode, setDeviceMode] = useState<DeviceViewMode>('android');
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [currentTime, setCurrentTime] = useState<string>('09:41');

  // Web view URL state (for optional system web inspection)
  const [currentUrl, setCurrentUrl] = useState<string>(APP_CONFIG.baseUrl);
  const [iframeKey, setIframeKey] = useState<number>(1);
  const viewerRef = useRef<any>(null);

  // Digital clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenDirect = () => {
    const targetUrl = appMode === 'web_view' ? currentUrl : `${APP_CONFIG.baseUrl}/portal`;
    if (Platform.OS === 'web') {
      window.open(targetUrl, '_blank');
    } else {
      Linking.openURL(targetUrl);
    }
  };

  // Determine if desktop simulation frame should be shown
  const isLargeScreen = Platform.OS === 'web' && windowWidth > 640;
  const isFrameMode = isLargeScreen && deviceMode !== 'fullscreen';

  const getPhoneWidth = () => {
    if (deviceMode === 'iphone') return 390;
    return 412; // Flagship Android Phone width
  };

  const phoneWidth = getPhoneWidth();
  const phoneHeight = Math.min(880, Math.max(680, windowHeight - 90));

  // Render the active candidate screen
  const renderCandidateScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onNavigateToJobs={() => setActiveTab('jobs')}
            onNavigateToTracking={() => setActiveTab('tracking')}
            onNavigateToServices={() => setActiveTab('services')}
            onNavigateToPortal={() => setActiveTab('portal')}
          />
        );
      case 'jobs':
        return <JobsScreen />;
      case 'tracking':
        return <TrackingScreen />;
      case 'services':
        return <ServicesScreen />;
      case 'portal':
        return <PortalScreen />;
      default:
        return (
          <HomeScreen
            onNavigateToJobs={() => setActiveTab('jobs')}
            onNavigateToTracking={() => setActiveTab('tracking')}
            onNavigateToServices={() => setActiveTab('services')}
            onNavigateToPortal={() => setActiveTab('portal')}
          />
        );
    }
  };

  // The actual Mobile App UI
  const renderMobileAppContent = () => (
    <View style={styles.appShell}>
      {/* Smartphone Hardware Notch / Status Bar Simulation */}
      {isFrameMode && (
        <View style={styles.phoneHardwareHeader}>
          <Text style={styles.phoneClockText}>{currentTime}</Text>
          <View style={styles.phoneSpeakerNotch}>
            <View style={styles.cameraLens} />
          </View>
          <View style={styles.phoneStatusIcons}>
            <Ionicons name="cellular" size={14} color="#fff" />
            <Ionicons name="wifi" size={14} color="#fff" />
            <Ionicons name="battery-full" size={16} color="#fff" />
          </View>
        </View>
      )}

      {/* Main Screen Content */}
      <View style={styles.mainContent}>
        {appMode === 'candidate_app' ? (
          renderCandidateScreen()
        ) : (
          <SystemViewer
            currentUrl={currentUrl}
            iframeKey={iframeKey}
            webViewRef={viewerRef}
          />
        )}
      </View>

      {/* Bottom Navigation Bar for Candidate */}
      {appMode === 'candidate_app' && (
        <BottomNavBar
          currentTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          jobsCount={8}
        />
      )}

      {/* Home Gesture Bar for Smartphone Frame */}
      {isFrameMode && (
        <View style={styles.phoneHomeBarContainer}>
          <View style={styles.phoneHomeBar} />
        </View>
      )}
    </View>
  );

  // If on Desktop Web: wrap in a luxurious device simulator stage
  if (isLargeScreen) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.desktopStudioWrapper}>
          {/* Top Device Switcher & Mode Toolbar */}
          <View style={styles.deviceToolbar}>
            <View style={styles.toolbarBrandGroup}>
              <View style={styles.brandIconCircle}>
                <Ionicons name="phone-portrait-outline" size={16} color={colors.gold.primary} />
              </View>
              <View>
                <Text style={styles.toolbarTitle}>ক্যান্ডিডেট অ্যান্ড্রয়েড অ্যাপ UI</Text>
                <Text style={styles.toolbarSubtitle}>গ্রাহকদের জন্য ডেডিকেটেড মোবাইল ইন্টারফেস</Text>
              </View>
            </View>

            {/* App View Mode Switcher: Candidate App vs Web System */}
            <View style={styles.modeToggleGroup}>
              <TouchableOpacity
                style={[
                  styles.modeToggleBtn,
                  appMode === 'candidate_app' && styles.modeToggleBtnActive,
                ]}
                onPress={() => setAppMode('candidate_app')}
              >
                <Ionicons
                  name="person"
                  size={13}
                  color={appMode === 'candidate_app' ? '#fff' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.modeToggleText,
                    appMode === 'candidate_app' && styles.modeToggleTextActive,
                  ]}
                >
                  ক্যান্ডিডেট অ্যাপ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeToggleBtn,
                  appMode === 'web_view' && styles.modeToggleBtnActive,
                ]}
                onPress={() => setAppMode('web_view')}
              >
                <Ionicons
                  name="globe-outline"
                  size={13}
                  color={appMode === 'web_view' ? '#fff' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.modeToggleText,
                    appMode === 'web_view' && styles.modeToggleTextActive,
                  ]}
                >
                  ওয়েব ভিউ
                </Text>
              </TouchableOpacity>
            </View>

            {/* Device Switcher Buttons */}
            <View style={styles.deviceButtonsGroup}>
              <TouchableOpacity
                style={[styles.deviceSwitchBtn, deviceMode === 'android' && styles.deviceSwitchBtnActive]}
                onPress={() => setDeviceMode('android')}
              >
                <Ionicons
                  name="logo-android"
                  size={14}
                  color={deviceMode === 'android' ? '#fff' : '#94A3B8'}
                />
                <Text
                  style={[styles.deviceSwitchText, deviceMode === 'android' && styles.deviceSwitchTextActive]}
                >
                  Android (412px)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deviceSwitchBtn, deviceMode === 'iphone' && styles.deviceSwitchBtnActive]}
                onPress={() => setDeviceMode('iphone')}
              >
                <Ionicons
                  name="logo-apple"
                  size={14}
                  color={deviceMode === 'iphone' ? '#fff' : '#94A3B8'}
                />
                <Text
                  style={[styles.deviceSwitchText, deviceMode === 'iphone' && styles.deviceSwitchTextActive]}
                >
                  iPhone (390px)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deviceSwitchBtn, deviceMode === 'fullscreen' && styles.deviceSwitchBtnActive]}
                onPress={() => setDeviceMode('fullscreen')}
              >
                <Ionicons
                  name="expand"
                  size={13}
                  color={deviceMode === 'fullscreen' ? '#fff' : '#94A3B8'}
                />
                <Text
                  style={[styles.deviceSwitchText, deviceMode === 'fullscreen' && styles.deviceSwitchTextActive]}
                >
                  ফুলস্ক্রিন
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.openExternalBtn}
                onPress={handleOpenDirect}
                accessibilityLabel="ব্রাউজারে খুলুন"
              >
                <Ionicons name="open-outline" size={15} color="#CBD5E1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Centered Phone Chassis or Fullscreen */}
          {deviceMode === 'fullscreen' ? (
            <View style={{ flex: 1, width: '100%' }}>
              {renderMobileAppContent()}
            </View>
          ) : (
            <View style={styles.phoneStage}>
              <View
                style={[
                  styles.smartphoneChassis,
                  { width: phoneWidth, height: phoneHeight },
                ]}
              >
                {renderMobileAppContent()}
              </View>
            </View>
          )}
        </View>
      </SafeAreaProvider>
    );
  }

  // If on actual mobile screen or Android APK build
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar style="light" />
        {renderMobileAppContent()}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.navy.primary,
  },
  // Desktop Studio Simulation Styling
  desktopStudioWrapper: {
    flex: 1,
    backgroundColor: '#0B132B',
    backgroundImage: 'radial-gradient(#1E293B 1px, #0B132B 1px)' as any,
    backgroundSize: '24px 24px' as any,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  deviceToolbar: {
    width: '100%',
    height: 58,
    backgroundColor: 'rgba(11, 19, 43, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  toolbarBrandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  toolbarTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  toolbarSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
  },
  modeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  modeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
  },
  modeToggleBtnActive: {
    backgroundColor: colors.navy.primary,
    borderWidth: 1,
    borderColor: colors.gold.primary,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deviceButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  deviceSwitchBtnActive: {
    backgroundColor: colors.navy.primary,
    borderColor: colors.gold.primary,
  },
  deviceSwitchText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  deviceSwitchTextActive: {
    color: '#fff',
  },
  openExternalBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginLeft: 4,
  },
  phoneStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  smartphoneChassis: {
    backgroundColor: '#000',
    borderRadius: 44,
    borderWidth: 10,
    borderColor: '#1E293B',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.6,
    shadowRadius: 35,
    elevation: 25,
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 2px #334155' as any,
  },
  phoneHardwareHeader: {
    height: 36,
    backgroundColor: colors.navy.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  phoneClockText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  phoneSpeakerNotch: {
    width: 80,
    height: 18,
    backgroundColor: '#0F172A',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraLens: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  phoneStatusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // App Shell Inside Frame
  appShell: {
    flex: 1,
    backgroundColor: colors.navy.primary,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  phoneHomeBarContainer: {
    height: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneHomeBar: {
    width: 130,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
  },
});
