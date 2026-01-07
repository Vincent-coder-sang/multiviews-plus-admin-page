export const url = "/api";

export const setHeaders = () => {


  const headers = {
    headers: {
      "x-auth-token": localStorage.getItem("token"),
    },
  };

  // console.log("headers from frontend... ",headers.headers["x-auth-token"]);
  return headers;
};

