"use client";

import { useEffect, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing-client";
import { Upload, X, CheckCircle } from "lucide-react";

interface Profile {
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  tokenPrice: number;
  slug: string;
}

export default function ModelProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const { startUpload: uploadAvatar, isUploading: uploadingAvatar } = useUploadThing("profileImage");
  const { startUpload: uploadBanner, isUploading: uploadingBanner } = useUploadThing("profileImage");

  useEffect(() => {
    fetch("/api/models/me")
      .then((r) => r.json())
      .then(setProfile);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const fd = new FormData(e.currentTarget);
    let avatarUrl = profile?.avatarUrl ?? "";
    let bannerUrl = profile?.bannerUrl ?? "";

    if (avatarFile) {
      const res = await uploadAvatar([avatarFile]);
      if (res?.[0]) avatarUrl = res[0].ufsUrl;
    }
    if (bannerFile) {
      const res = await uploadBanner([bannerFile]);
      if (res?.[0]) bannerUrl = res[0].ufsUrl;
    }

    const res = await fetch(`/api/models/${profile?.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: fd.get("displayName"),
        bio: fd.get("bio"),
        avatarUrl,
        bannerUrl,
        tokenPrice: Number(fd.get("tokenPrice")),
      }),
    });

    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setProfile((p) => ({ ...p!, ...data }));
      setAvatarFile(null);
      setBannerFile(null);
      setMessage("Profile saved!");
    } else {
      setMessage("Failed to save.");
    }
  }

  if (!profile) {
    return <div className="text-zinc-400 text-center py-20">Loading profile…</div>;
  }

  const isUploading = uploadingAvatar || uploadingBanner;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-50">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Display Name" name="displayName" defaultValue={profile.displayName} />
        <Field label="Bio" name="bio" defaultValue={profile.bio} textarea />

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Avatar photo</label>
          {profile.avatarUrl && !avatarFile && (
            <img src={profile.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover mb-2 border-2 border-brand-500" />
          )}
          <ImageFilePicker file={avatarFile} onSelect={setAvatarFile} onClear={() => setAvatarFile(null)} hint="JPG, PNG — max 8MB" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Banner image</label>
          {profile.bannerUrl && !bannerFile && (
            <img src={profile.bannerUrl} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
          )}
          <ImageFilePicker file={bannerFile} onSelect={setBannerFile} onClear={() => setBannerFile(null)} hint="Wide image recommended — max 8MB" />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Token price to subscribe</label>
          <input
            name="tokenPrice"
            type="number"
            min={0}
            max={9999}
            defaultValue={profile.tokenPrice}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {message && (
          <p className={`text-sm ${message.includes("saved") ? "text-green-400" : "text-red-400"}`}>{message}</p>
        )}

        <button
          type="submit"
          disabled={saving || isUploading}
          className="w-full py-2.5 gradient-brand text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {isUploading ? "Uploading…" : saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <p className="text-sm text-zinc-500">
        Public profile:{" "}
        <a href={`/fan/${profile.slug}`} className="text-brand-400 hover:underline">/fan/{profile.slug}</a>
      </p>
    </div>
  );
}

function ImageFilePicker({ file, onSelect, onClear, hint }: { file: File | null; onSelect: (f: File) => void; onClear: () => void; hint: string }) {
  return file ? (
    <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-brand-700 rounded-lg">
      <CheckCircle className="w-5 h-5 text-brand-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 truncate">{file.name}</p>
        <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
      </div>
      <button type="button" onClick={onClear} className="text-zinc-500 hover:text-red-400"><X className="w-4 h-4" /></button>
    </div>
  ) : (
    <label className="flex items-center gap-3 p-3 bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-brand-500 rounded-lg cursor-pointer transition">
      <Upload className="w-5 h-5 text-zinc-500" />
      <span className="text-sm text-zinc-400">{hint}</span>
      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])} />
    </label>
  );
}

function Field({ label, name, defaultValue, textarea }: { label: string; name: string; defaultValue?: string; textarea?: boolean }) {
  const cls = "w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500";
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1">{label}</label>
      {textarea ? <textarea name={name} defaultValue={defaultValue} rows={3} className={cls} /> : <input name={name} defaultValue={defaultValue} className={cls} />}
    </div>
  );
}
