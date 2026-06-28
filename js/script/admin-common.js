/**
 * Admin ümumi funksionallıq.
 * - Rol qoruması: yalnız "admin" rolu admin səhifələrinə girə bilər.
 * - Sidebar-da admin adını doldurur və Log Out idarə edir.
 *
 * Bu script BÜTÜN admin səhifələrində header/footer-dən ƏVVƏL yüklənməlidir
 * (api-client.js-dən sonra).
 */
(function ()
{
    // Rol qoruması — DOM hazır olmadan əvvəl yoxla
    var token = localStorage.getItem('accessToken');
    var userJson = localStorage.getItem('user');
    var user = null;
    try { user = userJson ? JSON.parse(userJson) : null; } catch (e) { user = null; }

    if (!token || !user)
    {
        window.location.href = 'login-3.html';
        return;
    }
    if (user.role !== 'admin')
    {
        // Admin deyil → öz səhifəsinə yönləndir
        if (user.role === 'employer')
        {
            window.location.href = 'company-profile.html';
        } else
        {
            window.location.href = 'index.html';
        }
        return;
    }

    // DOM hazır olduqda sidebar-ı qur
    $(document).ready(function ()
    {
        if (user.fullName)
        {
            $('.admin-info .candidate-title h4 a').first().text(user.fullName);
        }

        $('.admin-info a[href="index.html"]').filter(function ()
        {
            return $(this).text().toLowerCase().indexOf('log out') !== -1;
        }).on('click', function (e)
        {
            e.preventDefault();
            var accessToken = localStorage.getItem('accessToken');
            var refreshToken = localStorage.getItem('refreshToken');
            function clearAndGo()
            {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('rememberMe');
                window.location.href = 'index.html';
            }
            if (accessToken)
            {
                fetch(API_BASE_URL + '/auth/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
                    body: JSON.stringify({ refreshToken: refreshToken || '' })
                }).then(clearAndGo).catch(clearAndGo);
            } else
            {
                clearAndGo();
            }
        });
    });
})();
