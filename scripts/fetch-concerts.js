// Pulls upcoming concerts at Jiffy Lube Live (Bristow, VA) from the
// Ticketmaster Discovery API and writes them to concerts.json.
// Run automatically by .github/workflows/update-concerts.yml on a schedule.

const fs = require('fs');

const API_KEY = process.env.TICKETMASTER_API_KEY;
const VENUE_ID = 'KovZpZAEk6JA'; // Jiffy Lube Live, Bristow VA

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

async function main() {
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${API_KEY}&venueId=${VENUE_ID}&size=100&sort=date,asc`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error('Ticketmaster API request failed:', res.status, await res.text());
    process.exit(1);
  }

  const data = await res.json();
  const events = (data._embedded && data._embedded.events) || [];

  const concerts = events
    .filter(ev => ev.dates && ev.dates.start && ev.dates.start.localDate)
    .map(ev => ({
      title: ev.name,
      date: ev.dates.start.localDate,
      time: formatTime(ev.dates.start.localTime),
      place: 'Jiffy Lube Live, Bristow',
    }));

  fs.writeFileSync('concerts.json', JSON.stringify(concerts, null, 2) + '\n');
  console.log(`Wrote ${concerts.length} concerts to concerts.json`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
