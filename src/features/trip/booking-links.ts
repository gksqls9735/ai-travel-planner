type AccommodationBookingInput = {
  accommodationName: string;
  destination: string;
  endDate: string;
  partySize: number;
  roomCount: number;
  startDate: string;
};

export function buildAccommodationBookingUrl(input: AccommodationBookingInput) {
  const query = [input.accommodationName, input.destination].filter(Boolean).join(' ');
  const parameters = [
    ['ss', query],
    ['checkin', input.startDate],
    ['checkout', input.endDate],
    ['group_adults', String(input.partySize)],
    ['no_rooms', String(input.roomCount)],
  ].filter(([, value]) => Boolean(value));

  const search = parameters.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
  return `https://www.booking.com/searchresults.html?${search}`;
}
