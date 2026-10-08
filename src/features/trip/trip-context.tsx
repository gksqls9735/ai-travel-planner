import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

export type Pace = 'relaxed' | 'balanced' | 'packed';
export type TripState = {
  destination: string; destinationCode: string; startDate: string; endDate: string;
  arrivalTime: string; departureTime: string; flightLater: boolean; companions: string[];
  partySize: number; pace: Pace; interests: string[]; requests: string[];
};
const initialTrip: TripState = {
  destination: '', destinationCode: '', startDate: '', endDate: '', arrivalTime: '14:30',
  departureTime: '18:10', flightLater: false, companions: [], partySize: 2, pace: 'balanced',
  interests: ['맛집 탐방', '전통 문화', '골목 산책'], requests: [],
};
type TripContextValue = { trip: TripState; updateTrip: (patch: Partial<TripState>) => void };
const TripContext = createContext<TripContextValue | null>(null);

export function TripProvider({ children }: PropsWithChildren) {
  const [trip, setTrip] = useState(initialTrip);
  const value = useMemo(() => ({ trip, updateTrip: (patch: Partial<TripState>) => setTrip((current) => ({ ...current, ...patch })) }), [trip]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}
export function useTrip() {
  const value = useContext(TripContext);
  if (!value) throw new Error('useTrip must be used inside TripProvider');
  return value;
}
export const destinations = [
  { city: '도쿄', country: '일본', airport: '하네다 · 나리타 국제공항', code: 'TYO' },
  { city: '오사카', country: '일본', airport: '간사이 국제공항', code: 'KIX' },
  { city: '파리', country: '프랑스', airport: '샤를 드골 공항', code: 'CDG' },
  { city: '뉴욕', country: '미국', airport: 'JFK · 라과디아 공항', code: 'NYC' },
  { city: '방콕', country: '태국', airport: '수완나품 국제공항', code: 'BKK' },
  { city: '다낭', country: '베트남', airport: '다낭 국제공항', code: 'DAD' },
];
