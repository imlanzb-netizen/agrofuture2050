"use client";

import { useRef, useState } from "react";

export default function AIPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function askAI() {
    if (!question.trim() && !imageFile && !audioFile) return;

    setLoading(true);
    setAnswer("⏳ AI inafikiria...");

    try {
      let response: Response;

      if (imageFile || audioFile) {
        const formData = new FormData();
        formData.append("question", question.trim());

        if (imageFile) formData.append("image", imageFile);
        if (audioFile) formData.append("audio", audioFile);

        response = await fetch("/api/ai", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: question.trim() }),
        });
      }

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setAnswer(result.error || "Imeshindikana kupata jibu.");
        return;
      }

      setAnswer(result.answer);
      setQuestion("");
      setImageFile(null);
      setAudioFile(null);

      if (cameraRef.current) cameraRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    } catch (error) {
      console.error("AI REQUEST ERROR:", error);
      setAnswer("Kuna tatizo la kuwasiliana na AI. Jaribu tena.");
    } finally {
      setLoading(false);
    }
  }

  async function startRecording() {
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setAnswer("Kifaa au browser yako haiwezi kurekodi sauti.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        const extension = blob.type.includes("mp4") ? "m4a" : "webm";
        setAudioFile(
          new File([blob], `ujumbe-wa-sauti.${extension}`, {
            type: blob.type,
          })
        );

        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };

      recorder.start();
      setRecording(true);
      setAnswer("🎙️ Rekodi sauti yako, kisha bonyeza Simamisha.");
    } catch (error) {
      console.error("RECORDING ERROR:", error);
      setAnswer("Imeshindikana kutumia kipaza sauti. Ruhusu microphone kwenye browser.");
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAF5] px-5 py-7 text-[#173B2A]">
      <div className="mx-auto flex min-h-[90vh] w-full max-w-md flex-col">
        <button
          onClick={() => window.history.back()}
          className="text-left text-sm font-bold text-[#2F9E5B]"
        >
          ← Rudi Dashboard
        </button>

        <div className="mt-7">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF7ED] text-3xl">
            🤖
          </div>

          <h1 className="mt-5 text-3xl font-black">AI Assistant</h1>

          <p className="mt-2 text-sm leading-6 text-[#718578]">
            Uliza swali kuhusu kilimo, ufugaji au biashara ya kilimo.
            Unaweza pia kutuma sauti au picha.
          </p>
        </div>

        <div className="mt-7 flex-1">
          {answer && (
            <div className="whitespace-pre-wrap rounded-3xl border border-[#DCE9DF] bg-white p-5">
              <p className="text-xs font-bold text-[#2F9E5B]">
                🤖 AI Assistant
              </p>
              <p className="mt-3 text-sm leading-6">{answer}</p>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-[#DCE9DF] bg-white p-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            placeholder="Andika swali lako hapa..."
            className="w-full resize-none bg-transparent p-2 text-sm outline-none"
          />

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              disabled={loading || recording}
              className="rounded-xl border border-[#DCE9DF] px-3 py-3 text-sm font-bold disabled:opacity-40"
            >
              📷 Piga picha
            </button>

            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              disabled={loading || recording}
              className="rounded-xl border border-[#DCE9DF] px-3 py-3 text-sm font-bold disabled:opacity-40"
            >
              🖼️ Chagua picha
            </button>
          </div>

          {imageFile && (
            <div className="mt-2 flex items-center justify-between rounded-xl bg-[#EAF7ED] p-3 text-xs">
              <span className="max-w-[220px] truncate">📷 {imageFile.name}</span>
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  if (cameraRef.current) cameraRef.current.value = "";
                  if (galleryRef.current) galleryRef.current.value = "";
                }}
                className="font-bold text-red-600"
              >
                Ondoa
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={loading}
            className={`mt-2 w-full rounded-xl px-3 py-3 text-sm font-bold text-white disabled:opacity-40 ${
              recording ? "bg-red-600" : "bg-[#477B9B]"
            }`}
          >
            {recording ? "⏹️ Simamisha kurekodi" : "🎙️ Rekodi sauti"}
          </button>

          {audioFile && !recording && (
            <div className="mt-2 flex items-center justify-between rounded-xl bg-[#EAF7ED] p-3 text-xs">
              <span>🎵 Sauti imerekodiwa tayari</span>
              <button
                type="button"
                onClick={() => setAudioFile(null)}
                className="font-bold text-red-600"
              >
                Ondoa
              </button>
            </div>
          )}

          <button
            onClick={askAI}
            disabled={
              loading ||
              recording ||
              (!question.trim() && !imageFile && !audioFile)
            }
            className="mt-3 w-full rounded-2xl bg-[#2F9E5B] py-4 font-bold text-white shadow-lg disabled:opacity-40"
          >
            {loading ? "Inatuma..." : "Tuma kwa AI →"}
          </button>
        </div>
      </div>
    </main>
  );
}
