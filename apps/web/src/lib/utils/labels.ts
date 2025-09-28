// src/lib/labels.ts
export function getLabelStyle(hex: string): string {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const luminance = (c: number) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    const L = 0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b);

    // Background alpha: faint for light, stronger for dark
    const bgAlpha = Math.min(0.15 + (0.5 - L) * 0.5, 0.7);
    const bg = `rgba(${r}, ${g}, ${b}, ${bgAlpha})`;

    // Dynamic border darkening
    const darken = (c: number, amount: number) => Math.max(0, c - amount);

    let darkenAmount: number;
    if (L > 0.9) darkenAmount = 150;
    else if (L > 0.75) darkenAmount = 90;
    else if (L > 0.5) darkenAmount = 50;
    else darkenAmount = 30;

    const borderR = darken(r, darkenAmount);
    const borderG = darken(g, darkenAmount);
    const borderB = darken(b, darkenAmount);

    const border = `rgba(${borderR}, ${borderG}, ${borderB}, 0.9)`;

    // Text color: pick best contrast
    const contrastWhite = (1.05) / (L + 0.05);
    const contrastBlack = (L + 0.05) / 0.05;
    const text = contrastWhite > contrastBlack ? '#fff' : 'rgba(0,0,0,0.85)';

    return `background-color: ${bg}; border-color: ${border}; color: ${text};`;
}