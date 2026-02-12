import { VERSION } from './version.js';

const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-v')) {
	console.log(`klets ${VERSION}`);
	process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
	console.log(`klets ${VERSION} — CodeKlets Podcast TUI

Gebruik:
  klets              Start de TUI
  klets --help       Toon dit bericht
  klets --version    Toon versie

Toetsen:
  j/k, ↑/↓           Navigeer in lijsten
  enter               Open item
  esc                 Terug
  q                   Afsluiten
  h/l                 Pagina / tabs
  f                   Filter (seizoen)
  s                   Sorteer
  p                   Afspelen / stoppen
  < >                 Spoelen ±15s (mpv)
  [ ]                 Vorig / volgend hoofdstuk
  t                   Transcript
  r                   Opnieuw laden (bij fout)

Vereisten:
  Node.js >= 18
  Audio: mpv (aanbevolen), ffplay, of afplay (macOS)`);
	process.exit(0);
}

const React = await import('react');
const { render } = await import('ink');
const { App } = await import('./app.js');

render(React.createElement(App));
