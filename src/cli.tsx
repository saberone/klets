import { VERSION } from './version.js';
import { parseArgs } from './commands/args.js';
import { createProcessIo } from './commands/output.js';

function helpText(version: string): string {
	return `klets ${version} — CodeKlets Podcast TUI

Gebruik:
  klets                                   Start de TUI
  klets play <slug|latest>                Start de TUI en speel een aflevering af
                                          (hervat waar je gebleven was)
  klets search <zoekterm> [--json]        Zoek in afleveringen en transcripten
  klets transcript <slug|latest>          Print het transcript als tekst
         [--vtt | --json]                 ...of als WebVTT / JSON
  klets --help                            Toon dit bericht
  klets --version                         Toon versie

  --json print alleen de API-data als JSON (handig voor jq).
  Geen kleur als de uitvoer geen terminal is of NO_COLOR is gezet.
  Exitcodes: 0 ok, 1 fout (niet gevonden, netwerk), 2 verkeerd gebruik.

Toetsen:
  j/k, ↑/↓           Navigeer in lijsten
  enter               Open item
  esc                 Terug (of zoekopdracht wissen)
  q                   Afsluiten
  ?                   Help (sneltoetsen)
  h/l                 Pagina / tabs
  tab                 Wissel focus / tab
  f                   Filter (seizoen) / volg afspelen (transcript)
  s                   Sorteer
  p                   Afspelen / stoppen / verder luisteren
  space               Afspelen / pauzeren (globaal)
  < >                 Spoelen ±15s
  [ ]                 Vorig / volgend hoofdstuk
  - +                 Afspeelsnelheid
  t                   Transcript
  o                   Link openen in browser
  y                   Deel-link kopiëren (aflevering, hoofdstuk, segment)
  /                   Zoeken in transcript
  n / N               Volgende / vorige zoektreffer
  b                   Favoriet aan/uit
  a                   Toevoegen aan wachtrij
  x                   Verwijderen uit geschiedenis
  r                   Opnieuw laden (bij fout)

Audio:
  Ingebouwde audio (geen externe tools nodig)
  Optioneel: mpv voor spoelen en snelheid`;
}

// Only pure modules are imported statically. Print commands load the API
// client on demand; ink, react, the player and the jingle are only loaded
// for the TUI (see commands/tui.ts).
const command = parseArgs(process.argv.slice(2));

switch (command.kind) {
	case 'version': {
		console.log(`klets ${VERSION}`);
		break;
	}

	case 'help': {
		console.log(helpText(VERSION));
		break;
	}

	case 'usage-error': {
		process.stderr.write(`klets: ${command.message}\n${command.usage}\n`);
		process.exitCode = 2;
		break;
	}

	case 'search': {
		const { runSearch } = await import('./commands/search.js');
		process.exitCode = await runSearch(command.query, { json: command.json }, createProcessIo());
		break;
	}

	case 'transcript': {
		const { runTranscript } = await import('./commands/transcript.js');
		process.exitCode = await runTranscript(command.target, command.format, createProcessIo());
		break;
	}

	case 'play': {
		const { preparePlay } = await import('./commands/play.js');
		const episode = await preparePlay(command.target, createProcessIo());
		if (!episode) {
			process.exitCode = 1;
			break;
		}
		const { startTui } = await import('./commands/tui.js');
		await startTui({ episode });
		break;
	}

	case 'tui': {
		const { startTui } = await import('./commands/tui.js');
		await startTui();
		break;
	}
}
