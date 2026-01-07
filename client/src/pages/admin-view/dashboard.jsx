/* eslint-disable react/no-unescaped-entities */
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchUsers } from "@/features/slices/usersSlice";
import { fetchVideos } from "@/features/slices/videoSlice";
import { Users, Video, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const dispatch = useDispatch();

  const { list: usersList, status: userStatus, error: userError } = useSelector(
    (state) => state.users
  );
  const { list: videosList, status: videoStatus, error: videoError } = useSelector(
    (state) => state.videos
  );

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchVideos());
  }, [dispatch]);

  // Null checks
  const users = usersList || [];
  const videos = videosList || [];
  const loading = userStatus === "loading" || videoStatus === "loading";

  // Example chart data
  const data = [
    { name: "Mon", users: users.length || 0, videos: videos.length || 0 },
    { name: "Tue", users: 30, videos: 12 },
    { name: "Wed", users: 25, videos: 8 },
    { name: "Thu", users: 40, videos: 15 },
    { name: "Fri", users: 50, videos: 20 },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-500">Manage users, videos, and view analytics.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </>
        ) : (
          <>
            <Card className="border shadow-sm">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" /> Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{users?.length || 0}</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Video className="w-5 h-5 text-purple-500" /> Total Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{videos?.length || 0}</p>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" /> Active Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">Online</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Chart Section */}
      <Card className="border shadow-sm mt-8">
        <CardHeader>
          <CardTitle>User & Video Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#3b82f6" name="Users" />
                <Bar dataKey="videos" fill="#8b5cf6" name="Videos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
