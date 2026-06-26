
$(document).ready(function () {

    /**
     * Dokumentasiyaya uyğun API Base URL
     * POST /api/auth/login
     * POST /api/auth/forgot-password
     */
    var API_BASE_URL = 'https://localhost:7135/api';

    // ─── Yardımçı funksiyalar ─────────────────────────────

    /** Global alert göstər */
    function showAlert(message, type, formId) {
        type = type || 'info';
        formId = formId || 'login';
        var alertId = formId === 'forgot-password' ? '#fpAlert' : '#loginAlert';
        var alertEl = $(alertId);
        alertEl
            .removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert-' + type)
            .html(message)
            .slideDown(200);
        if (type !== 'success') {
            setTimeout(function () { alertEl.slideUp(200); }, 6000);
        }
    }

    function hideAlert(formId) {
        formId = formId || 'login';
        var alertId = formId === 'forgot-password' ? '#fpAlert' : '#loginAlert';
        $(alertId).slideUp(200);
    }

    /** Loading vəziyyəti - Login */
    function setLoginLoading(state) {
        $('#loginBtn').prop('disabled', state);
        state ? $('#loginSpinner').show() : $('#loginSpinner').hide();
    }

    /** Loading vəziyyəti - Forgot Password */
    function setFpLoading(state) {
        $('#fpSubmitBtn').prop('disabled', state);
        state ? $('#fpSpinner').show() : $('#fpSpinner').hide();
    }

    /**
     * Field xətasını input altında göstər / sil
     */
    function setFieldError(fieldName, msg) {
        var errEl = $('#err-' + fieldName);
        var inputEl = $('[data-login-field="' + fieldName + '"]');
        if (msg) {
            errEl.text(msg).show();
            inputEl.addClass('input-error');
        } else {
            errEl.text('').hide();
            inputEl.removeClass('input-error');
        }
    }

    /** Bütün login field xətalarını sil */
    function clearLoginFieldErrors() {
        ['loginEmail', 'loginPassword'].forEach(function (f) {
            setFieldError(f, null);
        });
    }

    // Input-a focus olduqda həmin field xətasını sil
    $('[data-login-field]').on('focus', function () {
        setFieldError($(this).attr('data-login-field'), null);
    });

    // ─── LOGIN Form Submit ────────────────────────────────
    /**
     * Dokumentasiya:
     * POST /api/auth/login
     * Body: { email, password, rememberMe }
     *
     * 200 → {
     *   success: true,
     *   data: {
     *     accessToken: "...",
     *     refreshToken: "...",
     *     expiresIn: 900,
     *     user: { id, fullName, email, role, avatarUrl }
     *   }
     * }
     * 401 → Email/şifrə yanlış və ya email doğrulanmamış
     */
    $('#loginForm').on('submit', function (e) {
        e.preventDefault();
        hideAlert('login');
        clearLoginFieldErrors();

        var email = $('#loginEmail').val().trim();
        var password = $('#loginPassword').val();
        var rememberMe = $('#loginRememberMe').is(':checked');

        // ── Client-side validasiya ──
        var hasError = false;
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            setFieldError('loginEmail', 'Email address is required.');
            hasError = true;
        } else if (!emailRegex.test(email)) {
            setFieldError('loginEmail', 'Please enter a valid email address.');
            hasError = true;
        }

        if (!password) {
            setFieldError('loginPassword', 'Password is required.');
            hasError = true;
        }

        if (hasError) return;

        // ── API çağırışı ──
        setLoginLoading(true);

        fetch(API_BASE_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                rememberMe: rememberMe
            })
        })
            .then(function (response) {
                return response.json().then(function (data) {
                    return { status: response.status, data: data };
                });
            })
            .then(function (result) {
                setLoginLoading(false);
                var status = result.status;
                var data = result.data;

                // ── 200 OK: Uğurlu giriş ──
                if (status === 200 && data.success) {
                    var tokenData = data.data;

                    // Dokumentasiyaya görə localStorage-ə saxla
                    localStorage.setItem('accessToken', tokenData.accessToken);
                    localStorage.setItem('refreshToken', tokenData.refreshToken);
                    localStorage.setItem('user', JSON.stringify(tokenData.user));

                    // RememberMe → sessionStorage vs localStorage
                    if (rememberMe) {
                        localStorage.setItem('rememberMe', 'true');
                    }

                    // Rola görə yönləndir
                    var role = tokenData.user && tokenData.user.role;
                    if (role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else if (role === 'employer') {
                        window.location.href = 'employer-dashboard.html';
                    } else {
                        // candidate və ya bilinməyən
                        window.location.href = 'index.html';
                    }
                    return;
                }

                // ── 401 Unauthorized ──
                if (status === 401) {
                    var errMsg = (data && data.error && data.error.message) || '';

                    // Email doğrulanmamış xəta
                    if (errMsg.toLowerCase().indexOf('verif') !== -1 ||
                        errMsg.toLowerCase().indexOf('doğrul') !== -1) {
                        showAlert(
                            '<strong>Email not verified.</strong> Please check your inbox and click the verification link before logging in.',
                            'warning',
                            'login'
                        );
                    } else {
                        // Email/şifrə yanlış
                        setFieldError('loginEmail', ' ');
                        setFieldError('loginPassword', 'Incorrect email or password.');
                        showAlert(
                            errMsg || 'Invalid email or password. Please try again.',
                            'danger',
                            'login'
                        );
                    }
                    return;
                }

                // ── Gözlənilməz cavab ──
                showAlert(
                    'Unexpected server response (HTTP ' + status + '). Please try again.',
                    'danger',
                    'login'
                );
            })
            .catch(function (err) {
                setLoginLoading(false);
                console.error('Login fetch error:', err);
                showAlert(
                    'Could not connect to the server. Please check your internet connection and try again.',
                    'danger',
                    'login'
                );
            });
    });

    // ─── FORGOT PASSWORD Form Submit ──────────────────────
    /**
     * Dokumentasiya:
     * POST /api/auth/forgot-password
     * Body: { email }
     *
     * 200 → {
     *   success: true,
     *   message: "Əgər bu email mövcuddursa, sıfırlama linki göndərildi."
     * }
     */
    $('#forgotPasswordForm').on('submit', function (e) {
        e.preventDefault();
        hideAlert('forgot-password');

        var email = $('#fpEmail').val().trim();
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            showAlert('Please enter your email address.', 'danger', 'forgot-password');
            return;
        }
        if (!emailRegex.test(email)) {
            showAlert('Please enter a valid email address.', 'danger', 'forgot-password');
            return;
        }

        setFpLoading(true);

        fetch(API_BASE_URL + '/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        })
            .then(function (response) {
                return response.json().then(function (data) {
                    return { status: response.status, data: data };
                });
            })
            .then(function (result) {
                setFpLoading(false);
                var data = result.data;

                // 200 OK (həm uğurlu, həm mövcud olmayan email üçün eyni cavab)
                if (result.status === 200 && data.success) {
                    showAlert(
                        data.message || 'If this email exists, a password reset link has been sent.',
                        'success',
                        'forgot-password'
                    );
                    $('#forgotPasswordForm')[0].reset();
                    return;
                }

                showAlert(
                    (data && data.error && data.error.message) ||
                    'Something went wrong. Please try again.',
                    'danger',
                    'forgot-password'
                );
            })
            .catch(function (err) {
                setFpLoading(false);
                console.error('Forgot password fetch error:', err);
                showAlert(
                    'Could not connect to the server. Please try again.',
                    'danger',
                    'forgot-password'
                );
            });
    });

    // ─── URL parametrlərini yoxla ─────────────────────────
    /**
     * Dokumentasiya:
     * Email verify sonrası backend /login?verified=true adresinə redirect edir
     */
    (function checkUrlParams() {
        var params = new URLSearchParams(window.location.search);
        if (params.get('verified') === 'true') {
            showAlert(
                '<strong>Email verified!</strong> Your email has been successfully verified. You can now log in.',
                'success',
                'login'
            );
        }
        if (params.get('reset') === 'true') {
            showAlert(
                '<strong>Password reset successfully!</strong> Your password has been successfully reset. You can now log in with your new password.',
                'success',
                'login'
            );
        }
        if (params.get('logout') === 'true') {
            showAlert('You have been successfully logged out.', 'info', 'login');
        }
    })();

});
