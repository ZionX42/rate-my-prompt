import { redirect } from 'next/navigation';
import { isCurrentUserAdmin } from '@/lib/auth';

export default async function AdminDashboard() {
  // TODO: Enable server-side check once auth is implemented
  // const isAdmin = await isCurrentUserAdmin();
  // if (!isAdmin) {
  //   redirect('/');
  // }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          <p className="text-gray-600 mb-4">Manage users, roles, and permissions</p>
          <a
            href="/admin/users"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
          >
            Manage Users
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Content Moderation</h2>
          <p className="text-gray-600 mb-4">Review and moderate user-generated content</p>
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" disabled>
            Coming Soon
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          <p className="text-gray-600 mb-4">Configure system-wide settings</p>
          <button
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            disabled
          >
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
