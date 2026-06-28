$(document).ready(function ()
{
    // Header-i yüklə
    $("#header-placeholder").load("components/header.html", function ()
    {
        console.log("Header yükləndi!");

        // Header yüklənəndən sonra dark mode-u yenidən işə sal
        // (çünki JobBoard.init() header DOM-dan əvvəl çağırılır)
        var version = getCookieVal('version');

        if (version == 'dark')
        {
            $('body').addClass('layout-dark');
            $('.layout-btn').addClass('active');
            $('.layout-btn input').attr('checked', 'checked');
        } else
        {
            $('body').removeClass('layout-dark');
            $('.layout-btn').removeClass('active');
        }

        // Dark mode düyməsinə click event qoş
        $('.layout-btn').off('click').on('click', function ()
        {
            $(this).toggleClass('active');
            if ($(this).hasClass('active'))
            {
                $('body').addClass('layout-dark');
                $('body').removeClass('layout-light');
                setDarkCookie('version', 'dark');
            } else
            {
                $('body').removeClass('layout-dark');
                setDarkCookie('version', 'light');
            }
        });

        // Navbar toggler yenidən işə sal
        $('.navicon').off('click').on('click', function ()
        {
            $(this).toggleClass('open');
        });

        // Sticky header scroll
        $(window).off('scroll.headerFix').on('scroll.headerFix', function ()
        {
            if ($('.sticky-header').length > 0)
            {
                var menu = $('.sticky-header');
                if ($(window).scrollTop() > menu.offset().top)
                {
                    menu.addClass('is-fixed');
                } else
                {
                    menu.removeClass('is-fixed');
                }
            }
        });

        // Menu position
        $(".header-nav li").each(function ()
        {
            if ($('ul', this).length)
            {
                var elm = $('ul:first', this);
                var off = elm.offset();
                var l = off.left;
                var w = elm.width();
                var docW = $("body").width();
                var isEntirelyVisible = (l + w <= docW);
                if (!isEntirelyVisible)
                {
                    $(this).find('.sub-menu:first').addClass('left');
                } else
                {
                    $(this).find('.sub-menu:first').removeClass('left');
                }
            }
        });

        // Check auth status and update header
        updateHeaderAuth();
    });

    // ─── Auth/Logout Funksionallığı ───────────────────────
    function updateHeaderAuth()
    {
        var accessToken = localStorage.getItem('accessToken');
        var userJson = localStorage.getItem('user');

        // Default: Admin menyusu həmişə gizli (yalnız admin üçün açılır)
        $('.nav-admin').hide();

        if (accessToken && userJson)
        {
            try
            {
                var user = JSON.parse(userJson);
                var fullName = user.fullName || "User";
                var role = user.role || "candidate";

                // ── Rola uyğun menyu görünürlüyü ──
                // Yalnız istifadəçinin roluna aid menyu göstərilir
                if (role === 'admin')
                {
                    $('.nav-candidate').hide();
                    $('.nav-employer').hide();
                    $('.nav-admin').show();
                } else if (role === 'employer')
                {
                    $('.nav-candidate').hide();
                    $('.nav-employer').show();
                    $('.nav-admin').hide();
                } else
                {
                    // candidate
                    $('.nav-candidate').show();
                    $('.nav-employer').hide();
                    $('.nav-admin').hide();
                }

                // ── Rola uyğun profil səhifəsi ──
                var profileUrl;
                if (role === 'admin')
                {
                    profileUrl = 'admin-dashboard.html';
                } else if (role === 'employer')
                {
                    profileUrl = 'company-profile.html';
                } else
                {
                    profileUrl = 'jobs-profile.html';
                }

                // Sign Up & Login düymələrini Profil & Logout ilə əvəzlə
                $('.header-signup-btn').replaceWith(
                    '<a href="' + profileUrl + '" class="site-button header-profile-btn" style="margin-right: 8px;">' +
                    '<i class="fa fa-user"></i> ' + fullName +
                    '</a>'
                );

                $('.header-login-btn').replaceWith(
                    '<a href="javascript:void(0);" class="site-button header-logout-btn" style="background-color: #dc3545; border-color: #dc3545; color: white;">' +
                    '<i class="fa fa-sign-out"></i> Logout' +
                    '</a>'
                );

                // Logout click event
                $('.header-logout-btn').off('click').on('click', function (e)
                {
                    e.preventDefault();
                    handleLogout();
                });

            } catch (e)
            {
                console.error("User json parsing error:", e);
            }
        } else
        {
            // ── Qonaq (login olmayan) ──
            // Yalnız public (əsas) menyular görünür.
            // Namizəd, işəgötürən və admin menyuları gizlədilir.
            $('.nav-candidate').hide();
            $('.nav-employer').hide();
            $('.nav-admin').hide();
        }
    }

    function handleLogout()
    {
        var API_BASE_URL = 'https://localhost:7135/api';
        var accessToken = localStorage.getItem('accessToken');
        var refreshToken = localStorage.getItem('refreshToken');

        function clearSessionAndRedirect()
        {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('rememberMe');
            window.location.href = 'index.html';
        }

        if (accessToken)
        {
            // Logout düyməsini loading halına salaq
            $('.header-logout-btn')
                .html('<i class="fa fa-spinner fa-spin"></i> Loading...')
                .css('pointer-events', 'none');

            fetch(API_BASE_URL + '/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + accessToken
                },
                body: JSON.stringify({
                    refreshToken: refreshToken || ""
                })
            })
                .then(function (response)
                {
                    clearSessionAndRedirect();
                })
                .catch(function (err)
                {
                    console.error('Logout request error:', err);
                    clearSessionAndRedirect(); // Xəta olsa belə lokal silib yönləndiririk
                });
        } else
        {
            clearSessionAndRedirect();
        }
    }

    // Footer-i yüklə
    $("#footer-placeholder").load("components/footer.html", function ()
    {
        console.log("Footer yükləndi!");
    });
});

// Cookie oxuma köməkçi funksiyası
function getCookieVal(cname)
{
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++)
    {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

// Cookie yazan köməkçi funksiya
function setDarkCookie(cname, cvalue)
{
    var d = new Date();
    d.setTime(d.getTime() + (30 * 60 * 1000));
    var expires = "expires=" + d.toString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}