import requests from "./httpServices";

// Grossimarché product reviews. Listing is public (approved only); submitting requires an
// authenticated user and is moderated before it shows.
const ReviewServices = {
  getByProduct: async (productId, { page = 0, size = 10 } = {}) =>
    requests.get(`/products/${productId}/reviews?page=${page}&size=${size}`),

  submit: async (productId, body) =>
    requests.post(`/products/${productId}/reviews`, body),
};

export default ReviewServices;
