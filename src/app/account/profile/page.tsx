
// This page can be an alias to /account/settings or a distinct profile view page
// For now, let's redirect or simply render the settings content if they are the same.
// Or, it can be a simpler overview page if settings are too detailed.

import SettingsPage from '../settings/page';

export default function ProfilePage() {
  // For simplicity, rendering the SettingsPage content here.
  // In a real app, you might have a different layout or specific profile overview.
  return <SettingsPage />;
}

// If you prefer a redirect:
// import { redirect } from 'next/navigation';
// export default function ProfilePage() {
//   redirect('/account/settings');
// }
