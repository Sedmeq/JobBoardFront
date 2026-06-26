
$(document).ready(function () {

    /**
     * Dokumentasiyaya uyğun API Base URL
     * POST /api/auth/reset-password
     */
    var API_BASE_URL = 'https://localhost:7135/api';

    // URL-dən token-i oxu
    var params = new URLSearchParams(window.location.search);
    var token = params.get('token');

    // Token yoxdursa, formu gizlət və xəbərdarlıq panelini göstər
    if (!token) {
        $('#resetFormWrapper').hide();
        $('#tokenWarningPanel').fadeIn(300);
    }

    // ─── Yardımçı funksiyalar ─────────────────────────────

    /** Global alert göstər */
    function showAlert(message, type) {
        type = type || 'info';
        var alertEl = $('#resetAlert');
        alertEl
            .removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert-' + type)
            .html(message)
            .slideDown(200);
        // success xaricindəkilər 6 saniyə sonra gizlənir
        if (type !== 'success') {
            setTimeout(function () { alertEl.slideUp(200); }, 6000);
        }
    }

    function hideAlert() { $('#resetAlert').slideUp(200); }

    /** Loading vəziyyəti */
    function setLoading(state) {
        $('#resetBtn').prop('disabled', state);
        state ? $('#resetSpinner').show() : $('#resetSpinner').hide();
    }

    /**
     * Field xətasını input altında göstər / sil
     * fieldName: "newPassword" | "confirmPassword"
     */
    function setFieldError(fieldName, msg) {
        var errEl = $('#err-' + fieldName);
        var inputEl = $('[name="' + fieldName + '"]');
        if (msg) {
            errEl.text(msg).show();
            inputEl.addClass('input-error');
        } else {
            errEl.text('').hide();
            inputEl.removeClass('input-error');
        }
    }

    /** Bütün field xətalarını sil */
    function clearFieldErrors() {
        ['newPassword', 'confirmPassword'].forEach(function (f) {
            setFieldError(f, null);
        });
    }

    /**
     * Dokumentasiya Error format:
     * { error: { code, message, details: [ { field: "NewPassword", message: "..." } ] } }
     */
    function applyFieldErrors(details) {
        if (!details || !details.length) return;
        details.forEach(function (d) {
            if (!d.field) return;
            // API PascalCase (NewPassword) → camelCase (newPassword)
            var key = d.field.charAt(0).toLowerCase() + d.field.slice(1);
            if ($('#err-' + key).length) {
                setFieldError(key, d.message);
            }
        });
    }

    // ─── Şifrə gücü indikatoru ───────────────────────────
    $('#resetPassword').on('input', function () {
        var pw = $(this).val();
        var bar = $('#strengthBar');
        if (!pw.length) {
            bar.removeClass('strength-weak strength-medium strength-strong').css('width', '0');
            return;
        }
        var score = 0;
        if (pw.length >= 8) score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[a-z]/.test(pw)) score++;
        if (/[d]/.test(pw) || /\d/.test(pw)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;

        bar.removeClass('strength-weak strength-medium strength-strong');
        if (score <= 2) bar.addClass('strength-weak');
        else if (score <= 4) bar.addClass('strength-medium');
        else bar.addClass('strength-strong');
    });

    // ─── Şifrə uyğunluq indikatoru ──────────────────────
    $('#resetConfirmPassword').on('input', function () {
        var pw = $('#resetPassword').val();
        var confirm = $(this).val();
        var msgEl = $('#passwordMatchMsg');
        if (!confirm.length) {
            msgEl.text('').removeClass('text-success text-danger');
            return;
        }
        if (pw === confirm) {
            msgEl.text('✓ Passwords match').removeClass('text-danger').addClass('text-success');
        } else {
            msgEl.text('✗ Passwords do not match').removeClass('text-success').addClass('text-danger');
        }
    });

    // Input-a focus olduqda həmin field xətasını sil
    $('#resetPasswordForm [name]').on('focus', function () {
        setFieldError($(this).attr('name'), null);
    });

    // ─── Reset Password Form Submit ──────────────────────
    /**
     * Dokumentasiya:
     * POST /api/auth/reset-password
     * Body: { token, newPassword, confirmPassword }
     */
    $('#resetPasswordForm').on('submit', function (e) {
        e.preventDefault();
        hideAlert();
        clearFieldErrors();

        var newPassword = $('#resetPassword').val();
        var confirmPassword = $('#resetConfirmPassword').val();

        // ── Client-side validasiya ──
        var hasError = false;

        // Dokumentasiya: min 8 char, uppercase, lowercase, digit, special
        var passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!newPassword) {
            setFieldError('newPassword', 'New password is required.');
            hasError = true;
        } else if (!passwordRegex.test(newPassword)) {
            setFieldError('newPassword', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
            hasError = true;
        }

        if (!confirmPassword) {
            setFieldError('confirmPassword', 'Please confirm your password.');
            hasError = true;
        } else if (newPassword !== confirmPassword) {
            setFieldError('confirmPassword', 'Passwords do not match.');
            hasError = true;
        }

        if (hasError) return;

        // Token yoxlamasını təkrarla
        if (!token) {
            showAlert('Reset token is missing. Please request a new link.', 'danger');
            return;
        }

        // ── API çağırışı ──
        setLoading(true);

        fetch(API_BASE_URL + '/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: token,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            })
        })
            .then(function (response) {
                return response.json().then(function (data) {
                    return { status: response.status, data: data };
                });
            })
            .then(function (result) {
                setLoading(false);
                var status = result.status;
                var data = result.data;

                // ── 200 OK: Uğurlu sıfırlama ──
                if (status === 200 && data.success) {
                    // Giriş səhifəsinə yönləndir və uğurlu mesajı parametr olaraq göndər
                    window.location.href = 'login-3.html?reset=true';
                    return;
                }

                // ── 400 Bad Request / Validation errors ──
                if (status === 400 || (data && !data.success)) {
                    if (data.error && data.error.details && data.error.details.length) {
                        applyFieldErrors(data.error.details);
                        showAlert(data.error.message || 'Please correct the highlighted errors.', 'danger');
                    } else {
                        showAlert(
                            (data.error && data.error.message) || 'Password reset failed. The token may be expired or invalid.',
                            'danger'
                        );
                    }
                    return;
                }

                showAlert('Unexpected response from server (HTTP ' + status + '). Please try again.', 'danger');
            })
            .catch(function (err) {
                setLoading(false);
                console.error('Reset password fetch error:', err);
                showAlert(
                    'Could not connect to the server. Please check your internet connection and try again.',
                    'danger'
                );
            });
    });

});
