"use client";

import { useEffect, useRef, useState } from "react";

/**
 * `useAudioWaveform` extracts a fixed-size array of normalised RMS peaks
 * from an audio source URL using the Web Audio API.
 *
 * - Decodes the file with a temporary `AudioContext` (closed once the
 *   peaks are computed; we never keep an open context for playback).
 * - Aggregates samples into `bucketCount` buckets and stores the RMS
 *   amplitude per bucket.
 * - Normalises peaks to the `[0, 1]` range based on the loudest bucket so
 *   the visualisation always uses the available vertical space.
 * - Falls back to a neutral synthesised pattern when the browser blocks
 *   decoding (e.g. range requests blocked, CORS without proper headers).
 *
 * The fallback is **deterministic** (sin Math.random) so the bars don't
 * shimmer on re-render — visually we keep a static placeholder waveform
 * while the audio either streams or fails to decode.
 */
export interface AudioWaveformResult {
  /** Normalised peaks in `[0, 1]`. Length === bucketCount. */
  peaks: number[];
  /** True while the file is being fetched + decoded. */
  loading: boolean;
  /** Set if extraction failed; UI should fall back to a placeholder shape. */
  error: Error | null;
}

const DEFAULT_BUCKETS = 48;

/** Deterministic decorative wave so the UI never collapses to a flat line. */
function placeholderPeaks(buckets: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < buckets; i += 1) {
    // Two interleaved sines for a natural-looking but stable shape.
    const a = Math.sin(i * 0.42) * 0.35;
    const b = Math.sin(i * 0.18 + 1.4) * 0.18;
    const v = 0.45 + a + b;
    out.push(Math.min(1, Math.max(0.08, v)));
  }
  return out;
}

export function useAudioWaveform(
  src: string | null | undefined,
  bucketCount: number = DEFAULT_BUCKETS,
): AudioWaveformResult {
  const [peaks, setPeaks] = useState<number[]>(() =>
    placeholderPeaks(bucketCount),
  );
  const [loading, setLoading] = useState<boolean>(!!src);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(null);
      setPeaks(placeholderPeaks(bucketCount));
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const AudioCtx =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext
        : undefined;
    if (!AudioCtx) {
      setLoading(false);
      setPeaks(placeholderPeaks(bucketCount));
      return;
    }

    const run = async () => {
      let ctx: AudioContext | null = null;
      try {
        const res = await fetch(src, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} fetching audio`);
        }
        const buf = await res.arrayBuffer();
        ctx = new AudioCtx();
        const decoded = await ctx.decodeAudioData(buf.slice(0));

        // Mix down to a single channel via average — works for stereo &
        // multi-channel files alike.
        const channelCount = decoded.numberOfChannels;
        const length = decoded.length;
        const samples = new Float32Array(length);
        for (let c = 0; c < channelCount; c += 1) {
          const data = decoded.getChannelData(c);
          for (let i = 0; i < length; i += 1) {
            samples[i] = (samples[i] ?? 0) + data[i]! / channelCount;
          }
        }

        const bucketSize = Math.max(1, Math.floor(length / bucketCount));
        const out: number[] = new Array(bucketCount).fill(0);
        let max = 0;
        for (let b = 0; b < bucketCount; b += 1) {
          const start = b * bucketSize;
          const end = Math.min(start + bucketSize, length);
          let sumSq = 0;
          for (let i = start; i < end; i += 1) {
            const v = samples[i]!;
            sumSq += v * v;
          }
          const rms = Math.sqrt(sumSq / Math.max(1, end - start));
          out[b] = rms;
          if (rms > max) max = rms;
        }

        // Normalise to the loudest bucket so the visualiser uses the full
        // vertical space. Floor at 0.06 so quiet sections still show.
        const norm = max > 0 ? max : 1;
        const normalised = out.map((v) => Math.max(0.06, v / norm));

        if (!cancelled) {
          setPeaks(normalised);
          setLoading(false);
        }
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
        setPeaks(placeholderPeaks(bucketCount));
        setLoading(false);
      } finally {
        if (ctx && ctx.state !== "closed") {
          // Best-effort cleanup; some browsers throw if already closed.
          ctx.close().catch(() => undefined);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [src, bucketCount]);

  return { peaks, loading, error };
}
