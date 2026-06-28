/**
 * Candidate Profile integration.
 * Dokumentasiya:
 *   GET /api/candidates/me
 *   PUT /api/candidates/me  { headline, summary, location, website, linkedInUrl,
 *                             githubUrl, experienceYears, currentPosition, expectedSalary, isAvailable }
 */
$(document).ready(function ()
{
    var form = $('#candidateProfileForm');
    if (!form.length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var alertEl = $('#profileAlert');

    function showAlert(msg, type)
    {
        alertEl.removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert-' + (type || 'info')).html(msg).slideDown(200);
        if (type !== 'success') setTimeout(function () { alertEl.slideUp(200); }, 6000);
    }

    function loadProfile()
    {
        apiFetch('/candidates/me')
            .then(function (result)
            {
                $('#profileLoading').hide();
                form.show();
                if (!result.success || !result.data) return;
                var p = result.data;
                $('#profFullName').val(p.fullName || '');
                $('#profEmail').val(p.email || '');
                $('#profHeadline').val(p.headline || '');
                $('#profCurrentPosition').val(p.currentPosition || '');
                $('#profExperienceYears').val(p.experienceYears != null ? p.experienceYears : '');
                $('#profExpectedSalary').val(p.expectedSalary || '');
                $('#profIsAvailable').val(p.isAvailable ? 'true' : 'false');
                $('#profSummary').val(p.summary || '');
                $('#profLocation').val(p.location || '');
                $('#profWebsite').val(p.website || '');
                $('#profLinkedIn').val(p.linkedInUrl || '');
                $('#profGithub').val(p.githubUrl || '');

                // Sidebar adı/başlığı yenilə
                if (p.fullName) $('.candidate-info .candidate-title h4 a').first().text(p.fullName);
                if (p.headline) $('.candidate-info .candidate-title p a').first().text(p.headline);

                // Sol-yuxarı profil kartında avatarı göstər
                if (p.avatarUrl)
                {
                    var bust = p.avatarUrl + (p.avatarUrl.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
                    $('.candidate-info .canditate-des > a img').first()
                        .attr('src', bust).attr('onerror', "this.src='images/team/pic1.jpg'");

                    // localStorage-dakı user.avatarUrl-i sinxronlaşdır ki, header/sidebar-da da görünsün
                    try
                    {
                        var userJson = localStorage.getItem('user');
                        if (userJson)
                        {
                            var user = JSON.parse(userJson);
                            user.avatarUrl = p.avatarUrl;
                            localStorage.setItem('user', JSON.stringify(user));
                        }
                    } catch (e) { /* sakitcə keç */ }
                }
            })
            .catch(function (err)
            {
                $('#profileLoading').hide();
                form.show();
                console.error('Profile load error:', err);
                showAlert('Could not load your profile. You can still update and save.', 'warning');
            });
    }

    form.on('submit', function (e)
    {
        e.preventDefault();
        $('#profileSpinner').show();
        $('#profileSaveBtn').prop('disabled', true);

        var payload = {
            headline: $('#profHeadline').val().trim(),
            summary: $('#profSummary').val().trim(),
            location: $('#profLocation').val().trim(),
            website: $('#profWebsite').val().trim(),
            linkedInUrl: $('#profLinkedIn').val().trim(),
            githubUrl: $('#profGithub').val().trim(),
            experienceYears: parseInt($('#profExperienceYears').val()) || 0,
            currentPosition: $('#profCurrentPosition').val().trim(),
            expectedSalary: $('#profExpectedSalary').val().trim(),
            isAvailable: $('#profIsAvailable').val() === 'true'
        };

        apiFetch('/candidates/me', { method: 'PUT', body: JSON.stringify(payload) })
            .then(function (result)
            {
                $('#profileSpinner').hide();
                $('#profileSaveBtn').prop('disabled', false);
                showAlert('Your profile has been updated successfully.', 'success');
                if ($('#profHeadline').val()) $('.candidate-info .candidate-title p a').first().text($('#profHeadline').val());
            })
            .catch(function (err)
            {
                $('#profileSpinner').hide();
                $('#profileSaveBtn').prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to update profile. Please try again.';
                showAlert(msg, 'danger');
            });
    });

    // ─── Profil şəkli (avatar) yükləmə ───────────────────────
    // Sol kartdakı kamera ikonu (.update-flie) ilə şəkil seç → POST /candidates/me/avatar
    $('.candidate-info .update-flie').on('change', function ()
    {
        var file = this.files && this.files[0];
        if (!file) return;

        var avatarImg = $('.candidate-info .canditate-des > a img').first();
        // dərhal preview
        avatarImg.attr('src', URL.createObjectURL(file));

        var fd = new FormData();
        fd.append('file', file);

        apiFetch('/candidates/me/avatar', { method: 'POST', body: fd })
            .then(function (result)
            {
                var url = result && result.data && result.data.url;
                if (url)
                {
                    var bust = url + (url.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
                    avatarImg.attr('src', bust).attr('onerror', "this.src='images/team/pic1.jpg'");
                    // localStorage user.avatarUrl-i yenilə (header/sidebar/CV üçün)
                    try
                    {
                        var u = JSON.parse(localStorage.getItem('user') || '{}');
                        u.avatarUrl = url;
                        localStorage.setItem('user', JSON.stringify(u));
                    } catch (e) { /* keç */ }
                }
                showAlert('Profile photo updated successfully.', 'success');
            })
            .catch(function (err)
            {
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Could not upload photo. Please try again.';
                showAlert(msg, 'danger');
            });
    });

    // ─── Müraciət etdiyi elanlar ─────────────────────────────
    function statusBadge(status)
    {
        var map = {
            pending: 'text-primary', reviewing: 'text-info', shortlisted: 'text-warning',
            interview: 'text-warning', offered: 'text-success', rejected: 'text-danger',
            withdrawn: 'text-muted'
        };
        var cls = map[status] || 'text-primary';
        return '<span class="' + cls + '" style="text-transform:capitalize;font-weight:600;">' + esc(status) + '</span>';
    }

    function esc(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function timeAgo(d)
    {
        if (!d) return '';
        var s = Math.floor((new Date() - new Date(d)) / 1000);
        if (s < 60) return 'just now';
        var m = Math.floor(s / 60); if (m < 60) return m + ' min ago';
        var h = Math.floor(m / 60); if (h < 24) return h + ' h ago';
        var days = Math.floor(h / 24); return days === 1 ? 'yesterday' : days + ' days ago';
    }

    function loadApplications()
    {
        var body = $('#myApplicationsBody');
        if (!body.length) return;

        apiFetch('/applications/my?page=1&pageSize=5')
            .then(function (result)
            {
                body.empty();
                var items = (result && result.data && result.data.items) || [];
                if (!items.length)
                {
                    body.html('<li class="text-center p-a20"><p class="text-muted m-b10">You haven\'t applied to any jobs yet.</p>' +
                        '<a href="browse-job-list.html" class="site-button button-sm">Browse Jobs</a></li>');
                    return;
                }
                items.forEach(function (app)
                {
                    var job = app.job || {};
                    body.append(
                        '<li>' +
                        '<div class="post-bx">' +
                        '<div class="job-post-info m-a0">' +
                        '<h5 class="m-b0"><a href="job-detail.html?id=' + job.id + '">' + esc(job.title || 'Job') + '</a></h5>' +
                        '<ul class="m-b0">' +
                        '<li><i class="fas fa-building"></i> ' + esc(job.companyName || 'Company') + '</li>' +
                        (job.location ? '<li><i class="fas fa-map-marker-alt"></i> ' + esc(job.location) + '</li>' : '') +
                        '<li><i class="far fa-clock"></i> ' + timeAgo(app.appliedAt) + '</li>' +
                        '<li>Status: ' + statusBadge(app.status) + '</li>' +
                        '</ul>' +
                        '</div>' +
                        '</div>' +
                        '</li>'
                    );
                });
            })
            .catch(function (err)
            {
                console.error('Applications load error:', err);
                body.html('<li class="text-center p-a20"><p class="text-danger">Could not load your applications.</p></li>');
            });
    }

    loadProfile();
    loadApplications();
});
