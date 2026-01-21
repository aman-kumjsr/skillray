export const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("skillray_token")}`,
});
