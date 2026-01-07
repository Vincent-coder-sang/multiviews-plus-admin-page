/* eslint-disable react/prop-types */
import { Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { loadUser, logoutUser } from "@/features/slices/authSlice";
import Loader from "./Loader";

const CheckAuth = ({ children, requireAuth = false, requireAdmin = false }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const userType = useSelector((state) => state.auth.userType);
  const isAuthenticated = useSelector((state) => Boolean(state.auth.token));
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("token");
    if (tokenFromStorage) {
      try {
        const user = jwtDecode(tokenFromStorage);
        if (user.exp * 1000 < Date.now()) {
          dispatch(logoutUser());
        } else {
          dispatch(loadUser(user));
        }
      } catch (error) {
        console.error("Token decoding failed:", error);
        dispatch(logoutUser());
      }
    }
    setCheckingToken(false);
  }, [dispatch]);

  if (checkingToken) {
    return <Loader />;
  }

  // Define public paths that don't require authentication
  const publicPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/verify-otp",
    "/auth/check-email",
    "/auth/reset-password"
  ];

  // Check if current path is public
  const isPublicPath = publicPaths.some(path => 
    location.pathname.startsWith(path)
  );

  // Check if current path is reset password
  const isResetPasswordPath = location.pathname.startsWith("/auth/reset-password");

  // 1. Handle reset password path specially (always allow)
  if (isResetPasswordPath) {
    return children;
  }

  // 2. If user is authenticated and tries to access public path, redirect to dashboard
  if (isAuthenticated && isPublicPath) {
    return userType === "admin" ? 
      <Navigate to="/admin/dashboard" replace /> : 
      <Navigate to="/user/dashboard" replace />;
  }

  // 3. If auth is required but user isn't authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // 4. If admin role is required but user isn't admin
  if (requireAuth && requireAdmin && userType !== "admin") {
    return <Navigate to="/unauth-page" replace />;
  }

  // 5. Handle root path redirect
  if (location.pathname === "/") {
    if (isAuthenticated) {
      return userType === "admin" ? 
        <Navigate to="/admin/dashboard" replace /> : 
        <Navigate to="/user/dashboard" replace />;
    }
    return <Navigate to="/auth/login" replace />;
  }

  // 6. Default case - allow access
  return children;
};

export default CheckAuth;