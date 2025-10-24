"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Upload, X } from "lucide-react";

type Prof = {
  display_name: string;
  bio: string;
  avatar_url: string;
  city_name: string;
  city_image_url: string;
  profession: string;
  email_contact: string;
  number_contact: string;
  github_url: string;
};

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [cityFile, setCityFile] = useState<File | null>(null);
  const [cityPreview, setCityPreview] = useState("");
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState<Prof>({
    display_name: "",
    bio: "",
    avatar_url: "",
    city_name: "",
    city_image_url: "",
    profession: "",
    email_contact: "",
    number_contact: "",
    github_url: "",
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name,bio,avatar_url,city_name,city_image_url,profession,email_contact,number_contact,github_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setForm({
          display_name: data.display_name || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
          city_name: data.city_name || "",
          city_image_url: data.city_image_url || "",
          profession: data.profession || "",
          email_contact: data.email_contact || "",
          number_contact: data.number_contact || "",
          github_url: data.github_url || "",
        });
        setAvatarPreview(data.avatar_url || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const uploadCityImage = async (f: File): Promise<string | null> => {
    try {
      const ext = f.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const path = `city/${fileName}`;
      const { error } = await supabase.storage.from("images").upload(path, f);
      if (error) return null;
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(String(ev.target?.result || ""));
      reader.readAsDataURL(f);
    }
  };

  const handleCityFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setCityFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = (ev) => setCityPreview(String(ev.target?.result || ""));
      reader.readAsDataURL(f);
    }
  };

  const removeAvatar = () => {
    setFile(null);
    setAvatarPreview("");
    setForm((p) => ({ ...p, avatar_url: "" }));
  };

  const removeCityImage = () => {
    setCityFile(null);
    setCityPreview("");
    setForm((p) => ({ ...p, city_image_url: "" }));
  };

  const uploadAvatar = async (f: File): Promise<string | null> => {
    try {
      const ext = f.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const path = `profiles/${fileName}`;
      const { error } = await supabase.storage.from("images").upload(path, f);
      if (error) return null;
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let avatarUrl = form.avatar_url;
      let cityImgUrl = form.city_image_url;
      if (file) {
        const url = await uploadAvatar(file);
        if (url) avatarUrl = url;
      }
      if (cityFile) {
        const url = await uploadCityImage(cityFile);
        if (url) cityImgUrl = url;
      }

      const payload = {
        id: user.id,
        display_name: form.display_name,
        bio: form.bio,
        avatar_url: avatarUrl,
        city_name: form.city_name,
        city_image_url: cityImgUrl,
        profession: form.profession,
        email_contact: form.email_contact,
        number_contact: form.number_contact,
        github_url: form.github_url,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
      if (error) throw error;

      setForm((p) => ({ ...p, avatar_url: avatarUrl, city_image_url: cityImgUrl }));
      setFile(null);
      setCityFile(null);
      fetchProfile();
      setToast({ type: 'success', message: 'Profile saved successfully' });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setToast({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 min-w-[260px] max-w-sm p-4 rounded-xl border shadow-lg backdrop-blur bg-black/80 ${toast.type === 'success' ? 'border-green-500/30' : 'border-red-500/30'}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <div className="text-white text-sm leading-relaxed flex-1">{toast.message}</div>
            <button onClick={() => setToast(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
        </div>
      )}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-6">Edit Profile</h1>
        <form onSubmit={onSave} className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-64">
              <label className="block text-sm font-medium text-white mb-3">Avatar</label>
              {avatarPreview ? (
                <div className="relative inline-block">
                  <img src={avatarPreview} alt="Avatar" className="w-40 h-40 object-cover rounded-xl border border-white/20" />
                  <button type="button" onClick={removeAvatar} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 rounded-xl bg-white/10 border border-white/20"></div>
              )}
              <div className="mt-4 space-y-3">
                <label className="flex items-center gap-3 bg-white/10 border border-white/20 px-4 py-3 rounded-xl hover:bg-white/20 transition-all cursor-pointer group">
                  <Upload className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  <span className="text-white font-medium">{file ? "Change Avatar" : "Upload Avatar"}</span>
                  <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
                </label>
                <input
                  type="url"
                  placeholder="Avatar image URL"
                  value={form.avatar_url}
                  onChange={(e) => setForm((p) => ({ ...p, avatar_url: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Display Name</label>
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Profession</label>
                <input
                  type="text"
                  value={form.profession}
                  onChange={(e) => setForm((p) => ({ ...p, profession: e.target.value }))}
                  placeholder="Your profession (e.g. Front-End Developer)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email Contact</label>
                  <input
                    type="email"
                    value={form.email_contact}
                    onChange={(e) => setForm((p) => ({ ...p, email_contact: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Phone / Number</label>
                  <input
                    type="text"
                    value={form.number_contact}
                    onChange={(e) => setForm((p) => ({ ...p, number_contact: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-white mb-2">GitHub URL</label>
                  <input
                    type="url"
                    value={form.github_url}
                    onChange={(e) => setForm((p) => ({ ...p, github_url: e.target.value }))}
                    placeholder="https://github.com/username"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">City Name</label>
                <input
                  type="text"
                  value={form.city_name}
                  onChange={(e) => setForm((p) => ({ ...p, city_name: e.target.value }))}
                  placeholder="City"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">City Image (banner)</label>
                {(cityPreview || form.city_image_url) ? (
                  <div className="relative mb-3">
                    <img
                      src={cityPreview || form.city_image_url}
                      alt="City banner"
                      className="w-full h-32 md:h-40 object-cover rounded-xl border border-white/20"
                    />
                    <button type="button" onClick={removeCityImage} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}

                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex items-center gap-3 bg-white/10 border border-white/20 px-4 py-3 rounded-xl hover:bg-white/20 transition-all cursor-pointer group">
                    <Upload className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                    <span className="text-white font-medium">{cityFile ? "Change City Image" : "Upload City Image"}</span>
                    <input type="file" accept="image/*" onChange={handleCityFile} className="hidden" />
                  </label>
                  <input
                    type="url"
                    value={form.city_image_url}
                    onChange={(e) => setForm((p) => ({ ...p, city_image_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Bio</label>
                <textarea
                  rows={5}
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell about yourself..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-white text-black py-3 px-6 rounded-xl hover:bg-gray-100 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {saving && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>}
              Save Profile
            </button>
            <button
              type="button"
              onClick={fetchProfile}
              disabled={saving}
              className="bg-white/10 text-white border border-white/20 py-3 px-6 rounded-xl hover:bg-white/20 transition-all font-semibold disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
