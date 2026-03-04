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
  ?                   Help (sneltoetsen)
  h/l                 Pagina / tabs
  tab                 Wissel focus / tab
  f                   Filter (seizoen)
  s                   Sorteer
  p                   Afspelen / stoppen
  space               Afspelen / pauzeren (globaal)
  < >                 Spoelen ±15s (mpv)
  [ ]                 Vorig / volgend hoofdstuk
  - +                 Afspeelsnelheid
  t                   Transcript
  o                   Link openen in browser
  b                   Favoriet aan/uit
  a                   Toevoegen aan wachtrij
  r                   Opnieuw laden (bij fout)

Audio:
  Ingebouwde audio (geen externe tools nodig)
  Optioneel: mpv voor spoelen en snelheid`);
	process.exit(0);
}

const React = await import('react');
const { render } = await import('ink');
const { App } = await import('./app.js');
const { playJingle } = await import('./audio/jingle.js');
const { initBackend } = await import('./player/index.js');

await initBackend();
playJingle();
render(React.createElement(App));
