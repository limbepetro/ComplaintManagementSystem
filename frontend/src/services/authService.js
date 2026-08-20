import api from "../api";

export const login = async (username, password) => {
  const tokenResponse = await api.post("token/", {
    username,
    password,
  });

  localStorage.setItem(
    "access_token",
    tokenResponse.data.access
  );

  localStorage.setItem(
    "refresh_token",
    tokenResponse.data.refresh
  );

  const userResponse = await api.get("me/");

  const user = userResponse.data;

  if (!user.is_active) {
    logout();
    throw new Error("This account is inactive.");
  }

  localStorage.setItem(
    "user",
    JSON.stringify(user)
  );

  return user;
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

export const getStoredUser = () => {
  const storedUser = localStorage.getItem("user");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export const isAuthenticated = () => {
  return Boolean(
    localStorage.getItem("access_token")
  );
};