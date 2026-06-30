export const fetchGallery = async (endpoint) => {
    const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
    });

    const payload = await response.json().catch(() => null);
    return { response, payload };
};

export const sendQuestionRequest = async (endpoint, payload) => {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const responsePayload = await response.json().catch(() => null);
    return { response, payload: responsePayload };
};
