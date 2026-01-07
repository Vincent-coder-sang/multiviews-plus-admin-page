/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import moment from "moment";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Search } from "lucide-react";

const UserDashboard = () => {
 
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-3 py-4">
      <div>UserDashboard page for users</div>
    </div>
  );
};

export default UserDashboard;
