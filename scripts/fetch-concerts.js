// Pulls upcoming concerts at Jiffy Lube Live (Bristow, VA) from the
// Ticketmaster Discovery API and writes them to concerts.json.
// Run automatically by .github/workflows/update-concerts.yml on a schedule.

const fs = require('fs');

const API_KEY = process.env.TICKETMASTER_API_KEY;
const VENUES = [
  { id: 'KovZpZAEk6JA', place: 'Jiffy Lube Live, Bristow' },
  { id: 'KovZpZA7knFA', place: '9:30 Club, Washington DC' },
  { id: 'KovZpaKuJe', place: 'Capital One Arena, Washington DC' },
  { id: 'KovZ917A3Y7', place: 'The Anthem, Washington DC' },
  ];

if (!API_KEY) {
  console.error('Missing TICKETMASTER_API_KEY environment variable.');
  process.exit(1);
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

async function fetchVenue(venue) {
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&venueId=${venue.id}&size=100&sort=date,asc`;
    const res = await fetch(url);

    if (!res.ok) {
          console.error('Ticketmaster API request failed for', venue.place, res.status, await res.text());
          return [];
    }

    const data = await res.json();
    const events = (data._embedded && data._embedded.events) || [];

    return events
      .filter(ev => ev.dates && ev.dates.start && ev.dates.start.localDate)
      .map(ev => ({
        title: ev.name,
         date: ev.dates.start.localDate,
         time: formatTime(ev.dates.start.localTime),
         place: venue.place,
         cat: (ev.classifications && ev.classifications[0] && ev.classifications[0].segment && ev.classifications[0].segment.name === 'Sports') ? 'sports' : 'concerts',
      }));
}

async function main() {
    let allConcerts = [];
    for (const venue of VENUES) {
          const venueConcerts = await fetchVenue(venue);
          allConcerts = allConcerts.concat(venueConcerts);
    }

    allConcerts.sort((a, b) => a.date.localeCompare(b.date));

    fs.writeFileSync('concerts.json', JSON.stringify(allConcerts, null, 2) + '\n');
    console.log(`Wrote ${allConcerts.length} concerts to concerts.json`);
}
main().catch(err => {
  console.error(err);
  process.exit(1);
});
