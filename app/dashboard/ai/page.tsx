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


        <div className="relative z-10 rounded-[28px] border border-[#DCE9DF] bg-white p-3 shadow-md shadow-green-900/5">
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

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            placeholder="Uliza chochote kuhusu kilimo..."
            className="w-full resize-none bg-transparent px-3 py-3 text-[15px] outline-none placeholder:text-gray-400"
          />

          {imageFile && (
            <div className="mx-2 mb-2 flex items-center justify-between rounded-2xl bg-[#EAF7ED] p-3 text-xs">
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

          {audioFile && !recording && (
            <div className="mx-2 mb-2 flex items-center justify-between rounded-2xl bg-[#EAF7ED] p-3 text-xs">
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

          <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={loading || recording}
                aria-label="Chagua picha"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-700 transition hover:bg-gray-200 disabled:opacity-40"
              >
                +
              </button>

              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                disabled={loading || recording}
                aria-label="Piga picha"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg transition hover:bg-gray-200 disabled:opacity-40"
              >
                📷
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={loading}
                aria-label={recording ? "Simamisha kurekodi" : "Rekodi sauti"}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition disabled:opacity-40 ${
                  recording
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {recording ? "⏹" : "🎙️"}
              </button>

              <button
                type="button"
                onClick={askAI}
                disabled={
                  loading ||
                  recording ||
                  (!question.trim() && !imageFile && !audioFile)
                }
                aria-label="Tuma ujumbe"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2F9E5B] text-xl font-bold text-white shadow-md transition hover:bg-[#27884D] disabled:opacity-40"
              >
                {loading ? "…" : "↑"}
              </button>
            </div>
          </div>

          {recording && (
            <p className="px-2 pt-2 text-xs font-semibold text-red-600">
              ● Inarekodi sauti... Bonyeza kitufe chekundu kusimamisha.
            </p>
          )}
        </div>

      </div>
    </main>
  );
}
