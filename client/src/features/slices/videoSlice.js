import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";

const initialState = {
  list: [],
  status: null,
  error: null,
};

export const fetchVideos = createAsyncThunk("videos/fetchVideos", async () => {
  try {
    const response = await axios.get(`${url}/videos/get`, setHeaders());
    console.log("fetch videos response:", response.data);

    // Handle different response formats
    if (response.data.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (Array.isArray(response.data)) {
      return response.data;
    } else {
      return [];
    }
  } catch (error) {
    console.log("Error fetching videos:", error.response?.data?.message);
    throw new Error(error.response?.data?.message || "Failed to fetch videos");
  }
});

export const updateVideo = createAsyncThunk(
  "videos/updateVideo",
  async ({ videoId, data }) => {
    // Fixed: accept object with id and data
    try {
      const response = await axios.put(
        `${url}/videos/update/${videoId}`, // Fixed: use id parameter
        data,
        setHeaders()
      );
      console.log("update video response:", response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.log("Error updating video:", error.response?.data?.message);
      throw new Error(
        error.response?.data?.message || "Failed to update video"
      );
    }
  }
);

export const deleteVideo = createAsyncThunk(
  "videos/deleteVideo",
  async (id) => {
    try {
      const response = await axios.delete(
        `${url}/videos/delete/${videoId}`, // Fixed: use id parameter
        setHeaders()
      );
      console.log("delete video response:", response.data);
      return videoId; // Return the id to use in reducer
    } catch (error) {
      console.log("Error deleting video:", error.response?.data?.message);
      throw new Error(
        error.response?.data?.message || "Failed to delete video"
      );
    }
  }
);

export const createVideo = createAsyncThunk(
  "videos/createVideo", // Fixed: changed from "users/createVideo"
  async (data) => {
    try {
      const response = await axios.post(`${url}/videos/create`, data, {
        ...setHeaders(),
        "Content-Type": "multipart/form-data", // Important for file uploads
      });
      console.log("create video response:", response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.log("Error creating video:", error.response?.data?.message);
      throw new Error(
        error.response?.data?.message || "Failed to create video"
      );
    }
  }
);

const videosSlice = createSlice({
  name: "videos",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetStatus: (state) => {
      state.status = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // In your videoSlice, make sure the status names match:
      .addCase(fetchVideos.pending, (state) => {
        state.status = "pending"; // Changed from "loading"
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.list = action.payload;
        state.status = "success";
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.status = "rejected"; // Changed from "failed"
        state.error = action.error.message;
      })
      // Create Video
      .addCase(createVideo.pending, (state) => {
        state.status = "pending";
      })
      .addCase(createVideo.fulfilled, (state, action) => {
        state.list.push(action.payload);
        state.status = "success";
        state.error = null;
      })
      .addCase(createVideo.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      })
      // Delete Video
      .addCase(deleteVideo.pending, (state) => {
        state.status = "pending";
      })
      .addCase(deleteVideo.fulfilled, (state, action) => {
        state.list = state.list.filter((video) => video.id !== action.payload); // Fixed: use id instead of _id
        state.status = "success";
        state.error = null;
      })
      .addCase(deleteVideo.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      })
      // Update Video
      .addCase(updateVideo.pending, (state) => {
        state.status = "pending";
      })
      .addCase(updateVideo.fulfilled, (state, action) => {
        const updatedVideo = action.payload;
        const index = state.list.findIndex(
          (video) => video.id === updatedVideo.id
        );
        if (index !== -1) {
          state.list[index] = updatedVideo;
        }
        state.status = "success";
        state.error = null;
      })
      .addCase(updateVideo.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      });
  },
});

export const { clearError, resetStatus } = videosSlice.actions;
export default videosSlice.reducer;
