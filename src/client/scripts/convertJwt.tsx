
export const convertJwt = () => {
  const token = localStorage?.jwt;
  if (!token) { return false; }
  try {
    const { user, exp } = JSON.parse(window.atob(token.split('.')[1]));
    return { user, exp };
  } catch (error) {
    console.error("Unable to parse JWT Data");
    return false;
  }
}
