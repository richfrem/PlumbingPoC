// packages/frontend/src/components/examples/RealtimeDemo.tsx

import React from 'react';
import {
  useUserRequests,
  useAllRequests,
  useAdminDashboard,
  useStatistics
} from '../../hooks';
import { useAuth } from '../../features/auth/AuthContext';

/**
 * Demo component showing how to use the new real-time system
 * This component will automatically update when database changes occur
 */
export const RealtimeDemo: React.FC = () => {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  if (!user) {
    return <div>Please log in to see real-time demo</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Real-Time System Demo</h1>

      {isAdmin ? <AdminDemo /> : <UserDemo userId={user.id} />}

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">🔄 Real-Time Features:</h3>
        <ul className="text-sm space-y-1">
          <li>• Data updates automatically when database changes</li>
          <li>• No manual refresh needed</li>
          <li>• Works across multiple browser tabs/windows</li>
          <li>• Optimized for performance with intelligent caching</li>
        </ul>
      </div>
    </div>
  );
};

const UserDemo: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: requests, loading, error } = useUserRequests(userId);

  if (loading) return <div>Loading your requests...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Requests (Real-Time)</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded">
          <h3 className="font-medium mb-2">📊 Quick Stats</h3>
          <div className="space-y-1 text-sm">
            <div>Total Requests: <span className="font-semibold">{requests.length}</span></div>
            <div>New: <span className="font-semibold text-blue-600">
              {requests.filter(r => r.status === 'new').length}
            </span></div>
            <div>Quoted: <span className="font-semibold text-green-600">
              {requests.filter(r => r.status === 'quoted').length}
            </span></div>
            <div>Completed: <span className="font-semibold text-gray-600">
              {requests.filter(r => r.status === 'completed').length}
            </span></div>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-medium mb-2">📝 Recent Requests</h3>
          <div className="space-y-2">
            {requests.slice(0, 3).map(request => (
              <div key={request.id} className="text-sm p-2 bg-gray-50 rounded">
                <div className="font-medium">{request.problem_category?.substring(0, 40)}...</div>
                <div className="text-gray-500">
                  Status: <span className="capitalize">{request.status}</span>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-gray-500 text-sm">No requests yet</div>
            )}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600 mt-4">
        💡 <strong>Try this:</strong> Open another browser window as admin, add a quote to one of your requests,
        and watch this page update automatically!
      </div>
    </div>
  );
};

const AdminDemo: React.FC = () => {
  const { requests, users, quotes, loading } = useAdminDashboard();
  const { stats } = useStatistics();

  if (loading) return <div>Loading admin dashboard...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Admin Dashboard (Real-Time)</h2>

      {/* Real-time Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="p-4 border rounded bg-blue-50">
          <div className="text-2xl font-bold text-blue-600">{stats.totalRequests}</div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
        <div className="p-4 border rounded bg-yellow-50">
          <div className="text-2xl font-bold text-yellow-600">{stats.newRequests}</div>
          <div className="text-sm text-gray-600">New Requests</div>
        </div>
        <div className="p-4 border rounded bg-green-50">
          <div className="text-2xl font-bold text-green-600">{stats.quotedRequests}</div>
          <div className="text-sm text-gray-600">Quoted</div>
        </div>
        <div className="p-4 border rounded bg-red-50">
          <div className="text-2xl font-bold text-red-600">{stats.emergencyRequests}</div>
          <div className="text-sm text-gray-600">Emergency</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="p-4 border rounded">
          <h3 className="font-medium mb-3">📋 Recent Requests</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {requests.slice(0, 5).map(request => (
              <div key={request.id} className="text-sm p-2 bg-gray-50 rounded">
                <div className="font-medium">{request.problem_category?.substring(0, 50)}...</div>
                <div className="text-gray-500 flex justify-between">
                  <span>Status: <span className="capitalize">{request.status}</span></span>
                  <span>Priority: {request.priority_score || 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-medium mb-3">👥 User Overview</h3>
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Total Users:</span> {users.length}
            </div>
            <div className="text-sm">
              <span className="font-medium">Total Quotes:</span> {quotes.length}
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600 mt-4">
        💡 <strong>Try this:</strong> Open another browser window as a user, create a new request,
        and watch the statistics above update in real-time!
      </div>
    </div>
  );
};
