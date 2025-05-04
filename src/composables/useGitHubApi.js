import { ref } from "vue";

/**
 * Composable for interacting with the GitHub API
 * Documentation: https://docs.github.com/en/rest
 */
export function useGitHubApi() {
    const isLoading = ref(false);
    const error = ref(null);

    // Base URL for GitHub API
    const baseUrl = "https://api.github.com";

    /**
     * Fetch a user's repositories from GitHub
     * @param {string} username - GitHub username
     * @param {string} token - GitHub access token (optional)
     * @param {number} page - Page number for pagination (default: 1)
     * @param {number} perPage - Number of repositories per page (default: 10)
     * @returns {Promise} - Promise resolving to array of repositories
     */
    const getUserRepositories = async (
        username,
        token = null,
        page = 1,
        perPage = 10
    ) => {
        isLoading.value = true;
        error.value = null;

        try {
            const headers = {
                Accept: "application/vnd.github.v3+json",
            };

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(
                `${baseUrl}/users/${username}/repos?page=${page}&per_page=${perPage}&sort=updated`,
                { headers }
            );

            if (!response.ok) {
                throw new Error(
                    `Error fetching GitHub repositories: ${response.status}`
                );
            }

            const repos = await response.json();
            return repos;
        } catch (err) {
            error.value = err.message;
            return [];
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Fetch details about a specific repository
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} token - GitHub access token (optional)
     * @returns {Promise} - Promise resolving to repository details
     */
    const getRepositoryDetails = async (owner, repo, token = null) => {
        isLoading.value = true;
        error.value = null;

        try {
            const headers = {
                Accept: "application/vnd.github.v3+json",
            };

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(`${baseUrl}/repos/${owner}/${repo}`, {
                headers,
            });

            if (!response.ok) {
                throw new Error(
                    `Error fetching repository details: ${response.status}`
                );
            }

            const repoDetails = await response.json();
            return repoDetails;
        } catch (err) {
            error.value = err.message;
            return null;
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Fetch repositories the user has starred
     * @param {string} username - GitHub username
     * @param {string} token - GitHub access token (optional)
     * @param {number} page - Page number for pagination (default: 1)
     * @param {number} perPage - Number of repositories per page (default: 10)
     * @returns {Promise} - Promise resolving to array of starred repositories
     */
    const getStarredRepositories = async (
        username,
        token = null,
        page = 1,
        perPage = 10
    ) => {
        isLoading.value = true;
        error.value = null;

        try {
            const headers = {
                Accept: "application/vnd.github.v3+json",
            };

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(
                `${baseUrl}/users/${username}/starred?page=${page}&per_page=${perPage}`,
                { headers }
            );

            if (!response.ok) {
                throw new Error(
                    `Error fetching starred repositories: ${response.status}`
                );
            }

            const starredRepos = await response.json();
            return starredRepos;
        } catch (err) {
            error.value = err.message;
            return [];
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Search for repositories on GitHub
     * @param {string} query - Search query
     * @param {string} token - GitHub access token (optional)
     * @param {number} page - Page number for pagination (default: 1)
     * @param {number} perPage - Number of results per page (default: 10)
     * @returns {Promise} - Promise resolving to search results
     */
    const searchRepositories = async (
        query,
        token = null,
        page = 1,
        perPage = 10
    ) => {
        isLoading.value = true;
        error.value = null;

        try {
            const headers = {
                Accept: "application/vnd.github.v3+json",
            };

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const response = await fetch(
                `${baseUrl}/search/repositories?q=${encodeURIComponent(
                    query
                )}&page=${page}&per_page=${perPage}`,
                { headers }
            );

            if (!response.ok) {
                throw new Error(
                    `Error searching GitHub repositories: ${response.status}`
                );
            }

            const searchResults = await response.json();
            return searchResults.items || [];
        } catch (err) {
            error.value = err.message;
            return [];
        } finally {
            isLoading.value = false;
        }
    };

    return {
        isLoading,
        error,
        getUserRepositories,
        getRepositoryDetails,
        getStarredRepositories,
        searchRepositories,
    };
}
