const getLocale = () => (typeof navigator !== "undefined" ? navigator.language : "en-PH");

export const APP_VERSION: string =
  typeof __APP_VERSION__ !== "undefined" && __APP_VERSION__
    ? __APP_VERSION__
    : "dev";

export const BUILD_DATE: string | undefined =
  typeof __BUILD_DATE__ !== "undefined" && __BUILD_DATE__
    ? __BUILD_DATE__
    : undefined;

export const getFormattedBuildDate = (locale: string = getLocale()): string => {
  if (!BUILD_DATE) return "Unknown";

  const date = new Date(BUILD_DATE);
  if (Number.isNaN(date.getTime())) return BUILD_DATE;

  try {
    return date.toLocaleString(locale, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return date.toISOString();
  }
};
