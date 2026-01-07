/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { url } from "@/features/slices/api";
import { motion } from "framer-motion";

const VerifyAccount = () => {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resendDisabled, setResendDisabled] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);
    const navigate = useNavigate();
    const inputRefs = useRef([]);

    // Handle input changes (typing or pasting)
    const handleChange = (index, value) => {
        const newCode = [...code];

        // Handle multi-character pasted content
        if (value.length > 1) {
            const pastedCode = value.slice(0, 6).split("");
            for (let i = 0; i < 6; i++) {
                newCode[i] = pastedCode[i] || "";
            }
            setCode(newCode);

            // Focus on the last non-empty input or the first empty one
            const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
            const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
            inputRefs.current[focusIndex]?.focus();
        } else {
            // Only allow numeric input
            if (value && !/^[0-9]$/.test(value)) return;
            
            newCode[index] = value;
            setCode(newCode);

            // Move focus to the next input field if value is entered
            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    // Handle key events, specifically for backspace
    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle form submission
    const handleVerification = async (e) => {
        e.preventDefault();
        setLoading(true);
        const verificationCode = code.join("");

        try {
            const response = await axios.post(`${url}/auth/verify-account`, { verificationCode });
            toast.success(response.data.message, {
                position: "top-center",
            });

            // Redirect to login page on success
            navigate("/auth/login");
        } catch (error) {
            console.error("Verification failed", error);
            toast.error(error.response?.data?.message || "Verification failed", {
                position: "top-center",
            });
            
            // Clear the code and focus first input on error
            setCode(["", "", "", "", "", ""]);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    // Handle resend code
    const handleResendCode = async () => {
        setResendDisabled(true);
        try {
            await axios.post(`${url}/auth/resend-verification`);
            toast.success("Verification code resent successfully", {
                position: "top-center",
            });
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to resend verification code", {
                position: "top-center",
            });
        }
        
        // Start countdown timer
        let timer = 30;
        const interval = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setResendDisabled(false);
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Auto submit when all fields are filled
    useEffect(() => {
        if (code.every((digit) => digit !== "")) {
            handleVerification({ preventDefault: () => {} });
        }
    }, [code]);

    // Auto-focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex items-center justify-center p-4"
        >
            <div className="max-w-md w-full bg-gray-800 bg-opacity-90 backdrop-filter backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-gray-700">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-900 bg-opacity-20 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
                            Verify Your Email
                        </h2>
                        <p className="text-gray-300">We've sent a 6-digit code to your email</p>
                    </div>

                    <form onSubmit={handleVerification} className="space-y-6">
                        <div className="flex justify-between mb-2">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-12 h-14 text-center text-2xl font-bold bg-gray-700 text-white border-2 border-gray-600 rounded-lg focus:border-emerald-400 focus:ring-2 focus:ring-emerald-300 focus:ring-opacity-50 focus:outline-none transition-all duration-200"
                                    aria-label={`Digit ${index + 1} of verification code`}
                                    disabled={loading}
                                />
                            ))}
                        </div>

                        <div className="text-center text-sm text-gray-400">
                            Didn't receive a code?{" "}
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={resendDisabled}
                                className={`font-medium ${resendDisabled ? 'text-gray-500' : 'text-emerald-400 hover:text-emerald-300'} focus:outline-none`}
                            >
                                {resendDisabled ? `Resend in ${resendTimer}s` : "Resend code"}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || code.some((digit) => !digit)}
                            className="w-full flex items-center justify-center py-3 px-4 rounded-lg shadow-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 disabled:opacity-50 transition-all duration-200"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </>
                            ) : (
                                "Verify Email"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        <button 
                            onClick={() => navigate("/auth/login")}
                            className="text-emerald-400 hover:text-emerald-300 font-medium focus:outline-none"
                        >
                            Back to login
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default VerifyAccount;