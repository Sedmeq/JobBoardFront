/**
 * "Sign in with Google" — Google Identity Services (GIS) ilə.
 * login-3.html və register-3.html səhifələrində istifadə olunur.
 *
 * Tələblər:
 *   - google-config.js (GOOGLE_CLIENT_ID)
 *   - https://accounts.google.com/gsi/client (GIS kitabxanası)
 *   - #googleBtn konteyneri (Google düyməsi bura render olunur)
 *
 * Backend: POST /api/auth/google { idToken, role }
 */
(function ()
{
    var API_ROOT = (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : 'https://localhost:7135/api';

    function getRole()
    {
        // Register səhifəsində rol seçimi: #regRole və ya #googleRole, ya da #googleBtn[data-role]
        var reg = document.getElementById('regRole');
        if (reg && reg.value) return reg.value;
        var sel = document.getElementById('googleRole');
        if (sel && sel.value) return sel.value;
        var btn = document.getElementById('googleBtn');
        if (btn && btn.getAttribute('data-role')) return btn.getAttribute('data-role');
        return 'candidate';
    }

    function redirectByRole(role)
    {
        if (role === 'admin') window.location.href = 'admin-dashboard.html';
        else if (role === 'employer') window.location.href = 'company-profile.html';
        else window.location.href = 'index.html';
    }

    function showError(msg)
    {
        var el = document.getElementById('loginAlert')
            || document.getElementById('regAlert')
            || document.getElementById('registerAlert');
        if (el)
        {
            el.className = (el.id === 'regAlert' ? 'reg-alert ' : 'alert ') + 'alert-danger';
            el.innerHTML = msg;
            el.style.display = 'block';
        }
        else { alert(msg); }
    }

    function handleCredential(response)
    {
        var idToken = response && response.credential;
        if (!idToken) { showError('Google girişi alınmadı.'); return; }

        fetch(API_ROOT + '/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: idToken, role: getRole() })
        })
            .then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d }; }); })
            .then(function (res)
            {
                if (res.status === 200 && res.data && res.data.success)
                {
                    var t = res.data.data;
                    localStorage.setItem('accessToken', t.accessToken);
                    localStorage.setItem('refreshToken', t.refreshToken);
                    localStorage.setItem('user', JSON.stringify(t.user));
                    redirectByRole(t.user && t.user.role);
                }
                else
                {
                    var msg = (res.data && res.data.error && res.data.error.message) || 'Google ilə giriş alınmadı.';
                    showError(msg);
                }
            })
            .catch(function (err)
            {
                console.error('Google login error:', err);
                showError('Serverə qoşulmaq mümkün olmadı.');
            });
    }

    function init()
    {
        var btn = document.getElementById('googleBtn');
        if (!btn) return;

        if (typeof GOOGLE_CLIENT_ID === 'undefined' || !GOOGLE_CLIENT_ID)
        {
            btn.innerHTML = '<small style="color:#9aa1ad;">Google girişi konfiqurasiya edilməyib (google-config.js).</small>';
            return;
        }
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id)
        {
            return setTimeout(init, 500); // GIS hələ yüklənməyib
        }

        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredential
        });
        google.accounts.id.renderButton(btn, {
            theme: 'outline',
            size: 'large',
            width: btn.offsetWidth || 320,
            text: 'continue_with',
            shape: 'rectangular'
        });
    }

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', init);
    else
        init();
})();
