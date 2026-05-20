'use client';

import { updateLandingSettings } from "./actions";

export default function SettingsForm({ heroTitle, heroSubtitle }: { heroTitle: string, heroSubtitle: string }) {
  return (
    <form action={updateLandingSettings} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Hero Title</label>
        <input 
          type="text" 
          name="heroTitle" 
          defaultValue={heroTitle}
          className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Hero Subtitle</label>
        <textarea 
          name="heroSubtitle" 
          defaultValue={heroSubtitle}
          rows={3}
          className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground"
        />
      </div>
      <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 font-medium">
        Save Settings
      </button>
    </form>
  );
}
