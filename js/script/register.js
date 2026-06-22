
$(document).ready(function () {

    /**
     * Dokumentasiyaya uyğun API Base URL 
     * POST /api/auth/register
     */
    var API_BASE_URL = 'https://localhost:7135/api';

    // ─── Yardımçı funksiyalar ─────────────────────────────

    /** Global alert göstər */
    function showAlert(message, type) {
        type = type || 'info';
        var alertEl = $('#regAlert');
        alertEl
            .removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert-' + type)
            .html(message)
            .slideDown(200);
        // success xəricindəkilər 6 saniyə sonra gizlənir
        if (type !== 'success') {
            setTimeout(function () { alertEl.slideUp(200); }, 6000);
        }
    }

    function hideAlert() { $('#regAlert').slideUp(200); }

    /** Loading vəziyyəti */
    function setLoading(state) {
        $('#registerBtn').prop('disabled', state);
        state ? $('#registerSpinner').show() : $('#registerSpinner').hide();
    }

    /**
     * Field xətasını input altında göstər / sil
     * fieldName: "fullName" | "email" | "password" | "confirmPassword" | "role"
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
        ['fullName', 'email', 'password', 'confirmPassword', 'role'].forEach(function (f) {
            setFieldError(f, null);
        });
    }

    /**
     * Dokumentasiya Error format:
     * { error: { code, message, details: [ { field: "Email", message: "..." } ] } }
     * → hər field üçün inputun altında xəta göstər
     */
    function applyFieldErrors(details) {
        if (!details || !details.length) return;
        details.forEach(function (d) {
            if (!d.field) return;
            // API PascalCase (FullName) → camelCase (fullName)
            var key = d.field.charAt(0).toLowerCase() + d.field.slice(1);
            if ($('#err-' + key).length) {
                setFieldError(key, d.message);
            }
        });
    }

    // ─── Şifrə gücü indikatoru ───────────────────────────
    $('#regPassword').on('input', function () {
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
        if (/\d/.test(pw)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;

        bar.removeClass('strength-weak strength-medium strength-strong');
        if (score <= 2) bar.addClass('strength-weak');
        else if (score <= 4) bar.addClass('strength-medium');
        else bar.addClass('strength-strong');
    });

    // ─── Şifrə uyğunluq indikatoru ──────────────────────
    $('#regConfirmPassword').on('input', function () {
        var pw = $('#regPassword').val();
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
    $('#registerForm [name]').on('focus', function () {
        setFieldError($(this).attr('name'), null);
    });

    // ─── Register Form Submit ────────────────────────────
    /**
     * Dokumentasiya:
     * POST /api/auth/register
     * Body: { fullName, email, password, confirmPassword, role }
     *
     * 201 → { success: true, message: "Doğrulama emaili göndərildi..." }
     * 409 → Email artıq istifadə olunur
     * 400 → { success: false, error: { code, message, details } }
     */
    $('#registerForm').on('submit', function (e) {
        e.preventDefault();
        hideAlert();
        clearFieldErrors();

        var fullName = $('#regFullName').val().trim();
        var email = $('#regEmail').val().trim();
        var password = $('#regPassword').val();
        var confirmPassword = $('#regConfirmPassword').val();
        var role = $('#regRole').val();

        // ── Client-side validasiya ──
        var hasError = false;

        if (!fullName) {
            setFieldError('fullName', 'Full name is required.');
            hasError = true;
        } else if (fullName.length < 2) {
            setFieldError('fullName', 'Full name must be at least 2 characters.');
            hasError = true;
        }

        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            setFieldError('email', 'Email address is required.');
            hasError = true;
        } else if (!emailRegex.test(email)) {
            setFieldError('email', 'Please enter a valid email address.');
            hasError = true;
        }

        // Dokumentasiya: min 8 char, uppercase, lowercase, digit, special
        var passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!password) {
            setFieldError('password', 'Password is required.');
            hasError = true;
        } else if (!passwordRegex.test(password)) {
            setFieldError('password', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.');
            hasError = true;
        }

        if (!confirmPassword) {
            setFieldError('confirmPassword', 'Please confirm your password.');
            hasError = true;
        } else if (password !== confirmPassword) {
            setFieldError('confirmPassword', 'Passwords do not match.');
            hasError = true;
        }

        if (!role) {
            setFieldError('role', 'Please select your role (candidate or employer).');
            hasError = true;
        }

        if (hasError) return;

        // ── API çağırışı ──
        setLoading(true);

        fetch(API_BASE_URL + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: fullName,
                email: email,
                password: password,
                confirmPassword: confirmPassword,
                role: role
            })
        })
            .then(function (response) {
                // HTTP status + body birlikdə qaytarılır
                return response.json().then(function (data) {
                    return { status: response.status, data: data };
                });
            })
            .then(function (result) {
                setLoading(false);
                var status = result.status;
                var data = result.data;

                // ── 201 Created: Uğurlu qeydiyyat ──
                if (status === 201 && data.success) {
                    // Formu gizlət, email doğrulama panelini göstər
                    $('#registerFormWrapper').hide();
                    $('#regAlert').hide();
                    // API-dən gələn mesajı göstər (Azerbaijani/English)
                    $('#verifyMsg').text(
                        data.message || 'A verification link has been sent to your email address. Please verify your email before logging in.'
                    );
                    $('#verifyPanel').fadeIn(300);
                    return;
                }

                // ── 409 Conflict: Email artıq qeydiyyatdan keçib ──
                if (status === 409) {
                    setFieldError('email', 'This email is already registered. Please use a different email or sign in.');
                    showAlert('An account with this email already exists.', 'warning');
                    return;
                }

                // ── 400 Bad Request: Server-side validasiya xətaları ──
                if (status === 400 || (data && !data.success)) {
                    if (data.error && data.error.details && data.error.details.length) {
                        // Field-level xətaları hər inputun altında göstər
                        applyFieldErrors(data.error.details);
                        showAlert(data.error.message || 'Please correct the highlighted errors.', 'danger');
                    } else {
                        showAlert(
                            (data.error && data.error.message) || 'Registration failed. Please try again.',
                            'danger'
                        );
                    }
                    return;
                }

                // ── Gözlənilməz cavab ──
                showAlert('Unexpected response from server (HTTP ' + status + '). Please try again.', 'danger');
            })
            .catch(function (err) {
                setLoading(false);
                console.error('Register fetch error:', err);
                showAlert(
                    'Could not connect to the server. Please check your internet connection and try again.',
                    'danger'
                );
            });
    });

});
