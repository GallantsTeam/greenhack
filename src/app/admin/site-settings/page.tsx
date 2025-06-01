
// src/app/admin/site-settings/page.tsx
import { redirect } from 'next/navigation';

export default function SiteSettingsIndexPage() {
  // Redirect to the general settings page by default
  redirect('/admin/site-settings/general');
  
  // This part will not be reached due to redirect,
  // but it's good practice to have a fallback or null return for a page component.
  return null; 
}
