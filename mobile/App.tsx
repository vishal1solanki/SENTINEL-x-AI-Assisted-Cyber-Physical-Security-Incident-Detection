import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { mobileApi } from './src/services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'INCIDENTS' | 'TRUST' | 'DEVICES' | 'CONFIG'>('DASHBOARD');
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [status, setStatus] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [trustOverview, setTrustOverview] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refreshData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      // Auto-authenticate with demo analyst
      await mobileApi.login();
      const [st, incs, devs, trust] = await Promise.all([
        mobileApi.getSystemStatus(),
        mobileApi.getIncidents(),
        mobileApi.getDevices(),
        mobileApi.getTrustOverview(),
      ]);
      setStatus(st);
      setIncidents(incs);
      setDevices(devs);
      setTrustOverview(trust);
    } catch (err: any) {
      setFeedback(`API Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    mobileApi.setBaseUrl(apiUrl);
    refreshData();
  }, [apiUrl]);

  const handleQuarantine = async (devId: string) => {
    try {
      await mobileApi.quarantineDevice(devId, 'Mobile Operator Quarantine');
      Alert.alert('Simulated Quarantine', `Device ${devId} has been quarantined.`);
      refreshData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleRestore = async (devId: string) => {
    try {
      await mobileApi.restoreDevice(devId, 'Mobile Operator Restoration');
      Alert.alert('Restoration', `Device ${devId} restored to ONLINE.`);
      refreshData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleInvestigate = async (incId: string) => {
    setLoading(true);
    try {
      const res = await mobileApi.investigateIncident(incId);
      Alert.alert('AI Investigation Complete', res.summary);
      refreshData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      await mobileApi.triggerDemo();
      Alert.alert('Scenario Active', '13-step cyber-physical attack scenario dispatched.');
      refreshData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    setLoading(true);
    try {
      await mobileApi.resetDemo();
      Alert.alert('Demo Reset', 'Sensors restored to 100% trust, devices online.');
      refreshData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />

      {/* Top Mobile Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SENTINEL<Text style={styles.cyanText}>-X</Text></Text>
          <Text style={styles.headerSubtitle}>MOBILE INCIDENT RESPONSE</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshData}>
          <Text style={styles.refreshBtnText}>{loading ? 'SYNCING...' : 'REFRESH'}</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'DASHBOARD' && styles.tabActive]}
          onPress={() => setActiveTab('DASHBOARD')}
        >
          <Text style={[styles.tabText, activeTab === 'DASHBOARD' && styles.tabTextActive]}>DASH</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'INCIDENTS' && styles.tabActive]}
          onPress={() => setActiveTab('INCIDENTS')}
        >
          <Text style={[styles.tabText, activeTab === 'INCIDENTS' && styles.tabTextActive]}>
            ALERTS ({incidents.filter((i) => i.status !== 'RESOLVED').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'TRUST' && styles.tabActive]}
          onPress={() => setActiveTab('TRUST')}
        >
          <Text style={[styles.tabText, activeTab === 'TRUST' && styles.tabTextActive]}>TRUST</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'DEVICES' && styles.tabActive]}
          onPress={() => setActiveTab('DEVICES')}
        >
          <Text style={[styles.tabText, activeTab === 'DEVICES' && styles.tabTextActive]}>NODES</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'CONFIG' && styles.tabActive]}
          onPress={() => setActiveTab('CONFIG')}
        >
          <Text style={[styles.tabText, activeTab === 'CONFIG' && styles.tabTextActive]}>CONFIG</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.content}>
        {feedback && (
          <View style={styles.feedbackBanner}>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>
        )}

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'DASHBOARD' && (
          <View style={styles.section}>
            {/* Quick Demo Controls */}
            <View style={styles.demoControlRow}>
              <TouchableOpacity style={styles.demoBtnPrimary} onPress={handleLoadDemo}>
                <Text style={styles.demoBtnText}>▶ RUN FULL SCENARIO</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.demoBtnSecondary} onPress={handleResetDemo}>
                <Text style={styles.demoBtnTextSecondary}>RESET DEMO</Text>
              </TouchableOpacity>
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>ACTIVE INCIDENTS</Text>
                <Text style={[styles.metricValue, { color: '#F43F5E' }]}>
                  {incidents.filter((i) => i.status !== 'RESOLVED').length}
                </Text>
                <Text style={styles.metricSub}>Immediate Attention</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>AVG SENSOR TRUST</Text>
                <Text style={[styles.metricValue, { color: '#00F0FF' }]}>
                  {trustOverview?.average_trust ?? 100}%
                </Text>
                <Text style={styles.metricSub}>Telemetry Health</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>ONLINE NODES</Text>
                <Text style={[styles.metricValue, { color: '#10B981' }]}>
                  {devices.filter((d) => d.status === 'ONLINE').length} / {devices.length}
                </Text>
                <Text style={styles.metricSub}>Perimeter Hardware</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>QUARANTINED</Text>
                <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
                  {devices.filter((d) => d.status === 'QUARANTINED').length}
                </Text>
                <Text style={styles.metricSub}>Isolated Sensors</Text>
              </View>
            </View>

            {/* Critical Alert Spotlight */}
            <Text style={styles.sectionTitle}>CRITICAL INCIDENT SPOTLIGHT</Text>
            {incidents.filter((i) => i.status !== 'RESOLVED').slice(0, 2).map((inc) => (
              <View key={inc.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertId}>{inc.id}</Text>
                  <Text style={styles.alertSeverity}>{inc.severity}</Text>
                </View>
                <Text style={styles.alertTitle}>{inc.title}</Text>
                <Text style={styles.alertSummary}>{inc.summary}</Text>
                <View style={styles.alertActions}>
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => handleInvestigate(inc.id)}
                  >
                    <Text style={styles.actionBtnText}>AI INVESTIGATE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={() => setSelectedIncident(inc)}
                  >
                    <Text style={styles.actionBtnTextSecondary}>DETAILS</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* --- INCIDENTS TAB --- */}
        {activeTab === 'INCIDENTS' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ALL SECURITY INCIDENTS ({incidents.length})</Text>
            {incidents.map((inc) => (
              <View key={inc.id} style={styles.incidentItem}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertId}>{inc.id} • {inc.room_id}</Text>
                  <Text style={[
                    styles.badge,
                    inc.severity === 'CRITICAL' ? styles.badgeCrit :
                    inc.severity === 'HIGH' ? styles.badgeHigh : styles.badgeInfo
                  ]}>
                    {inc.severity}
                  </Text>
                </View>
                <Text style={styles.incidentTitle}>{inc.title}</Text>
                <Text style={styles.incidentSummary}>{inc.summary}</Text>
                <View style={styles.incidentFooter}>
                  <Text style={styles.incidentTime}>{new Date(inc.started_at).toLocaleTimeString()}</Text>
                  <Text style={styles.incidentStatus}>{inc.status}</Text>
                </View>
                <View style={styles.alertActions}>
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => handleInvestigate(inc.id)}
                  >
                    <Text style={styles.actionBtnText}>AI INVESTIGATE</Text>
                  </TouchableOpacity>
                  {inc.status !== 'RESOLVED' && (
                    <TouchableOpacity
                      style={styles.actionBtnSuccess}
                      onPress={async () => {
                        await mobileApi.resolveIncident(inc.id);
                        refreshData();
                      }}
                    >
                      <Text style={styles.actionBtnText}>RESOLVE</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* --- SENSOR TRUST TAB --- */}
        {activeTab === 'TRUST' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PERIMETER SENSOR TRUST SCORES</Text>
            {trustOverview?.sensors?.map((s: any) => (
              <View key={s.id} style={styles.trustCard}>
                <View style={styles.trustHeader}>
                  <Text style={styles.trustId}>{s.id}</Text>
                  <Text style={[
                    styles.trustScore,
                    s.trust_score < 60 ? { color: '#F43F5E' } : { color: '#10B981' }
                  ]}>
                    {s.trust_score}%
                  </Text>
                </View>
                <Text style={styles.trustMeta}>Device: {s.device_id} | Type: {s.sensor_type}</Text>
                <View style={styles.trustBarTrack}>
                  <View
                    style={[
                      styles.trustBarFill,
                      { width: `${s.trust_score}%` },
                      s.trust_score < 60 ? { backgroundColor: '#F43F5E' } : { backgroundColor: '#10B981' }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* --- DEVICES TAB --- */}
        {activeTab === 'DEVICES' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DEVICE INVENTORY & QUARANTINE</Text>
            {devices.map((dev) => (
              <View key={dev.id} style={styles.deviceCard}>
                <View style={styles.deviceHeader}>
                  <Text style={styles.deviceName}>{dev.name}</Text>
                  <Text style={[
                    styles.deviceStatus,
                    dev.status === 'QUARANTINED' ? styles.statusQuarantined : styles.statusOnline
                  ]}>
                    {dev.status}
                  </Text>
                </View>
                <Text style={styles.deviceId}>ID: {dev.id} | Room: {dev.room_id}</Text>
                <Text style={styles.deviceTrust}>Trust Score: {dev.trust_score}%</Text>
                <View style={styles.deviceActions}>
                  {dev.status === 'QUARANTINED' ? (
                    <TouchableOpacity
                      style={styles.restoreBtn}
                      onPress={() => handleRestore(dev.id)}
                    >
                      <Text style={styles.actionBtnText}>RESTORE DEVICE</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.quarantineBtn}
                      onPress={() => handleQuarantine(dev.id)}
                    >
                      <Text style={styles.actionBtnText}>SIMULATE QUARANTINE</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* --- CONFIG TAB --- */}
        {activeTab === 'CONFIG' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BACKEND CONNECTION</Text>
            <View style={styles.configCard}>
              <Text style={styles.configLabel}>FastAPI Backend URL:</Text>
              <TextInput
                style={styles.configInput}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="http://192.168.1.X:8000"
                placeholderTextColor="#64748B"
              />
              <TouchableOpacity style={styles.configSaveBtn} onPress={refreshData}>
                <Text style={styles.configSaveBtnText}>APPLY & TEST CONNECTION</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.configCard, { marginTop: 16 }]}>
              <Text style={styles.configLabel}>System Status:</Text>
              <Text style={styles.configInfo}>Backend: {status?.backend || 'OFFLINE'}</Text>
              <Text style={styles.configInfo}>Database: {status?.database || 'OFFLINE'}</Text>
              <Text style={styles.configInfo}>AI Layer: {status?.ai_status || 'DEMO ACTIVE'}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0C121E',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  cyanText: {
    color: '#00F0FF',
  },
  headerSubtitle: {
    color: '#64748B',
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 2,
  },
  refreshBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#111726',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00F0FF',
    backgroundColor: '#090D16',
  },
  tabText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#00F0FF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  feedbackBanner: {
    backgroundColor: '#064E3B',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  feedbackText: {
    color: '#A7F3D0',
    fontSize: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 8,
  },
  demoControlRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  demoBtnPrimary: {
    flex: 2,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  demoBtnSecondary: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoBtnTextSecondary: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: 'bold',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 4,
  },
  metricSub: {
    color: '#475569',
    fontSize: 10,
  },
  alertCard: {
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#F43F5E40',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertId: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  alertSeverity: {
    color: '#F43F5E',
    fontSize: 10,
    fontWeight: 'bold',
  },
  alertTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  alertSummary: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnSuccess: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionBtnTextSecondary: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: 'bold',
  },
  incidentItem: {
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  incidentTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 4,
  },
  incidentSummary: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 4,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  incidentTime: {
    color: '#475569',
    fontSize: 10,
  },
  incidentStatus: {
    color: '#00F0FF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  badge: {
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeCrit: {
    backgroundColor: '#881337',
    color: '#FDA4AF',
  },
  badgeHigh: {
    backgroundColor: '#78350F',
    color: '#FDE68A',
  },
  badgeInfo: {
    backgroundColor: '#1E293B',
    color: '#94A3B8',
  },
  trustCard: {
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  trustHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trustId: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trustScore: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  trustMeta: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  trustBarTrack: {
    backgroundColor: '#090D16',
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  trustBarFill: {
    height: '100%',
  },
  deviceCard: {
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  deviceStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: '#064E3B',
    color: '#6EE7B7',
  },
  statusQuarantined: {
    backgroundColor: '#881337',
    color: '#FDA4AF',
  },
  deviceId: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 2,
  },
  deviceTrust: {
    color: '#00F0FF',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 4,
  },
  deviceActions: {
    marginTop: 10,
  },
  quarantineBtn: {
    backgroundColor: '#881337',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  restoreBtn: {
    backgroundColor: '#059669',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  configCard: {
    backgroundColor: '#111726',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  configLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  configInput: {
    backgroundColor: '#090D16',
    borderWidth: 1,
    borderColor: '#1E293B',
    color: '#FFF',
    fontSize: 12,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  configSaveBtn: {
    backgroundColor: '#00F0FF',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  configSaveBtnText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  configInfo: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },
});
