export const normalizeImageUrl = (input) => {
    if (!input || typeof input !== 'string') return '';
    const value = input.trim();

    // If already new large URL -> return as is
    if (/^https?:\/\/alistar\.ltd\/image\//.test(value)) {
        return value;
    }

    // Old absolute URL from server domain -> map to new
    let out = value
        .replace(/^https?:\/\/server\.alistar\.ltd\/upload\/small\//, 'https://alistar.ltd/image/')
        .replace(/^https?:\/\/server\.alistar\.ltd\/upload\//, 'https://alistar.ltd/image/')
        .replace(/^https?:\/\/alistar\.ltd\/upload\/small\//, 'https://alistar.ltd/image/')
        .replace(/^https?:\/\/alistar\.ltd\/upload\//, 'https://alistar.ltd/image/')
        .replace(/\/image\/small\//g, '/image/')
        .replace(/\/upload\/small\//g, '/upload/');

    // If result is absolute and already points to alistar.ltd/image -> done
    if (/^https?:\/\/alistar\.ltd\//.test(out)) {
        // Ensure large variant for base normalizer
        out = out.replace('/image/small/', '/image/');
        return out;
    }

    // Handle relative paths (with or without leading slash)
    const rel = out.startsWith('/') ? out : `/${out}`;

    let mapped = rel
        .replace(/\/uploads\/small\//g, '/image/')
        .replace(/\/uploads\//g, '/image/')
        .replace(/\/upload\/small\//g, '/image/')
        .replace(/\/upload\//g, '/image/')
        .replace(/\/image\/small\//g, '/image/');

    if (!mapped.startsWith('/image/')) {
        // Fallback: if a bare filename came in
        mapped = `/image/${mapped.replace(/^\/+/, '')}`;
    }

    return `https://alistar.ltd${mapped}`;
};

export const normalizeSmallImageUrl = (input) => {
    const large = normalizeImageUrl(input);
    if (!large) return '';
    if (large.includes('/image/small/')) return large;
    return large.replace('/image/', '/image/small/');
};
