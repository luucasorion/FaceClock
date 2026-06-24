// CameraCapture — reusable camera-capture component (FE-SHARED-4).
//
// Three flows reuse this: kiosk punch (FE-PUNCH-1), authenticated punch
// (FE-PUNCH-2), and biometric enrollment (FE-ENROLL-1). It opens the front
// camera, shows a live preview with an oval face-guide overlay, and on capture
// draws the current video frame to a canvas, exports a JPEG Blob, and hands it
// to the caller-supplied `onCapture(blob)`.
//
// NFR05 — the client NEVER runs recognition. It only captures bytes and hands
// them to the parent, which wires the upload target. This component does not
// know which endpoint receives the image.
//
// Lifecycle / NFR05 discard guarantees:
//   - The MediaStream is requested on mount and ALL tracks are stopped on
//     unmount and immediately after a capture is handed off.
//   - The captured Blob is passed to `onCapture` and otherwise dropped — it is
//     never cached in state, never turned into an object URL, never written to
//     disk/localStorage. No lingering references remain after handoff.
//
// Props:
//   onCapture(blob)  required — receives the captured image/jpeg Blob.
//   onError(err)     optional — called when getUserMedia/capture fails.
//   captureLabel     optional — capture button text (default "Capturar").
//   quality          optional — JPEG quality 0..1 (default 0.92).
//   autoCaptureCountdown  optional — when set to a positive integer (e.g. 3),
//                    the component runs a visible N…2…1 countdown over the live
//                    video as soon as the stream is ready, then auto-captures —
//                    turning the capture into a single deliberate action for the
//                    kiosk/totem (FE-PUNCH-4). DEFAULT OFF (undefined): the manual
//                    capture button is shown and behavior is identical to before,
//                    so the punch-home and enroll consumers are UNAFFECTED.

import { useEffect, useRef, useState, useCallback } from 'react';
import './CameraCapture.css';

// status: idle | starting | streaming | capturing | error
export default function CameraCapture({
  onCapture,
  onError,
  captureLabel = 'Capturar',
  quality = 0.92,
  autoCaptureCountdown,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  // Remaining seconds for the optional auto-capture countdown (null = inactive).
  const [countdown, setCountdown] = useState(null);

  // Stop every track and drop the stream reference. Safe to call repeatedly.
  const stopStream = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Translate a getUserMedia/DOMException into a clear, user-facing message.
  const describeError = useCallback((err) => {
    // Insecure context (getUserMedia only available over https/localhost).
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      return 'A câmera exige uma conexão segura (HTTPS). Abra a página por HTTPS e tente novamente.';
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return 'Este dispositivo ou navegador não oferece acesso à câmera.';
    }
    switch (err && err.name) {
      case 'NotAllowedError':
      case 'SecurityError':
        return 'Permissão de câmera negada. Autorize o acesso à câmera nas configurações do navegador e recarregue.';
      case 'NotFoundError':
      case 'OverconstrainedError':
        return 'Nenhuma câmera frontal foi encontrada neste dispositivo.';
      case 'NotReadableError':
        return 'Não foi possível acessar a câmera. Ela pode estar em uso por outro aplicativo.';
      default:
        return 'Não foi possível iniciar a câmera. Verifique as permissões e tente novamente.';
    }
  }, []);

  const fail = useCallback(
    (err) => {
      stopStream();
      setStatus('error');
      setErrorMessage(describeError(err));
      if (typeof onError === 'function') onError(err);
    },
    [stopStream, describeError, onError],
  );

  // Request the stream on mount; release it on unmount.
  useEffect(() => {
    let cancelled = false;

    async function start() {
      setStatus('starting');
      setErrorMessage('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        fail(new Error('getUserMedia unavailable'));
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });

        // Component unmounted (or errored) while awaiting — release immediately.
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStatus('streaming');
      } catch (err) {
        if (!cancelled) fail(err);
      }
    }

    start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [fail, stopStream]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || status !== 'streaming') return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      // Stream not ready yet; ignore the tap rather than capturing a blank frame.
      return;
    }

    setStatus('capturing');

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        // Hand the bytes to the parent, then release the camera and drop every
        // reference (NFR05). We never keep the blob, never make an object URL.
        stopStream();
        if (blob && typeof onCapture === 'function') {
          onCapture(blob);
        }
        // Clear the canvas-backed pixels so the frame doesn't linger in memory.
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        setStatus('idle');
      },
      'image/jpeg',
      quality,
    );
  }, [status, onCapture, quality, stopStream]);

  // Optional auto-capture countdown (kiosk/totem). Off unless the prop is a
  // positive integer. Runs once the stream is live: ticks N…1 (one per second)
  // then fires the same handleCapture used by the manual button. The interval is
  // cleared on unmount / status change, so NFR05 teardown is unaffected.
  const autoEnabled =
    Number.isFinite(autoCaptureCountdown) && autoCaptureCountdown > 0;

  useEffect(() => {
    if (!autoEnabled || status !== 'streaming') {
      setCountdown(null);
      return undefined;
    }

    setCountdown(Math.floor(autoCaptureCountdown));
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(id);
          handleCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [autoEnabled, autoCaptureCountdown, status, handleCapture]);

  if (status === 'error') {
    return (
      <div className="camera-capture camera-capture--error" role="alert">
        <p className="camera-capture__error-msg">{errorMessage}</p>
      </div>
    );
  }

  const busy = status !== 'streaming';

  return (
    <div className="camera-capture">
      <div className="camera-capture__stage">
        <video
          ref={videoRef}
          className="camera-capture__video"
          autoPlay
          playsInline
          muted
        />
        {/* Oval face-guide overlay to help users frame their face. */}
        <div className="camera-capture__guide" aria-hidden="true" />
        {status === 'starting' && (
          <p className="camera-capture__hint">Iniciando a câmera…</p>
        )}
        {/* Large countdown digit over the video while auto-capture runs. */}
        {autoEnabled && countdown !== null && countdown > 0 && (
          <div className="camera-capture__countdown" aria-live="assertive">
            {countdown}
          </div>
        )}
        {autoEnabled && status === 'streaming' && (
          <p className="camera-capture__hint">Olhe para a câmera…</p>
        )}
      </div>

      {/* Off-screen canvas used only to grab a frame; never displayed. */}
      <canvas ref={canvasRef} className="camera-capture__canvas" />

      {/* Manual capture button — hidden when auto-capture drives the capture. */}
      {!autoEnabled && (
        <div className="thumb-zone">
          <button
            type="button"
            className="btn-primary"
            onClick={handleCapture}
            disabled={busy}
          >
            {status === 'capturing' ? 'Capturando…' : captureLabel}
          </button>
        </div>
      )}
    </div>
  );
}
