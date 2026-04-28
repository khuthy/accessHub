"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      previewUrl: fd.get("previewUrl") as string,
      mediaUrl: fd.get("mediaUrl") as string,
      mediaType: fd.get("mediaType") as string,
      tokenCost: Number(fd.get("tokenCost")),
      isPublished: fd.get("isPublished") === "on",
    };

    const res = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create post");
      setLoading(false);
    } else {
      router.push("/model/content");
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-50">Upload Content</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title *" name="title" required />
        <Field label="Description" name="description" textarea />

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Media type
          </label>
          <select
            name="mediaType"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="GALLERY">Gallery</option>
          </select>
        </div>

        <Field
          label="Preview image URL (public)"
          name="previewUrl"
          placeholder="https://... (shown to everyone)"
        />
        <Field
          label="Full media URL (gated)"
          name="mediaUrl"
          placeholder="https://... (shown after unlock)"
        />

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Token cost (0 = free)
          </label>
          <input
            name="tokenCost"
            type="number"
            min={0}
            max={9999}
            defaultValue={0}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input name="isPublished" type="checkbox" defaultChecked className="accent-brand-500 w-4 h-4" />
          <span className="text-sm text-zinc-300">Publish immediately</span>
        </label>

        {error && (
          <p className="text-sm text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 gradient-brand text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? "Saving…" : "Create post"}
        </button>
      </form>

      <div className="p-4 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-zinc-400">
        <p className="font-medium text-zinc-300 mb-1">Tip: Hosting your media</p>
        <p>
          Upload your images/videos to a free host like{" "}
          <a href="https://cloudinary.com" className="text-brand-400 hover:underline" target="_blank">
            Cloudinary
          </a>{" "}
          or{" "}
          <a href="https://imgbb.com" className="text-brand-400 hover:underline" target="_blank">
            ImgBB
          </a>{" "}
          and paste the URL here. Direct upload coming soon.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  textarea,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  const cls =
    "w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500";
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1">{label}</label>
      {textarea ? (
        <textarea name={name} placeholder={placeholder} rows={3} className={cls} />
      ) : (
        <input name={name} placeholder={placeholder} required={required} className={cls} />
      )}
    </div>
  );
}
