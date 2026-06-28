/**
 * Candidate dashboard sidebar — logged-in istifadəçinin adını/avatarını doldurur
 * və "Log Out" linkinə çıxış funksiyası bağlayır.
 * Candidate səhifələrində istifadə olunur (jobs-profile, jobs-applied-job, jobs-saved-jobs və s.)
 */
$(document).ready(function ()
{
    var userJson = localStorage.getItem('user');
    if (userJson)
    {
        try
        {
            var user = JSON.parse(userJson);
            var nameEl = $('.candidate-info .candidate-title h4 a').first();
            if (nameEl.length && user.fullName) nameEl.text(user.fullName);

            var avatar = $('.candidate-info .canditate-des > a img').first();
            if (avatar.length && user.avatarUrl)
            {
                avatar.attr('src', user.avatarUrl).attr('onerror', "this.src='images/team/pic1.jpg'");
            }
        } catch (e)
        {
            console.error('Sidebar user parse error:', e);
        }
    }

    // Sidebar Log Out
    $('.candidate-info a[href="index.html"]').filter(function ()
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
