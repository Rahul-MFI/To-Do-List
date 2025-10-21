import React, { useMemo, useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import axios from "axios";
import { Navigate, useNavigate } from "react-router-dom";
import PrimaryButton from "../components/PrimaryButton";
import Spinner from "../components/Spinner";

const AuthPage = ({ isLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [nameError, setNameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  const VITE_LOCALHOST = import.meta.env.VITE_LOCALHOST

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const resetData = () => {
    setLoginForm({
      email: "",
      password: "",
    });
    setSignupForm({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setSubmitError("");
  };

  const resetError = () => {
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setNameError("");
    setIsLoading(false);
  };

  const validateEmail = (value) => {
    if (!value) return "";
    if (value.length > 200)
      return "Email must contain less than 200 characters.";
    if (!value.includes("@")) return "Email must contain @ character.";
    return "";
  };

  const valdateName = (value) => {
    if (!value) return "";
    if (value.length < 4) return "Name must contain atleast 4 characters.";
    if (value.length > 200)
      return "Name must contain less than 200 characters.";
    return "";
  };

  const validatePassword = (value) => {
    const upper = /[A-Z]/.test(value);
    const lower = /[a-z]/.test(value);
    const special = /[^A-Za-z0-9]/.test(value);
    if (!value) {
      return "";
    } else if (value.length < 8) {
      return "Password must contain atleast 8 characters.";
    } else if (value.length > 200) {
      return "Password must contain less than 200 characters.";
    } else if (!upper || !lower || !special) {
      if (!upper) return "Password must contain at least one uppercase letter.";
      if (!lower) return "Password must contain at least one lowercase letter.";
      if (!special)
        return "Password must contain at least one special character.";
    }
    return "";
  };

  const validateLoginForm = () => {
    const { email, password } = loginForm;
    const emailMessge = validateEmail(email);
    const passwordMessage = validatePassword(password);
    if (email.length == 0 || emailMessge.length > 0) {
      setEmailError(email.length == 0 ? "Email is empty." : emailMessge);
      return false;
    } else {
      setEmailError("");
    }
    if (password.length == 0 || passwordMessage.length > 0) {
      setPasswordError(
        password.length == 0 ? "Password is empty." : passwordMessage
      );
      return false;
    } else {
      setPasswordError("");
    }
    return true;
  };

  const isValidLogin = () => {
    const { email, password } = loginForm;
    const emailMessge = validateEmail(email);
    const passwordMessage = validatePassword(password);
    if (email.length == 0 || emailMessge.length > 0) {
      return false;
    }
    if (password.length == 0 || passwordMessage.length > 0) {
      return false;
    }
    return true;
  };

  const isLoginValid = useMemo(
    () => isValidLogin(),
    [loginForm.email, loginForm.password]
  );

  const validateSignInForm = () => {
    const { username, email, password, confirmPassword } = signupForm;
    const usernameMessage = valdateName(username);
    const emailMessge = validateEmail(email);
    const passwordMessage = validatePassword(password);
    const confirmMessage = validatePassword(confirmPassword);
    if (username.length == 0 || usernameMessage.length > 0) {
      setNameError(username.length == 0 ? "Name is empty." : usernameMessage);
      return false;
    } else {
      setNameError("");
    }
    if (email.length == 0 || emailMessge.length > 0) {
      setEmailError(email.length == 0 ? "Email is empty." : emailMessge);
      return false;
    } else {
      setEmailError("");
    }
    if (password.length == 0 || passwordMessage.length > 0) {
      setPasswordError(
        password.length == 0 ? "Password is empty." : passwordMessage
      );
      return false;
    } else {
      setPasswordError("");
    }
    if (confirmPassword.length == 0 || confirmMessage.length > 0) {
      setConfirmPasswordError(
        confirmPassword.length == 0 ? "Password is empty." : confirmMessage
      );
      return false;
    } else {
      setConfirmPasswordError("");
    }
    return true;
  };

  const isValidSignUp = () => {
    const { username, email, password, confirmPassword } = signupForm;
    const usernameMessage = valdateName(username);
    const emailMessge = validateEmail(email);
    const passwordMessage = validatePassword(password);
    const confirmMessage = validatePassword(confirmPassword);
    if (username.length == 0 || usernameMessage.length > 0) {
      return false;
    }
    if (email.length == 0 || emailMessge.length > 0) {
      return false;
    }
    if (password.length == 0 || passwordMessage.length > 0) {
      return false;
    }
    if (confirmPassword.length == 0 || confirmMessage.length > 0) {
      return false;
    }
    return true;
  };

  const isSignInValid = useMemo(
    () => isValidSignUp(),
    [
      signupForm.username,
      signupForm.email,
      signupForm.password,
      signupForm.confirmPassword,
    ]
  );

  const handleLoginChange = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value,
    });
    if (e.target.name == "email") {
      const errorMessage = validateEmail(e.target.value);
      setEmailError(errorMessage);
    } else if (e.target.name == "password") {
      const errorMessage = validatePassword(e.target.value);
      setPasswordError(errorMessage);
    }
  };

  const handleSignupChange = (e) => {
    setSignupForm({
      ...signupForm,
      [e.target.name]: e.target.value,
    });
    if (e.target.name == "email") {
      const errorMessage = validateEmail(e.target.value);
      setEmailError(errorMessage);
    } else if (e.target.name == "password") {
      const errorMessage = validatePassword(e.target.value);
      setPasswordError(errorMessage);
    } else if (e.target.name == "confirmPassword") {
      const errorMessage = validatePassword(e.target.value);
      setConfirmPasswordError(errorMessage);
    } else if (e.target.name == "username") {
      const errorMessage = valdateName(e.target.value);
      setNameError(errorMessage);
    }
  };

  const addLocalStorage = (token) => {
    localStorage.setItem("token", token);
  };

  const handleLoginSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!validateLoginForm()) {
        return;
      }
      setIsLoading(true);
      const { email, password } = loginForm;
      console.log(email, password);
      const response = await axios.post(`${VITE_LOCALHOST}auth/login`, {
        email,
        password,
      });
      if (response.status === 200) {
        console.log("✅ User Login successfully:", response.data);
        const token = response.data.token;
        addLocalStorage(token);
        resetData();
        setSubmitError("");
        navigate("/", { replace: true });
      }
    } catch (err) {
      if (err.response) {
        const { data } = err.response;
        setSubmitError(data.error || "Something went wrong!");
      } else {
        setSubmitError(
          "Request Failed! Check your internet connection."
        );
      }
      console.log("error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!validateSignInForm()) {
        return;
      }
      if (signupForm.password !== signupForm.confirmPassword) {
        setConfirmPasswordError("Password do not match");
        return;
      }
      setIsLoading(true);

      const { username, email, password } = signupForm;
      const response = await axios.post(`${VITE_LOCALHOST}auth/signup`, {
        username,
        email,
        password,
      });

      if (response.status === 200) {
        console.log("✅ User created successfully:");
        const token = response.data.token;
        addLocalStorage(token);
        resetData();
        navigate("/", { replace: true });
      }
    } catch (err) {
      if (err.response) {
        const { data } = err.response;
        setSubmitError(data.error || "Something went wrong!");
      } else {
        setSubmitError(
          "Request failed! Check your internet connection."
        );
      }
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4 sm:p-4 font-sans">
      <div className="w-full max-w-md sm:w-1/2 sm:h-auto sm:max-w-2xl container mx-auto">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 sm:py-8  text-center">
            <h1 className={`text-xl sm:text-3xl font-bold mb-1 text-white`}>
              {"TaskSphere"}
            </h1>
            <h1 className={"text-white"}>
              {isLogin
                ? "Please sign in to your account"
                : "Please create an account"}
            </h1>
          </div>

          {/* Form Container */}
          <div className="px-4 sm:px-8 py-2 sm:py-8 flex flex-col justify-between gap-2 sm:gap-4">
            {/* Login Form */}
            {isLogin ? (
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Email Field */}
                <div>
                  <label className="text-sm font-medium sm:text-md text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      placeholder="Enter your email"
                      className="w-full p-2 sm:px-4 sm:py-2 text-md sm:text-lg  border border-gray-300 rounded-sm sm:rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      required
                    />
                  </div>
                  {emailError.length > 0 && (
                    <p className="text-sm text-red-600 mt-2">{emailError}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-sm sm:text-md font-medium text-gray-700 mb-3">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      placeholder="Enter your password"
                      className="w-full pl-2 pr-8 py-2 sm:px-4 sm:py-2 text-md sm:text-lg border border-gray-300 rounded-sm sm:rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordError.length > 0 && (
                    <p className="text-sm text-red-600 mt-2">{passwordError}</p>
                  )}
                </div>

                {/* Submit Button */}
                <PrimaryButton
                  onClickFunction={handleLoginSubmit}
                  style={`bg-yellow-400 hover:bg-yellow-500 text-white text-md sm:text-lg font-semibold mt-2  md:mt-0 ${
                    isLoginValid ? `` : `cursor-not-allowed`
                  }`}
                >
                  {isLoading == false ? "Sign In" : <Spinner />}
                </PrimaryButton>
                {submitError.length > 0 && (
                  <p className="text-sm text-red-600 mt-2">{submitError}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:gap-4">
                {/* Full Name Field */}
                <div>
                  <label className="text-sm font-medium sm:text-md text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={signupForm.username}
                      onChange={handleSignupChange}
                      placeholder="Enter your full name"
                      className="w-full p-2 sm:px-4 sm:py-2 text-md sm:text-lg border border-gray-300 rounded-sm sm:rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      required
                    />
                  </div>
                  {nameError.length > 0 && (
                    <p className="text-sm text-red-600 mt-2">{nameError}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="text-sm font-medium sm:text-md text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={signupForm.email}
                      onChange={handleSignupChange}
                      placeholder="Enter your email"
                      className="w-full p-2 sm:px-4 sm:py-2 text-md sm:text-lg  border border-gray-300 rounded-sm sm:rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      required
                    />
                  </div>
                  {emailError.length > 0 && (
                    <p className="text-sm text-red-600 mt-2">{emailError}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="text-sm font-medium sm:text-md text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={signupForm.password}
                      onChange={handleSignupChange}
                      placeholder="Create a password"
                      className="w-full pl-2 pr-8 py-2 sm:px-4 sm:py-2 text-md sm:text-lg  border border-gray-300 rounded-sm sm:rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {passwordError.length > 0 && (
                    <p className="text-sm text-red-600 mt-2">{passwordError}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="text-sm font-medium sm:text-md text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={signupForm.confirmPassword}
                      onChange={handleSignupChange}
                      placeholder="Confirm your password"
                      className="w-full pl-2 pr-8 py-2 sm:px-4 sm:py-2 text-md sm:text-lg  border border-gray-300 rounded-sm sm:rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {confirmPasswordError.length > 0 && (
                    <p className="text-sm text-red-600 mt-2">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <PrimaryButton
                  style={`bg-yellow-400 hover:bg-yellow-500 text-white text-md sm:text-lg font-semibold mt-2 md:mt-0 ${
                    isSignInValid ? `` : `cursor-not-allowed`
                  }`}
                  onClickFunction={handleSignupSubmit}
                >
                  {isLoading == false ? "Sign Up" : <Spinner />}
                </PrimaryButton>
                {submitError.length > 0 && (
                  <p className="text-sm text-red-600 mt-2">{submitError}</p>
                )}
              </div>
            )}
            {/* Footer */}
            <div className="text-center">
              <p className="text-sm sm:text-md text-gray-600">
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  onClick={() => {
                    resetError();
                    resetData();
                    isLogin
                      ? navigate("/register", { replace: true })
                      : navigate("/login", { replace: true });
                  }}
                  className="text-yellow-500 text-sm sm:text-md hover:text-yellow-600 font-medium"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;