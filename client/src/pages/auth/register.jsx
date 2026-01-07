/** @format */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { HiMail, HiUser, HiPhone, HiEye, HiEyeOff } from "react-icons/hi";
import { registerUser } from "@/features/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

const AuthRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registerStatus, registerError } = useSelector((state) => state.auth);

  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleSubmit = (values) => {
    dispatch(registerUser(values));
  };

  useEffect(() => {
    if (registerStatus === "success") navigate("/auth/login");
  }, [registerStatus, navigate]);

  const validationSchema = Yup.object({
    name: Yup.string().min(2, "Too short").required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phoneNumber: Yup.string()
      .matches(/^[0-9]+$/, "Must be digits only")
      .min(10, "At least 10 digits")
      .required("Phone number is required"),
    password: Yup.string().min(4, "At least 4 characters").required("Password is required"),
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-gray-900">Create Account</h2>
          <p className="text-gray-500 text-sm mt-1">Join us and get started today</p>
        </div>

        {/* Alert */}
        {registerStatus === "rejected" && (
          <Alert variant="danger" className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-2 rounded-md">
            {registerError}
          </Alert>
        )}

        {/* Form */}
        <Formik
          initialValues={{ name: "", email: "", phoneNumber: "", password: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-5">
              {/* Name */}
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="relative mt-1">
                  <HiUser className="absolute left-3 top-3 text-gray-400" />
                  <Field
                    as={Input}
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    className="pl-10"
                  />
                </div>
                <ErrorMessage name="name" component="p" className="text-sm text-red-600 mt-1" />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative mt-1">
                  <HiMail className="absolute left-3 top-3 text-gray-400" />
                  <Field
                    as={Input}
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                  />
                </div>
                <ErrorMessage name="email" component="p" className="text-sm text-red-600 mt-1" />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative mt-1">
                  <HiPhone className="absolute left-3 top-3 text-gray-400" />
                  <Field
                    as={Input}
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="07xxxxxxxx"
                    className="pl-10"
                  />
                </div>
                <ErrorMessage name="phoneNumber" component="p" className="text-sm text-red-600 mt-1" />
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Field
                    as={Input}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePassword}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-500"
                  >
                    {showPassword ? <HiEyeOff /> : <HiEye />}
                  </button>
                </div>
                <ErrorMessage name="password" component="p" className="text-sm text-red-600 mt-1" />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting || registerStatus === "pending"}
                className="w-full mt-3"
              >
                {registerStatus === "pending" ? "Creating..." : "Create Account"}
              </Button>
            </Form>
          )}
        </Formik>

        {/* Footer Links */}
        <div className="text-center mt-8 text-sm text-gray-600 space-y-3">
          <p>
            Already have an account?{" "}
            <Link to="/auth/login" className="text-indigo-600 hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </motion.div>
    </div>
  );
};

export default AuthRegister;
