use std::io::{Cursor, Read};
use std::sync::{Arc, Mutex};
use std::time::Instant;

use clap::Parser;
use rodio::{Decoder, OutputStream, Sink};
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt};
use tokio::net::UnixListener;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

#[derive(Parser)]
#[command(name = "klets-audio", about = "Audio player for klets CLI")]
struct Cli {
    /// Path to the Unix domain socket for IPC
    #[arg(long)]
    socket: String,
}

// ---------------------------------------------------------------------------
// IPC protocol types
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
struct Request {
    id: u64,
    cmd: String,
    #[serde(default)]
    url: Option<String>,
    #[serde(default)]
    start_seconds: Option<f64>,
    #[serde(default)]
    seconds: Option<f64>,
    #[serde(default)]
    relative: Option<bool>,
    #[serde(default)]
    speed: Option<f32>,
}

#[derive(Debug, Serialize)]
struct Response {
    id: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    ok: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    state: Option<PlayerStateResp>,
}

#[derive(Debug, Clone, Serialize)]
struct PlayerStateResp {
    active: bool,
    position: f64,
    duration: f64,
}

// ---------------------------------------------------------------------------
// SharedBytes — Arc<Vec<u8>> that implements AsRef<[u8]> for Cursor
// ---------------------------------------------------------------------------

#[derive(Clone)]
struct SharedBytes(Arc<Vec<u8>>);

impl AsRef<[u8]> for SharedBytes {
    fn as_ref(&self) -> &[u8] {
        &self.0
    }
}

// ---------------------------------------------------------------------------
// Player state (shared via Arc<Mutex<State>>)
// All fields are Send — OutputStream is NOT here.
// ---------------------------------------------------------------------------

struct State {
    generation: u64,
    audio_data: Option<Arc<Vec<u8>>>,
    start_instant: Option<Instant>,
    offset_secs: f64,
    duration_secs: f64,
    speed: f32,
    active: bool,
}

impl Default for State {
    fn default() -> Self {
        Self {
            generation: 0,
            audio_data: None,
            start_instant: None,
            offset_secs: 0.0,
            duration_secs: 0.0,
            speed: 1.0,
            active: false,
        }
    }
}

impl State {
    fn position(&self) -> f64 {
        match self.start_instant {
            Some(t) => self.offset_secs + t.elapsed().as_secs_f64() * self.speed as f64,
            None => self.offset_secs,
        }
    }

    fn reset(&mut self) {
        self.audio_data = None;
        self.start_instant = None;
        self.offset_secs = 0.0;
        self.duration_secs = 0.0;
        self.active = false;
    }

    fn to_resp(&self) -> PlayerStateResp {
        PlayerStateResp {
            active: self.active,
            position: self.position(),
            duration: self.duration_secs,
        }
    }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Average MP3 bitrate for duration estimation (128 kbps)
const AVG_MP3_BITRATE: u64 = 128_000;

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let cli = Cli::parse();
    let _ = std::fs::remove_file(&cli.socket);

    let listener = UnixListener::bind(&cli.socket).expect("failed to bind Unix socket");

    // OutputStream must stay alive on the main thread for audio to work.
    // Sink is Send + Sync and can be shared with background threads.
    let (_stream, handle) =
        OutputStream::try_default().expect("failed to open audio output");
    let sink = Arc::new(Sink::try_new(&handle).expect("failed to create audio sink"));

    let state = Arc::new(Mutex::new(State::default()));

    loop {
        let (conn, _) = match listener.accept().await {
            Ok(v) => v,
            Err(_) => continue,
        };

        let (read_half, mut write_half) = tokio::io::split(conn);
        let mut lines = tokio::io::BufReader::new(read_half).lines();

        while let Ok(Some(line)) = lines.next_line().await {
            let req: Request = match serde_json::from_str(&line) {
                Ok(r) => r,
                Err(e) => {
                    let resp = Response {
                        id: 0,
                        ok: None,
                        error: Some(format!("parse error: {e}")),
                        state: None,
                    };
                    let mut buf = serde_json::to_string(&resp).unwrap();
                    buf.push('\n');
                    let _ = write_half.write_all(buf.as_bytes()).await;
                    continue;
                }
            };

            let is_quit = req.cmd == "quit";
            let resp = handle_request(&req, &sink, &state);

            let mut buf = serde_json::to_string(&resp).unwrap();
            buf.push('\n');
            let _ = write_half.write_all(buf.as_bytes()).await;

            if is_quit {
                let _ = std::fs::remove_file(&cli.socket);
                std::process::exit(0);
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Command dispatch
// ---------------------------------------------------------------------------

fn handle_request(
    req: &Request,
    sink: &Arc<Sink>,
    state: &Arc<Mutex<State>>,
) -> Response {
    match req.cmd.as_str() {
        "play" => cmd_play(req, sink, state),
        "stop" => cmd_stop(req, sink, state),
        "seek" => cmd_seek(req, sink, state),
        "get_state" => cmd_get_state(req, sink, state),
        "set_speed" => cmd_set_speed(req, sink, state),
        "quit" => Response {
            id: req.id,
            ok: Some(true),
            error: None,
            state: None,
        },
        _ => Response {
            id: req.id,
            ok: None,
            error: Some(format!("unknown command: {}", req.cmd)),
            state: None,
        },
    }
}

// ---------------------------------------------------------------------------
// play — downloads full MP3 to memory on a background thread
// ---------------------------------------------------------------------------

fn cmd_play(req: &Request, sink: &Arc<Sink>, state: &Arc<Mutex<State>>) -> Response {
    let url = match &req.url {
        Some(u) => u.clone(),
        None => {
            return Response {
                id: req.id,
                ok: None,
                error: Some("missing url".into()),
                state: None,
            }
        }
    };
    let start = req.start_seconds.unwrap_or(0.0);

    // Stop current playback and bump generation
    let gen = {
        let mut s = state.lock().unwrap();
        sink.stop();
        s.reset();
        s.generation += 1;
        s.active = true;
        s.offset_secs = start;
        s.generation
    };

    // Download + decode on a background thread
    let sink = Arc::clone(sink);
    let state = Arc::clone(state);
    std::thread::spawn(move || {
        if let Err(e) = download_and_play(&sink, &state, &url, start, gen) {
            eprintln!("play error: {e}");
            let mut s = state.lock().unwrap();
            if s.generation == gen {
                s.active = false;
            }
        }
    });

    Response {
        id: req.id,
        ok: Some(true),
        error: None,
        state: None,
    }
}

fn download_and_play(
    sink: &Sink,
    state: &Mutex<State>,
    url: &str,
    start_seconds: f64,
    gen: u64,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let resp = ureq::get(url).call()?;
    let content_length: u64 = resp
        .headers()
        .get("content-length")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);

    let duration_secs = if content_length > 0 {
        content_length as f64 / (AVG_MP3_BITRATE as f64 / 8.0)
    } else {
        0.0
    };

    let mut body = Vec::new();
    resp.into_body().into_reader().read_to_end(&mut body)?;

    // Bail if a newer play/stop was issued during download
    if state.lock().unwrap().generation != gen {
        return Ok(());
    }

    let body = Arc::new(body);

    // Create cursor, optionally seek to start position
    let mut cursor = Cursor::new(SharedBytes(Arc::clone(&body)));
    if start_seconds > 0.0 && duration_secs > 0.0 {
        let byte_offset = ((start_seconds / duration_secs) * body.len() as f64) as u64;
        cursor.set_position(byte_offset);
    }

    let source =
        Decoder::new(cursor).map_err(|e| format!("decode error: {e}"))?;

    // Final generation check before committing
    {
        let mut s = state.lock().unwrap();
        if s.generation != gen {
            return Ok(());
        }
        s.audio_data = Some(body);
        s.duration_secs = duration_secs;
        s.start_instant = Some(Instant::now());
    }

    let speed = state.lock().unwrap().speed;
    sink.set_speed(speed);
    sink.append(source);
    sink.play();

    Ok(())
}

// ---------------------------------------------------------------------------
// stop
// ---------------------------------------------------------------------------

fn cmd_stop(req: &Request, sink: &Arc<Sink>, state: &Arc<Mutex<State>>) -> Response {
    let mut s = state.lock().unwrap();
    sink.stop();
    s.reset();
    s.generation += 1;
    Response {
        id: req.id,
        ok: Some(true),
        error: None,
        state: None,
    }
}

// ---------------------------------------------------------------------------
// seek — uses cached audio data (no re-download)
// ---------------------------------------------------------------------------

fn cmd_seek(req: &Request, sink: &Arc<Sink>, state: &Arc<Mutex<State>>) -> Response {
    let seconds = req.seconds.unwrap_or(0.0);
    let relative = req.relative.unwrap_or(false);

    let mut s = state.lock().unwrap();
    if !s.active {
        return Response {
            id: req.id,
            ok: Some(false),
            error: Some("not playing".into()),
            state: None,
        };
    }

    let current = s.position();
    let target = if relative {
        (current + seconds).max(0.0)
    } else {
        seconds.max(0.0)
    };

    if let Some(ref data) = s.audio_data {
        let byte_offset = if s.duration_secs > 0.0 {
            ((target / s.duration_secs) * data.len() as f64) as u64
        } else {
            0
        };

        let mut cursor = Cursor::new(SharedBytes(Arc::clone(data)));
        cursor.set_position(byte_offset);

        match Decoder::new(cursor) {
            Ok(source) => {
                s.generation += 1; // invalidate any in-flight downloads
                sink.stop();
                sink.set_speed(s.speed);
                sink.append(source);
                sink.play();

                s.offset_secs = target;
                s.start_instant = Some(Instant::now());
            }
            Err(e) => {
                return Response {
                    id: req.id,
                    ok: Some(false),
                    error: Some(format!("seek decode error: {e}")),
                    state: None,
                };
            }
        }
    } else {
        return Response {
            id: req.id,
            ok: Some(false),
            error: Some("no audio data cached".into()),
            state: None,
        };
    }

    Response {
        id: req.id,
        ok: Some(true),
        error: None,
        state: Some(s.to_resp()),
    }
}

// ---------------------------------------------------------------------------
// get_state
// ---------------------------------------------------------------------------

fn cmd_get_state(req: &Request, sink: &Arc<Sink>, state: &Arc<Mutex<State>>) -> Response {
    let mut s = state.lock().unwrap();
    // Detect end of playback
    if s.active && s.start_instant.is_some() && sink.empty() {
        s.active = false;
        s.start_instant = None;
    }
    Response {
        id: req.id,
        ok: None,
        error: None,
        state: Some(s.to_resp()),
    }
}

// ---------------------------------------------------------------------------
// set_speed
// ---------------------------------------------------------------------------

fn cmd_set_speed(req: &Request, sink: &Arc<Sink>, state: &Arc<Mutex<State>>) -> Response {
    let speed = req.speed.unwrap_or(1.0);
    let mut s = state.lock().unwrap();

    // Record current position before changing speed
    if let Some(t) = s.start_instant {
        s.offset_secs += t.elapsed().as_secs_f64() * s.speed as f64;
        s.start_instant = Some(Instant::now());
    }
    s.speed = speed;
    sink.set_speed(speed);

    Response {
        id: req.id,
        ok: Some(true),
        error: None,
        state: None,
    }
}
