/**
 * Employer dashboard sidebar — şirkət adını/loqosunu doldurur və Log Out bağlayır.
 * Employer səhifələrində istifadə olunur.
 */
$(document).ready(function ()
{
    // Şirkət məlumatını yüklə (GET /api/companies/me)
    if (localStorage.getItem('accessToken'))
    {
        apiFetch('/companies/me')
            .then(function (result)
            {
                if (result.success && result.data)
                {
                    var c = result.data;
                    if (c.name) $('.company-info .candidate-title h4 a').first().text(c.name);
                    if (c.logoUrl)
                    {
                        $('.company-info .canditate-des > a img').first()
                            .attr('src', c.logoUrl).attr('onerror', "this.src='images/logo/icon3.jpg'");
                    }
                }
            })
            .catch(function () { /* sakitcə keç */ });
    }

    // Sidebar Log Out
    $('.company-info a[href="index.html"]').filter(function ()
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
