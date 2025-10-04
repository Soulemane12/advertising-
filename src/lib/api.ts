// API functions for video analysis

export async function loadAnalysis(videoId: string) {
  const response = await fetch(`/api/videos/${videoId}/analysis`);

  if (!response.ok) {
    throw new Error(`Analysis fetch failed: ${response.statusText}`);
  }

  return await response.json();
}

export async function getVideoStatus(videoId: string) {
  const response = await fetch(`/api/videos/${videoId}/status`);

  if (!response.ok) {
    throw new Error(`Status fetch failed: ${response.statusText}`);
  }

  return await response.json();
}