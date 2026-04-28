"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Profile {
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  tokenPrice: number;
  slug: string;
}

export default function ModelProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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

    const res = await fetch(`/api/models/${profile?.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: fd.get("displayName"),
        bio: fd.get("bio"),
        avatarUrl: fd.get("avatarUrl"),
        bannerUrl: fd.get("bannerUrl"),
        tokenPrice: Number(fd.get("tokenPrice")),
      }),
    });

    setSaving(false);
    if (res.ok) {
      setMessage("Profile saved!");
      const data = await res.json();
      setProfile((p) => ({ ...p!, ...data }));
    } else {
      setMessage("Failed to save.");
    }
  }

  if (!profile) {
    return (
      <div className="text-zinc-400 text-center py-20">Loading profile…</div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-50">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Display Name" name="displayName" defaultValue={profile.displayName} />
        <Field label="Bio" name="bio" defaultValue={profile.bio} textarea />
        <Field label="Avatar URL" name="avatarUrl" defaultValue={profile.avatarUrl} placeholder="https://..." />
        <Field label="Banner URL" name="bannerUrl" defaultValue={profile.bannerUrl} placeholder="https://..." />

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">
            Token price to subscribe
          </label>
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
          <p className={`text-sm ${message.includes("saved") ? "text-green-400" : "text-red-400"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 gradient-brand text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <div className="text-sm text-zinc-500">
        Your public profile:{" "}
        <a
          href={`/${profile.slug}`}
          className="text-brand-400 hover:underline"
          target="_blank"
        >
          accesshub.com/{profile.slug}
        </a>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  textarea,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  textarea?: boolean;
}) {
  const cls =
    "w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-50 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500";
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1">{label}</label>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue} rows={3} className={cls} />
      ) : (
        <input name={name} defaultValue={defaultValue} placeholder={placeholder} className={cls} />
      )}
    </div>
  );
}
