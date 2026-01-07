// features/slices/contentCreatorsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";

const initialState = {
  list: [],
  currentCreator: null,
  creatorVideos: [],
  status: null,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalCreators: 0,
    hasNext: false,
    hasPrev: false
  }
};

// Fetch all content creators
export const fetchContentCreators = createAsyncThunk(
  "contentCreators/fetchContentCreators",
  async ({ page = 1, limit = 20, search = "" } = {}) => {
    try {
      const response = await axios.get(
        `${url}/creators/get?page=${page}&limit=${limit}&search=${search}`, // ✅ Fixed: /api/creators
        setHeaders()
      );
      console.log("Fetch creators response:", response.data);
      
      // Check if response is HTML (API error)
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        throw new Error('API returned HTML instead of JSON. Check your server routes.');
      }
      
      // Ensure response has the expected structure
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      return response.data;
    } catch (error) {
      console.log("Error fetching creators:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || error.message || "Failed to fetch content creators");
    }
  }
);

// Fetch creator by ID
export const fetchCreatorById = createAsyncThunk(
  "contentCreators/fetchCreatorById",
  async (creatorId) => {
    try {
      const response = await axios.get(
        `${url}/creators/get/${creatorId}`, // ✅ Fixed: /api/creators
        setHeaders()
      );
      console.log("Fetch creator by ID response:", response.data);
      
      // Check if response is HTML
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        throw new Error('API returned HTML instead of JSON.');
      }
      
      return response.data.data || response.data;
    } catch (error) {
      console.log("Error fetching creator:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || error.message || "Failed to fetch creator");
    }
  }
);

// Fetch creator's videos
export const fetchCreatorVideos = createAsyncThunk(
  "contentCreators/fetchCreatorVideos",
  async ({ creatorId, page = 1, limit = 20, category = "" }) => {
    try {
      const response = await axios.get(
        `${url}/creators/get/${creatorId}/videos?page=${page}&limit=${limit}&category=${category}`, // ✅ Fixed: /api/creators
        setHeaders()
      );
      console.log("Fetch creator videos response:", response.data);
      
      // Check if response is HTML
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        throw new Error('API returned HTML instead of JSON.');
      }
      
      return response.data;
    } catch (error) {
      console.log("Error fetching creator videos:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || error.message || "Failed to fetch creator videos");
    }
  }
);

// Create content creator
export const createContentCreator = createAsyncThunk(
  "contentCreators/createContentCreator",
  async (creatorData) => {
    try {
      const response = await axios.post(
        `${url}/creators/create`, // ✅ Fixed: /api/creators
        creatorData,
        setHeaders()
      );
      console.log("Create creator response:", response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.log("Error creating creator:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || error.message || "Failed to create content creator");
    }
  }
);

// Update content creator
export const updateContentCreator = createAsyncThunk(
  "contentCreators/updateContentCreator",
  async ({ creatorId, data }) => {
    try {
      const response = await axios.put(
        `${url}/creators/update/${creatorId}`, // ✅ Fixed: /api/creators
        data,
        setHeaders()
      );
      console.log("Update creator response:", response.data);
      return response.data.data || response.data;
    } catch (error) {
      console.log("Error updating creator:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || error.message || "Failed to update content creator");
    }
  }
);

// Delete content creator
export const deleteContentCreator = createAsyncThunk(
  "contentCreators/deleteContentCreator",
  async (creatorId) => {
    try {
      const response = await axios.delete(
        `${url}/creators/delete/${creatorId}`, // ✅ Fixed: /api/creators
        setHeaders()
      );
      console.log("Delete creator response:", response.data);
      return creatorId;
    } catch (error) {
      console.log("Error deleting creator:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || error.message || "Failed to delete content creator");
    }
  }
);

// Search creators
export const searchContentCreators = createAsyncThunk(
  "contentCreators/searchContentCreators",
  async (query) => {
    try {
      const response = await axios.get(
        `${url}/creators/search?query=${query}`, // ✅ Fixed: /api/creators
        setHeaders()
      );
      console.log("Search creators response:", response.data);
      
      // Check if response is HTML
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        throw new Error('API returned HTML instead of JSON.');
      }
      
      return response.data.data || response.data;
    } catch (error) {
      console.log("Error searching creators:", error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || error.message || "Failed to search content creators");
    }
  }
);

const contentCreatorsSlice = createSlice({
  name: "contentCreators",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetStatus: (state) => {
      state.status = null;
    },
    clearCurrentCreator: (state) => {
      state.currentCreator = null;
    },
    clearCreatorVideos: (state) => {
      state.creatorVideos = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all creators
      .addCase(fetchContentCreators.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(fetchContentCreators.fulfilled, (state, action) => {
        state.list = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCreators: 0,
          hasNext: false,
          hasPrev: false
        };
        state.status = "success";
        state.error = null;
      })
      .addCase(fetchContentCreators.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
        state.list = [];
      })
      
      // Fetch creator by ID
      .addCase(fetchCreatorById.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(fetchCreatorById.fulfilled, (state, action) => {
        state.currentCreator = action.payload;
        state.status = "success";
        state.error = null;
      })
      .addCase(fetchCreatorById.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
        state.currentCreator = null;
      })
      
      // Fetch creator videos
      .addCase(fetchCreatorVideos.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(fetchCreatorVideos.fulfilled, (state, action) => {
        state.creatorVideos = action.payload.data || [];
        state.status = "success";
        state.error = null;
      })
      .addCase(fetchCreatorVideos.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
        state.creatorVideos = [];
      })
      
      // Create creator
      .addCase(createContentCreator.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(createContentCreator.fulfilled, (state, action) => {
        if (action.payload) {
          state.list.push(action.payload);
        }
        state.status = "success";
        state.error = null;
      })
      .addCase(createContentCreator.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      })
      
      // Update creator
      .addCase(updateContentCreator.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(updateContentCreator.fulfilled, (state, action) => {
        const updatedCreator = action.payload;
        if (updatedCreator && updatedCreator.id) {
          const index = state.list.findIndex(creator => creator.id === updatedCreator.id);
          if (index !== -1) {
            state.list[index] = updatedCreator;
          }
          if (state.currentCreator && state.currentCreator.id === updatedCreator.id) {
            state.currentCreator = updatedCreator;
          }
        }
        state.status = "success";
        state.error = null;
      })
      .addCase(updateContentCreator.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      })
      
      // Delete creator
      .addCase(deleteContentCreator.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(deleteContentCreator.fulfilled, (state, action) => {
        state.list = state.list.filter(creator => creator.id !== action.payload);
        state.status = "success";
        state.error = null;
      })
      .addCase(deleteContentCreator.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
      })
      
      // Search creators
      .addCase(searchContentCreators.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(searchContentCreators.fulfilled, (state, action) => {
        state.list = action.payload || [];
        state.status = "success";
        state.error = null;
      })
      .addCase(searchContentCreators.rejected, (state, action) => {
        state.status = "rejected";
        state.error = action.error.message;
        state.list = [];
      });
  }
});

export const { 
  clearError, 
  resetStatus, 
  clearCurrentCreator, 
  clearCreatorVideos 
} = contentCreatorsSlice.actions;

export default contentCreatorsSlice.reducer;