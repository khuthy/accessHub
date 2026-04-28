"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUploadThing } from "@/lib/uploadthing-client";
import { Upload, ImageIcon, Video, X, CheckCircle } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tokenCost, setTokenCost] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { startUpload: uploadPreview, isUploading: uploadingPreview } =
    useUploadThing("previewImage");
  const { startUpload: uploadMedia, isUploading: uploadingMedia } =
    useUploadThing("contentMedia");

  const isUploading = uploadingPreview || uploadingMedia;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");

    let finalPreviewUrl = previewUrl;
    let finalMediaUrl = mediaUrl;

    // Upload files if selected
    if (previewFile) {
      const res = await uploadPreview([previewFile]);
      if (!res?.[0]) { setError("Preview upload failed"); setSaving(false); return; }
      finalPreviewUrl = res[0].ufsUrl;
    }
    if (mediaFile) {
      const res = await uploadMedia([mediaFile]);
      if (!res?.[0]) { setError("Media upload failed"); setSaving(false); return; }
      finalMediaUrl = res[0].ufsUrl;
    }

    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        previewUrl: finalPreviewUrl,
        mediaUrl: finalMediaUrl,
        mediaType,
        tokenCost,
        isPublished,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create post");
      setSaving(false);
    } else {
      router.push("/model/content");
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-50">Upload Content</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Give your post a title"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional description…"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Media type */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Content type</label>
          <div className="grid grid-cols-2 gap-2">
            {(["IMAGE", "VIDEO"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMediaType(t)}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition ${
                  mediaType === t
                    ? "border-brand-500 gradient-brand text-white"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {t === "IMAGE" ? <ImageIcon className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                {t === "IMAGE" ? "Image" : "Video"}
              </button>
            ))}
          </div>
        </div>

        {/* Preview image upload */}
        <FilePickerField
          label="Preview thumbnail (shown to everyone, free)"
          accept="image/*"
          file={previewFile}
          uploading={uploadingPreview}
          onSelect={setPreviewFile}
          onClear={() => setPreviewFile(null)}
          hint="JPG, PNG, WebP — max 8MB"
        />

        {/* Full media upload */}
        <FilePickerField
          label={`Full ${mediaType === "VIDEO" ? "video" : "image"} (shown after unlock)`}
          accept={mediaType === "VIDEO" ? "video/*" : "image/*"}
          file={mediaFile}
          uploading={uploadingMedia}
          onSelect={setMediaFile}
          onClear={() => setMediaFile(null)}
          hint={mediaType === "VIDEO" ? "MP4, MOV, WebM — max 512MB" : "JPG, PNG, WebP — max 32MB"}
        />

        {/* Token cost */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Token cost (0 = free for everyone)
          </label>
          <input
            type="number"
            min={0}
            max={9999}
            value={tokenCost}
            onChange={(e) => setTokenCost(Number(e.target.value))}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Publish toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="accent-brand-500 w-4 h-4"
          />
          <span className="text-sm text-zinc-300">Publish immediately</span>
        </label>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || isUploading}
          className="w-full py-2.5 gradient-brand text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? "Uploading files…" : saving ? "Saving…" : "Create post"}
        </button>
      </form>
    </div>
  );
}

function FilePickerField({
  label,
  accept,
  file,
  uploading,
  onSelect,
  onClear,
  hint,
}: {
  label: string;
  accept: string;
  file: File | null;
  uploading: boolean;
  onSelect: (f: File) => void;
  onClear: () => void;
  hint: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-2">{label}</label>

      {file ? (
        <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-brand-700 rounded-lg">
          <CheckCircle className="w-5 h-5 text-brand-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-200 truncate">{file.name}</p>
            <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
          <button type="button" onClick={onClear} className="text-zinc-500 hover:text-red-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 p-6 bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-brand-500 rounded-lg cursor-pointer transition">
          <Upload className="w-6 h-6 text-zinc-500" />
          <span className="text-sm text-zinc-400">Click to choose a file</span>
          <span className="text-xs text-zinc-600">{hint}</span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}
