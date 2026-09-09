// Pulls wide theatrical releases opening in the next ~60 days from TMDB
// and writes them to movies.json.
// Run automatically by .github/workflows/update-movies.yml on a schedule.

const fs = require('fs');

const API_KEY = process.env.TMDB_API_KEY;

if (!API_KEY) {
console.error('Missing TMDB_API_KEY environment variable.');
process.exit(1);
}

function formatDate(d) {
return d.toISOString().slice(0, 10);
}

async function main() {
const today = new Date();
const future = new Date();
future.setDate(future.getDate() + 60);

const minDate = formatDate(today);
const maxDate = formatDate(future);

const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&region=US&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&with_release_type=2|3&release_date.gte=${minDate}&release_date.lte=${maxDate}`;

const res = await fetch(url);
if (!res.ok) {
console.error('TMDB API request failed', res.status, await res.text());
process.exit(1);
}

const data = await res.json();
const movies = (data.results || [])
.slice(0, 20)
.map(m => ({ title: m.title, date: m.release_date }));

fs.writeFileSync('movies.json', JSON.stringify(movies, null, 2));
console.log(`Wrote ${movies.length} movies to movies.json`);
}

main().catch(err => {
console.error(err);
process.exit(1);
});
