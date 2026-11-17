import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, styles } from '../components/Screen';
import { COLORS } from '../constants/theme';
import { api, money } from '../services/api';

const initial = { ventas: { valor: 0, variacion: 0 }, clientes_con_deuda: { valor: 0, variacion: 0 }, pedidos_pendientes: { valor: 0, variacion: 0 }, productos_bajo_stock: { valor: 0, variacion: 0 } };
export function DashboardScreen() {
  const [stats, setStats] = useState<any>(initial); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => { setError(''); try { const data = await api<any>('/products/stats-dash'); setStats(data?.stats ?? initial); } catch (e: any) { setError(e.message || 'No se pudieron cargar estadísticas.'); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const cards = [
    { label: 'Ventas del mes', value: money(stats.ventas?.valor), icon: 'trending-up-outline' as const, color: '#FFFFFF', tint: COLORS.navy },
    { label: 'Pedidos pendientes', value: String(stats.pedidos_pendientes?.valor ?? 0), icon: 'receipt-outline' as const, color: '#FFFFFF', tint: COLORS.blue },
    { label: 'Clientes con deuda', value: String(stats.clientes_con_deuda?.valor ?? 0), icon: 'people-outline' as const, color: '#FFFFFF', tint: '#4169E1' },
    { label: 'Bajo stock', value: String(stats.productos_bajo_stock?.valor ?? 0), icon: 'cube-outline' as const, color: COLORS.navy, tint: COLORS.sky },
  ];
  return <Screen title="Resumen del negocio" subtitle="Indicadores actuales de tu tienda." refreshing={loading} onRefresh={load}>
    {loading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} /> : null}{error ? <Text style={{ color: COLORS.red, marginTop: 16 }}>{error}</Text> : null}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22 }}>{cards.map(item => <View key={item.label} style={[styles.card, { width: '47%', flexGrow: 1, minHeight: 126, padding: 14 }]}>
      <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: item.tint, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={item.icon} size={18} color={item.color} /></View>
      <Text style={{ color: COLORS.muted, fontSize: 11, marginTop: 13 }}>{item.label}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={{ color: COLORS.text, fontSize: 19, fontWeight: '800', marginTop: 3 }}>{item.value}</Text>
    </View>)}</View>
    <Text style={styles.section}>Estado</Text><View style={styles.card}><Text style={{ color: COLORS.muted, fontSize: 13, lineHeight: 20 }}>{error ? 'No hay conexión con el servidor. Desliza hacia abajo para reintentar.' : 'Estadísticas sincronizadas desde Mini-Tienda.'}</Text></View>
  </Screen>;
}
