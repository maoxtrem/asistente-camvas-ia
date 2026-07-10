export const fetchGallery = async (endpoint, payload = {}) => {
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const responsePayload = await response.json().catch(() => null);
    return { response, payload: responsePayload };
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
