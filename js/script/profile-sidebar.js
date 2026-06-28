/**
 * Profile Sidebar — rola uyğun sol menyunu qurur (candidate / employer / admin).
 * Change Password kimi paylaşılan səhifələrdə istifadə olunur ki, hər istifadəçi
 * öz profil bölməsinə uyğun menyunu görsün.
 *
 * Tələb olunan DOM: .candidate-info (profil kartı + <ul> menyu).
 */
$(document).ready(function ()
{
    var infoBox = $('.candidate-info').first();
    if (!infoBox.length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var role = 'candidate';
    var fullName = 'User';
    var avatarUrl = '';
    try
    {
        var user = JSON.parse(localStorage.getItem('user') || '{}');
        role = (user.role || 'candidate').toLowerCase();
        fullName = user.fullName || 'User';
        avatarUrl = user.avatarUrl || '';
    } catch (e) { /* default-lara düş */ }

    // Cari səhifə (active highlight üçün)
    var currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();

    // Rola uyğun menyu konfiqurasiyası
    var MENUS = {
        candidate: {
            defaultImg: 'images/team/pic1.jpg',
            subtitle: 'Candidate',
            backUrl: 'jobs-profile.html',
            items: [
                ['jobs-profile.html', 'far fa-user', 'Profile'],
                ['jobs-my-resume.html', 'far fa-file-alt', 'My Resume'],
                ['jobs-saved-jobs.html', 'far fa-heart', 'Saved Jobs'],
                ['jobs-applied-job.html', 'fa fa-briefcase', 'Applied Jobs'],
                ['jobs-alerts.html', 'far fa-bell', 'Job Alerts'],
                ['jobs-cv-manager.html', 'far fa-id-card', 'CV Manager'],
                ['jobs-change-password.html', 'fa fa-key', 'Change Password'],
                ['index.html', 'fas fa-sign-out-alt', 'Log Out']
            ]
        },
        employer: {
            defaultImg: 'images/logo/icon3.jpg',
            subtitle: 'Employer',
            backUrl: 'company-profile.html',
            items: [
                ['company-profile.html', 'far fa-user', 'Company Profile'],
                ['company-post-jobs.html', 'far fa-file-alt', 'Post A Job'],
                ['company-transactions.html', 'fa fa-random', 'Transactions'],
                ['company-manage-job.html', 'fa fa-briefcase', 'Manage jobs'],
                ['company-resume.html', 'far fa-id-card', 'Resume'],
                ['jobs-change-password.html', 'fa fa-key', 'Change Password'],
                ['index.html', 'fas fa-sign-out-alt', 'Log Out']
            ]
        },
        admin: {
            defaultImg: 'images/team/pic1.jpg',
            subtitle: 'Administrator',
            backUrl: 'admin-dashboard.html',
            items: [
                ['admin-dashboard.html', 'fa fa-th-large', 'Dashboard'],
                ['admin-users.html', 'far fa-user', 'Manage Users'],
                ['admin-companies.html', 'fa fa-building', 'Manage Companies'],
                ['admin-transactions.html', 'fa fa-random', 'Transactions'],
                ['admin-categories.html', 'fa fa-filter', 'Categories'],
                ['admin-messages.html', 'far fa-envelope', 'Messages'],
                ['admin-settings.html', 'fa fa-cog', 'Settings'],
                ['jobs-change-password.html', 'fa fa-key', 'Change Password'],
                ['index.html', 'fas fa-sign-out-alt', 'Log Out']
            ]
        }
    };

    var cfg = MENUS[role] || MENUS.candidate;

    // Menyunu yenidən qur
    var ul = infoBox.find('ul').first();
    if (ul.length)
    {
        var html = cfg.items.map(function (it)
        {
            var href = it[0], icon = it[1], label = it[2];
            var active = (href.toLowerCase() === currentPage) ? ' class="active"' : '';
            return '<li><a href="' + href + '"' + active + '>' +
                '<i class="' + icon + '" aria-hidden="true"></i> <span>' + label + '</span></a></li>';
        }).join('');
        ul.html(html);
    }

    // Profil adı / başlıq
    infoBox.find('.candidate-title h4 a').first().text(fullName);
    infoBox.find('.candidate-title p a').first().text(cfg.subtitle);

    // Avatar / logo
    var img = infoBox.find('.canditate-des > a img').first();
    var defImg = cfg.defaultImg;
    img.attr('onerror', "this.src='" + defImg + "'");
    if (avatarUrl) img.attr('src', avatarUrl);
    else img.attr('src', defImg);

    // Employer üçün şirkət adını/logosunu serverdən gətir
    if (role === 'employer')
    {
        apiFetch('/companies/me')
            .then(function (result)
            {
                if (result && result.success && result.data)
                {
                    var c = result.data;
                    if (c.name) infoBox.find('.candidate-title h4 a').first().text(c.name);
                    if (c.logoUrl)
                    {
                        var bust = c.logoUrl + (c.logoUrl.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
                        img.attr('src', bust);
                    }
                }
            })
            .catch(function () { /* sakitcə keç */ });
    }

    // "Back" düyməsini rola uyğun yönləndir
    $('.job-bx-title a.site-button').filter(function ()
    {
        return $(this).text().toLowerCase().indexOf('back') !== -1;
    }).attr('href', cfg.backUrl);

    // Log Out
    infoBox.find('a[href="index.html"]').filter(function ()
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
