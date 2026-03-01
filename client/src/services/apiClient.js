import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ── Auth ── */
export async function registerUser(payload) {
  const { data } = await apiClient.post('/auth/register', payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await apiClient.post('/auth/login', payload);
  return data;
}

export async function fetchProfile() {
  const { data } = await apiClient.get('/auth/me');
  return data;
}

/* ── Profiles ── */
export async function saveInfluencerProfile(payload) {
  const { data } = await apiClient.put('/profiles/influencer', payload);
  return data;
}

export async function saveBrandProfile(payload) {
  const { data } = await apiClient.put('/profiles/brand', payload);
  return data;
}

export async function getPublicProfile(userId) {
  const { data } = await apiClient.get(`/profiles/${userId}`);
  return data;
}

export async function updateMyProfile(payload) {
  const { data } = await apiClient.put('/profiles/me', payload);
  return data;
}

/* ── Discover ── */
export async function searchInfluencers(params) {
  const { data } = await apiClient.get('/discover/influencers', { params });
  return data;
}

export async function searchBrands(params) {
  const { data } = await apiClient.get('/discover/brands', { params });
  return data;
}

export async function getRecommendations() {
  const { data } = await apiClient.get('/discover/recommendations');
  return data;
}

export async function getFilterOptions() {
  const { data } = await apiClient.get('/discover/filters');
  return data;
}

export async function getTrending() {
  const { data } = await apiClient.get('/discover/trending');
  return data;
}

/* ── Collaboration requests ── */
export async function sendCollabRequest(payload) {
  const { data } = await apiClient.post('/collabs', payload);
  return data;
}

export async function getMyCollabRequests() {
  const { data } = await apiClient.get('/collabs');
  return data;
}

export async function respondToCollab(requestId, payload) {
  const { data } = await apiClient.patch(`/collabs/${requestId}`, payload);
  return data;
}

export async function sendCounterOffer(requestId, payload) {
  const { data } = await apiClient.post(`/collabs/${requestId}/counter`, payload);
  return data;
}

export async function getNegotiationHistory(requestId) {
  const { data } = await apiClient.get(`/collabs/${requestId}/negotiation`);
  return data;
}

export async function getNotifications() {
  const { data } = await apiClient.get('/collabs/notifications');
  return data;
}

export async function markNotificationRead(notifId) {
  const { data } = await apiClient.patch(`/collabs/notifications/${notifId}/read`);
  return data;
}

/* ── Campaigns & Reviews ── */
export async function addCampaign(payload) {
  const { data } = await apiClient.post('/campaigns', payload);
  return data;
}

export async function getMyCampaigns() {
  const { data } = await apiClient.get('/campaigns/mine');
  return data;
}

export async function deleteCampaign(campaignId) {
  const { data } = await apiClient.delete(`/campaigns/${campaignId}`);
  return data;
}

export async function leaveReview(payload) {
  const { data } = await apiClient.post('/campaigns/reviews', payload);
  return data;
}

export async function getReviewsFor(userId) {
  const { data } = await apiClient.get(`/campaigns/reviews/${userId}`);
  return data;
}
