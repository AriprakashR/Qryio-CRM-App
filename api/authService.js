import axiosInstance from './axiosInstance';

export const sendOtp = email =>
  axiosInstance.post('ctpl/auth/user/send-otp', { email, otp: null });

export const verifyOtp = (email, otp) =>
  axiosInstance.post('ctpl/auth/user/verify-otp', {
    email,
    otp: parseInt(otp, 10),
  });

export const getUserProfile = token =>
  axiosInstance.post('ctpl/user/profile', null, {
    headers: { Authorization: `Bearer ${token}` },
  });
