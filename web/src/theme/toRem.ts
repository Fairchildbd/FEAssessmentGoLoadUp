/**
 * Converts a design-token pixel value to rem (assuming the browser's default 16px root size), so
 * text and spacing scale with the user's font-size setting.
 */
export const toRem = (px: number): string => `${px / 16}rem`;
