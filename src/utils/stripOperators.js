function stripOperators(obj) {
    if (Array.isArray(obj)) return obj.map(stripOperators);
    if (obj && typeof obj === 'object') {
        return Object.keys(obj).reduce((clean, key) => {
            if (key.startsWith('$') || key.includes('.')) return clean; // drop it
            clean[key] = stripOperators(obj[key]);
            return clean;
        }, {});
    }
    return obj;
}

module.exports = stripOperators;