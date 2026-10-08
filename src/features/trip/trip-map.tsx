import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from './theme';

export function TripMap({ activeDay = 0, showDetails = true }: { activeDay?: number; showDetails?: boolean }) {
  const colorsByDay = [colors.primary, colors.accent, '#A567E5', '#EE8A35']; const active = colorsByDay[activeDay] ?? colors.primary;
  return <View style={styles.map}>
    <View style={styles.water}><Text style={styles.waterText}>SUMIDA RIVER</Text></View>
    <View style={[styles.road, styles.roadA]} /><View style={[styles.road, styles.roadB]} /><View style={[styles.road, styles.roadC]} />
    <View style={[styles.park, styles.parkA]} /><View style={[styles.park, styles.parkB]} />
    <View style={[styles.route, styles.routeA, { backgroundColor: active }]} /><View style={[styles.route, styles.routeB, { backgroundColor: active }]} />
    <Marker number="1" label="센소지" style={styles.pinA} color={active} /><Marker number="2" label="우에노" style={styles.pinB} color={active} /><Marker number="3" label="긴자" style={styles.pinC} color={active} />
    {showDetails ? <View style={styles.mapLabel}><Text style={styles.mapLabelTitle}>DAY {activeDay + 1}</Text><Text style={styles.mapLabelCopy}>도보와 대중교통 중심 동선</Text></View> : null}
    {showDetails ? <View style={styles.zoom}><Text style={styles.zoomText}>＋</Text><View style={styles.zoomDivider} /><Text style={styles.zoomText}>−</Text></View> : null}
  </View>;
}
function Marker({ number, label, style, color }: { number: string; label: string; style: object; color: string }) { return <View style={[styles.markerGroup, style]}><View style={[styles.marker, { backgroundColor: color }]}><Text style={styles.markerNumber}>{number}</Text></View><View style={styles.markerLabel}><Text style={styles.markerLabelText}>{label}</Text></View></View>; }
const styles = StyleSheet.create({
  map: { flex: 1, minHeight: 320, backgroundColor: '#ECE7DF', overflow: 'hidden', position: 'relative' }, water: { position: 'absolute', width: 100, height: '140%', right: '18%', top: '-10%', backgroundColor: '#BFDDE8', transform: [{ rotate: '12deg' }], alignItems: 'center', justifyContent: 'center' }, waterText: { color: '#6EABB9', fontSize: 9, fontWeight: '800', letterSpacing: 2, transform: [{ rotate: '78deg' }] },
  road: { position: 'absolute', height: 10, width: '120%', backgroundColor: '#FFFDF8', borderWidth: 1, borderColor: '#DCD5CB' }, roadA: { top: '26%', left: '-8%', transform: [{ rotate: '8deg' }] }, roadB: { top: '58%', left: '-10%', transform: [{ rotate: '-12deg' }] }, roadC: { top: '72%', left: '-5%', transform: [{ rotate: '4deg' }] }, park: { position: 'absolute', backgroundColor: '#CDDDBF', borderRadius: radius.lg }, parkA: { width: 130, height: 90, left: '8%', top: '8%' }, parkB: { width: 100, height: 70, right: '3%', bottom: '9%' },
  route: { position: 'absolute', height: 4, borderRadius: 2, opacity: 0.85, transformOrigin: 'left' } as never, routeA: { width: '35%', top: '36%', left: '22%', transform: [{ rotate: '22deg' }] }, routeB: { width: '38%', top: '58%', left: '48%', transform: [{ rotate: '-16deg' }] }, markerGroup: { position: 'absolute', alignItems: 'center' }, pinA: { top: '24%', left: '18%' }, pinB: { top: '48%', left: '48%' }, pinC: { top: '36%', right: '12%' }, marker: { width: 34, height: 34, borderRadius: 17, borderWidth: 3, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' }, markerNumber: { color: '#FFF', fontWeight: '900' }, markerLabel: { marginTop: 3, backgroundColor: '#FFF', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }, markerLabelText: { color: colors.text, fontSize: 9, fontWeight: '800' },
  mapLabel: { position: 'absolute', top: 18, left: 18, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.md, paddingHorizontal: 13, paddingVertical: 10 }, mapLabelTitle: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, mapLabelCopy: { color: colors.textSecondary, fontSize: 10, marginTop: 3 }, zoom: { position: 'absolute', bottom: 18, right: 18, width: 38, backgroundColor: '#FFF', borderRadius: radius.sm, alignItems: 'center' }, zoomText: { color: colors.text, fontSize: 19, paddingVertical: 7 }, zoomDivider: { height: 1, width: '100%', backgroundColor: colors.border },
});
