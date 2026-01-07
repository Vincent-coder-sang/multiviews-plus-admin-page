/** @format */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";
import { toast } from "react-toastify";

const initialState = {
  list: [],
  status: null,
  error: null,

};

export const getUserPayments = createAsyncThunk(
  "payments/getUserPayments",
  async () => {
    try {
      const response = await axios.get(`${url}/payment/history`, setHeaders());
      return response.data;
    } catch (error) {
      if (error.response) {
        console.log("Error fetching user payments:", error.response.data);
        toast.error(error.response.data.message, {
          position: "top-center",
        });
      } else {
        console.log("Network error.");
        toast.error("Network error", {
          position: "top-center",
        });
      }
    }
  }
);


export const initiatePayment = createAsyncThunk(
  "payments/initiatePayment",
  async ({ phone, amount, id }) => {
    try {
      const response = await axios.post(
        `${url}/payment/stkpush`,
        { phone, amount, id },
        setHeaders()
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        console.log("Error initiating payment:", error.response.data);
        toast.error(error.response.data.message, {
          position: "top-center",
        });
      } else {
        console.log("Network error.");
        toast.error("Network error", {
          position: "top-center",
        });
      }
    }
  }
);

const paymentSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getUserPayments.pending, (state) => {
        state.status = "pending";
      })
      .addCase(getUserPayments.fulfilled, (state, action) => {
        state.status = "succeess";
        state.list = action.payload.data;
      })
      .addCase(getUserPayments.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      })
      .addCase(initiatePayment.pending, (state) => {
        state.status = "pending";
      })
      .addCase(initiatePayment.fulfilled, (state, action) => {
        state.status = "succeess";
        toast.success(action.payload.message, {
          position: "top-center",
        });
      })
      .addCase(initiatePayment.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      });
  },
});


export default paymentSlice.reducer;