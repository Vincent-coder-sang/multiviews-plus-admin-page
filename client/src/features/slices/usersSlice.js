/** @format */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";
import { toast } from "react-toastify";

const initialState = {
  list: [],
  status: null,
  error: null,
  user: null,
  profileData: [],
};

export const updateProfile = createAsyncThunk(
  "users/updateProfile",
  async ({ formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${url}/users/updateprofile`, formData, setHeaders());
      return response.data; // This returns { success, message, user }
    } catch (error) {
      console.log("error.response.data.message", error.response.data.message);
      return rejectWithValue(error.response.data.message)
    }
  }
);

export const getUserProfile = createAsyncThunk(
  "users/getUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const headers = await setHeaders()
      const response = await axios.get(`${url}/users/getprofile`, headers);

      return response.data;
    } catch (error) {
      console.log(error.response.data.message)



      return rejectWithValue(error.response.data.message)
    }
  }
);


export const fetchUsers = createAsyncThunk("users/fetchUsers", async (_, { rejectWithValue }) => {
  try {
    const headers = await setHeaders()
    const response = await axios.get(`${url}/users/get`, headers);

    return response.data;
  } catch (error) {
    console.log(" Error fetching a user", error.response.data.message);
    toast.error(error.response.data.message, {
      position: "top-center",
    });
    return rejectWithValue(error.response.data.message)
  }
});

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${url}/users/delete/${userId}`, setHeaders());
      toast.success(response.data.message, {
        position: "top-center",
      });
      return response.data;
    } catch (error) {
      console.log("Error deleting a user", error.response.data.message);
      toast.error(error.response.data.message, {
        position: "top-center",
      });
      return rejectWithValue(error.response.data.message)
    }
  }
);

export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData) => {
    try {
      const response = await axios.post(`${url}/users/create`, userData);
      return response.data;
    } catch (error) {
      console.log("Error creating a user", error.response.data.message);
      toast.error(error.response.data.message, {
        position: "top-center",
      });
    }
  }
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ userId, formData }, { rejectWithValue }) => {
    try {
      const headers = await setHeaders()
      const response = await axios.put(
        `${url}/users/update/${userId}`,
        formData,
        headers
      );
      toast.success(response.data.message, {
        position: "top-center",
      });
      return response.data;
    } catch (error) {
      toast.error(error.response.data.message, {
        position: "top-center",
      });
      return rejectWithValue(error.response.data.message)
    }
  }
);
export const fetchSingleUser = createAsyncThunk(
  "users/fetchSingleUser",
  async (userId, { rejectWithValue }) => {
    try {
      const headers = await setHeaders()
      const response = await axios.get(`${url}/users/get/${userId}`, headers);
  
      console.log("fetchSingleUser",response.data)
      return response.data;
    } catch (error) {
      toast.error(error.response.data.message, {
        position: "top-center",
      });
      return rejectWithValue(error.response.data.message)
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSingleUser.pending, (state) => {
        state.status = "pending";
      })
      .addCase(fetchSingleUser.fulfilled, (state, action) => {
        state.status = "success";
        state.user = action.payload.data;
        console.log("fetchSingleUser(action.payload.data)",action.payload.data)
      })
      .addCase(fetchSingleUser.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload.message;
      })
      .addCase(getUserProfile.pending, (state) => {
        state.status = "pending";
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.status = "success";

        state.profileData = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload.message;
      })
      .addCase(updateProfile.pending, (state) => {
        state.status = "pending";
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = "success";
        // Update the profileData with the new user data from backend
        if (state.profileData && state.profileData.user && action.payload.user) {
          state.profileData.user = {
            ...state.profileData.user,
            ...action.payload.user // Use the user object from the response
          };
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload.message;
      })
      .addCase(fetchUsers.pending, (state) => {
        state.status = "pending";
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.list = action.payload.data;
        state.status = "success";
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload.message;
      })
      .addCase(createUser.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = "success";
      })
      .addCase(createUser.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload.message;
      })
      .addCase(deleteUser.pending, (state) => {
        state.status = "pending";
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        const newList = state.list.filter((user) => user.id !== action.payload);
        state.list = newList;
        state.status = "success";
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload.message;
      })
      .addCase(updateUser.pending, (state) => {
        state.status = "pending";
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const updatedUser = action.payload;
        const index = state.list.findIndex(
          (user) => user.id === updatedUser.id
        );
        if (index !== -1) {
          state.list[index] = updatedUser;
        }
        state.status = "success";
      })

      .addCase(updateUser.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.payload.message;
      });
  },
});

export default usersSlice.reducer;
