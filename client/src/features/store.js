/** @format */

import { configureStore } from "@reduxjs/toolkit";
import usersReducer from "./slices/usersSlice";
import videosReducer from "./slices/videoSlice";
import authReducer from "./slices/authSlice";
import contentCreatorsReducer from './slices/contentCreatorsSlice';
import paymentsReducer from "./slices/paymentSlice";

 const store = configureStore({
	reducer: {
		users: usersReducer,
		videos: videosReducer,
		auth: authReducer,
		contentCreators: contentCreatorsReducer,
		payments: paymentsReducer,
	},
});
 export default store