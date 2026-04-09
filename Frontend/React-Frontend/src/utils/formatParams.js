export const formatParams = (paramsObj) => {
  return Object.entries(paramsObj)
    .map(([key, value]) => `${key}=${value}`)
    .join("|");
};