/**
 * JobBoard Mərkəzi API Köməkçisi (API Client)
 * Bu script bütün fetch sorğularını mərkəzləşdirir, Authorization header-ini avtomatik əlavə edir
 * və Access Token-in vaxtı bitdikdə avtomatik olaraq Refresh Token vasitəsilə yeniləyir.
 */

var API_BASE_URL = 'https://localhost:7135/api'; // və ya 'https://localhost:5001/api' (dokumentasiyaya əsasən)

/**
 * Mərkəzi Fetch funksiyası
 * @param {string} endpoint - Nümunə: '/jobs' və ya '/candidates/me'
 * @param {Object} options - Standart fetch options
 */
function apiFetch(endpoint, options) {
    options = options || {};
    options.headers = options.headers || {};

    // 1. Base URL-i yoxla və endpoint-ə əlavə et
    var url = endpoint;
    if (endpoint.startsWith('/')) {
        url = API_BASE_URL + endpoint;
    }

    // 2. Token-i oxu və Authorization header-ə əlavə et
    var accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        options.headers['Authorization'] = 'Bearer ' + accessToken;
    }

    // 3. Content-Type-ı avtomatik təyin et (Əgər FormData deyilsə)
    if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }

    // Sorğunu icra et
    return fetch(url, options).then(function (response) {
        // 4. Əgər status 401 (Unauthorized) olarsa, token-i yeniləməyə çalış
        if (response.status === 401) {
            var refreshTokenVal = localStorage.getItem('refreshToken');
            if (refreshTokenVal) {
                // Refresh token sorğusu göndəririk
                return fetch(API_BASE_URL + '/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken: refreshTokenVal })
                })
                .then(function (refreshRes) {
                    if (refreshRes.status === 200) {
                        return refreshRes.json().then(function (refreshData) {
                            if (refreshData.success && refreshData.data) {
                                // Yeni tokenləri yadda saxla
                                localStorage.setItem('accessToken', refreshData.data.accessToken);
                                localStorage.setItem('refreshToken', refreshData.data.refreshToken);
                                
                                // Orijinal sorğunun Authorization header-ini yenilə və yenidən göndər
                                options.headers['Authorization'] = 'Bearer ' + refreshData.data.accessToken;
                                return fetch(url, options).then(function (retryRes) {
                                    return handleResponse(retryRes);
                                });
                            } else {
                                handleSessionExpiration();
                                throw new Error('Session expired.');
                            }
                        });
                    } else {
                        handleSessionExpiration();
                        throw new Error('Session expired.');
                    }
                })
                .catch(function (err) {
                    handleSessionExpiration();
                    throw err;
                });
            } else {
                handleSessionExpiration();
                return Promise.reject(new Error('Unauthorized. No refresh token found.'));
            }
        }

        return handleResponse(response);
    });
}

/**
 * Cavabı yoxlayan köməkçi funksiya
 */
function handleResponse(response) {
    if (response.status === 204) {
        return Promise.resolve({ success: true });
    }
    
    return response.json().then(function (data) {
        if (!response.ok) {
            return Promise.reject({
                status: response.status,
                data: data
            });
        }
        return data;
    });
}

/**
 * Sessiyanın vaxtı bitdikdə istifadəçini login-ə yönləndirən funksiya
 */
function handleSessionExpiration() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    
    // Əgər artıq login səhifəsində deyiliksə, yönləndirək
    if (window.location.pathname.indexOf('login-3.html') === -1) {
        window.location.href = 'login-3.html?expired=true';
    }
}
