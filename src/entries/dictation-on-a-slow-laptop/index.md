---
title: Dictation on a laptop too slow to transcribe
date: 2026-10-10
summary: I ran speech-to-text locally with Handy, but the laptop couldn't keep up. Now a short shell script records the clip and sends it to Whisper on Groq.
topic: Linux
poster:
  src: ./poster.jpg
  alt: A black ThinkPad open on a wooden desk at night, its screen glowing amber, with a small black microphone beside it. Thin indigo sound waves flow from the laptop off the left edge of the frame.
---

I press `Mod+D`, talk, press it again, and the text turns up at the cursor. Most of what I
dictate is instructions to my agents.

For a while transcription ran on the laptop itself, the ThinkPad T460s from
[an earlier entry](/blog/an-agent-that-configures-my-machine). It's a stopgap with 8GB of memory
and an old CPU, fine as a thin client but too slow for speech-to-text.

## Handy, locally

[Handy](https://github.com/cjpais/Handy) records you, transcribes with a local model so nothing
leaves the machine, and types the result. It took a few fixes to get working under niri, but it
was too slow. Even on Canary 180M, a small model, a longer clip could take 20-30 seconds to come
back.

## Groq instead

So I dropped Handy for a short script. The first press starts recording with `ffmpeg`, the
second stops it, sends the clip off, and types what comes back with `wtype`.

I tried Gemini first. It took 3-4 seconds and on the free tier mostly answered "service
overloaded". Now the clip goes to `whisper-large-v3-turbo`, a dedicated speech-to-text
model, on [Groq](https://groq.com). The free tier allows about 2,000 requests a day, and it's near
instant: I stop talking and the text is there. Whisper punctuates well enough that I'm trying it
without a clean-up pass, an LLM tidying the text, for now.

Here it is, as the Home Manager module that installs it. The prompt is a list of words Whisper
would otherwise mishear, and the API key sits in a file outside the repo.

```nix
{ pkgs, ... }:
let
  prompt = "niri, noctalia, nixpkgs, NixOS, home-manager, disko, forgejo, yazi, foot, zsh.";

  dictate = pkgs.writeShellApplication {
    name = "dictate";
    runtimeInputs = with pkgs; [
      coreutils
      curl
      ffmpeg
      libnotify
      wl-clipboard
      wtype
    ];
    text = ''
      clip="$XDG_RUNTIME_DIR/dictate.wav"
      pidfile="$XDG_RUNTIME_DIR/dictate.pid"
      log="$XDG_RUNTIME_DIR/dictate.log"

      pid=$(cat "$pidfile" 2>/dev/null || true)
      rm -f "$pidfile"
      if [ -n "$pid" ] && kill -INT "$pid" 2>/dev/null; then
        while kill -0 "$pid" 2>/dev/null; do sleep 0.05; done
      else
        notify-send -t 1000 "Dictating" || true
        ffmpeg -nostdin -loglevel error -y \
          -f pulse -i default -ac 1 -ar 16000 "$clip" &
        echo $! > "$pidfile"
        exit 0
      fi

      text=$(curl -sS --fail-with-body \
        https://api.groq.com/openai/v1/audio/transcriptions \
        -H "Authorization: Bearer $(cat "$HOME/.groq-token")" \
        -F model=whisper-large-v3-turbo \
        -F response_format=text \
        -F language=en \
        -F prompt=${pkgs.lib.escapeShellArg prompt} \
        -F file=@"$clip" | tee "$log") || text=

      rm -f "$clip"

      if [ -z "$text" ]; then
        notify-send -u critical "Dictation failed" "$log" || true
        exit 1
      fi

      printf '%s' "$text" | wl-copy
      printf '%s' "$text" | wtype -
      notify-send -t 2000 "Dictated" "$text" || true
    '';
  };
in
{
  home.packages = [ dictate ];
}
```

niri binds it to a key with `Mod+D repeat=false { spawn "dictate"; }`. The text also lands on the clipboard,
in case the cursor was somewhere `wtype` can't type into.

## What it costs

My voice now goes to Groq every time I press the key, and dictation needs a network connection.
I'm fine with both for now, since what I dictate isn't sensitive and this laptop is temporary.
When I'm on something with more memory and a faster CPU, transcription moves back onto the
machine.
