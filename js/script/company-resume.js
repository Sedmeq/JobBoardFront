/**
 * Company Resume (Employer) — müraciət edənlərin CV-lərini vakansiyaya görə göstərir.
 * - "All vacancies": bütün elanlara müraciət edən namizədlər (təkrarsız).
 * - Konkret vakansiya seçiləndə: yalnız o elana gəlmiş CV-lər + vakansiyaya keçid.
 * Backend:
 *   GET /api/jobs/my?page=1&pageSize=100        (vakansiya filtri üçün)
 *   GET /api/applications/applicants            (bütün müraciət edənlər)
 *   GET /api/jobs/{jobId}/applicants            (konkret vakansiyanın müraciətləri)
 * CV: cv-view.html?id=<userId>
 */
$(document).ready(function ()
{
    var container = $('#resumeCandidatesBody');
    if (!container.length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var pagination = $('#resumePagination');
    var foundLabel = $('#resumeFoundLabel');
    var jobFilter = $('#resumeJobFilter');
    var viewVacancyBtn = $('#viewVacancyBtn');
    var currentPage = 1;
    var pageSize = 8;

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

    function skillTags(skills)
    {
        if (!skills || !skills.length) return '';
        return skills.slice(0, 5).map(function (s)
        {
            return '<a href="javascript:void(0);"><span>' + esc(s) + '</span></a>';
        }).join('');
    }

    // Vahid kart render (normallaşdırılmış obyekt)
    function renderCard(c)
    {
        var avatar = c.avatarUrl ? esc(c.avatarUrl) : 'images/testimonials/pic1.jpg';
        var resumeFileBtn = c.resumeUrl
            ? '<a href="' + esc(c.resumeUrl) + '" target="_blank" download class="site-button button-sm" style="background:#3a4150;"><i class="fa fa-download"></i> Resume File</a>'
            : '';
        // Konkret vakansiya görünüşündə müraciətə cavab (söhbət) düyməsi
        var respondBtn = c.applicationId
            ? '<a href="javascript:void(0);" class="site-button button-sm" data-chat-app="' + c.applicationId + '" style="background:#1c8a55;border-color:#1c8a55;"><i class="fa fa-comments"></i> Respond</a>'
            : '';
        container.append(
            '<li class="col-lg-6 col-md-6">' +
            '<div class="post-bx">' +
            '<div class="d-flex m-b20">' +
            '<div class="job-post-company me-3"><span>' +
            '<img alt="" src="' + avatar + '" onerror="this.src=\'images/testimonials/pic1.jpg\'" ' +
            'style="width:54px;height:54px;border-radius:50%;object-fit:cover;"></span></div>' +
            '<div class="job-post-info">' +
            '<h5 class="m-b0"><a href="cv-view.html?id=' + c.id + '" target="_blank">' + esc(c.fullName || 'Candidate') + '</a></h5>' +
            '<p class="m-b5 font-13"><a href="javascript:void(0);" class="text-primary">' + esc(c.headline || 'Professional') + '</a></p>' +
            '<ul>' +
            '<li><i class="fas fa-map-marker-alt"></i> ' + esc(c.location || 'N/A') + '</li>' +
            '<li><i class="far fa-clock"></i> ' + (c.experienceYears != null ? c.experienceYears + ' yrs' : 'N/A') + '</li>' +
            '</ul>' +
            '</div>' +
            '</div>' +
            '<div class="job-time m-t15 m-b10">' + skillTags(c.skills) + '</div>' +
            (c.extraLine ? '<p class="font-12 text-muted m-b10">' + c.extraLine + '</p>' : '') +
            '<div class="d-flex" style="gap:8px;flex-wrap:wrap;">' +
            '<a href="cv-view.html?id=' + c.id + '" target="_blank" class="site-button button-sm">' +
            '<i class="far fa-id-card"></i> View CV</a>' +
            '<a href="cv-view.html?id=' + c.id + '" target="_blank" class="site-button button-sm" style="background:#2e55fa;">' +
            '<i class="fa fa-download"></i> Download PDF</a>' +
            resumeFileBtn + respondBtn +
            '</div>' +
            '</div>' +
            '</li>'
        );
    }

    // Müraciətə cavab ver (söhbət aç) — event delegation
    container.on('click', '[data-chat-app]', function ()
    {
        var appId = $(this).attr('data-chat-app');
        var btn = $(this);
        btn.css('pointer-events', 'none').html('<i class="fa fa-spinner fa-spin"></i>');
        apiFetch('/chats', { method: 'POST', body: JSON.stringify({ applicationId: parseInt(appId) }) })
            .then(function (res)
            {
                var id = res && res.data && res.data.id;
                window.location.href = 'chat.html?conversation=' + id;
            })
            .catch(function (err)
            {
                btn.css('pointer-events', 'auto').html('<i class="fa fa-comments"></i> Respond');
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Söhbət açıla bilmədi.';
                alert(msg);
            });
    });

    function showEmpty(jobId)
    {
        foundLabel.text('0 Applicant Resumes');
        var msg = jobId
            ? 'Bu vakansiyaya hələ müraciət edən namizəd yoxdur.'
            : 'Sizin elanlarınıza hələ müraciət edən namizəd yoxdur.';
        container.html('<li class="text-center p-a30"><h5>No applicants yet</h5><p class="text-muted">' + msg + '</p></li>');
    }

    function loading()
    {
        container.html('<li class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i><p class="m-t10">Loading applicant resumes...</p></li>');
        pagination.empty();
        foundLabel.text('Loading...');
    }

    function fetchAll(page)
    {
        currentPage = page || 1;
        loading();
        apiFetch('/applications/applicants?page=' + currentPage + '&pageSize=' + pageSize)
            .then(function (result)
            {
                container.empty();
                var data = (result && result.data) || {};
                if (!data.items || !data.items.length) { showEmpty(null); return; }
                foundLabel.text(data.totalCount + ' Applicant Resumes');
                data.items.forEach(function (c)
                {
                    renderCard({
                        id: c.id, fullName: c.fullName, avatarUrl: c.avatarUrl,
                        headline: c.headline, location: c.location, experienceYears: c.experienceYears,
                        resumeUrl: c.resumeUrl, skills: c.skills,
                        extraLine: (c.appliedJobsCount || 1) + ' application(s) · Last applied ' + timeAgo(c.lastAppliedAt)
                    });
                });
                renderPagination(data.pageCount, data.hasNextPage, fetchAll);
            })
            .catch(handleError);
    }

    function fetchByJob(jobId, page)
    {
        currentPage = page || 1;
        loading();
        apiFetch('/jobs/' + encodeURIComponent(jobId) + '/applicants?page=' + currentPage + '&pageSize=' + pageSize)
            .then(function (result)
            {
                container.empty();
                var data = (result && result.data) || {};
                if (!data.items || !data.items.length) { showEmpty(jobId); return; }
                foundLabel.text(data.totalCount + ' Applicant Resume(s) for this vacancy');
                data.items.forEach(function (app)
                {
                    var c = app.candidate || {};
                    renderCard({
                        id: c.id, fullName: c.fullName, avatarUrl: c.avatarUrl,
                        headline: c.headline, location: c.location, experienceYears: c.experienceYears,
                        resumeUrl: c.resumeUrl, skills: null,
                        applicationId: app.id,
                        extraLine: 'Status: <strong style="text-transform:capitalize;">' + esc(app.status) + '</strong> · Applied ' + timeAgo(app.appliedAt)
                    });
                });
                renderPagination(data.pageCount, data.hasNextPage, function (p) { fetchByJob(jobId, p); });
            })
            .catch(handleError);
    }

    function handleError(err)
    {
        console.error('Resume fetch error:', err);
        foundLabel.text('Error');
        if (err && err.status === 403)
            container.html('<li class="text-center p-a30"><p class="text-danger">Only employers can view applicant resumes.</p></li>');
        else
            container.html('<li class="text-center p-a30"><p class="text-danger">Failed to load. Please try again.</p></li>');
    }

    function refresh()
    {
        var jobId = jobFilter.val();
        if (jobId)
        {
            viewVacancyBtn.attr('href', 'job-detail.html?id=' + jobId).show();
            fetchByJob(jobId, 1);
        }
        else
        {
            viewVacancyBtn.hide();
            fetchAll(1);
        }
    }

    function renderPagination(pageCount, hasNextPage, goFn)
    {
        pagination.empty();
        if (!pageCount || pageCount <= 1) return;
        pagination.append('<li class="previous ' + (currentPage === 1 ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage - 1) + '"><i class="ti-arrow-left"></i> Prev</a></li>');
        for (var i = 1; i <= pageCount; i++)
        {
            pagination.append('<li class="' + (i === currentPage ? 'active' : '') + '"><a href="javascript:void(0);" data-page="' + i + '">' + i + '</a></li>');
        }
        pagination.append('<li class="next ' + (!hasNextPage ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage + 1) + '">Next <i class="ti-arrow-right"></i></a></li>');
        pagination.find('a').off('click').on('click', function (e)
        {
            e.preventDefault();
            var p = parseInt($(this).attr('data-page'));
            if (p && p !== currentPage && p >= 1 && p <= pageCount) goFn(p);
        });
    }

    // Vakansiya filtri üçün bootstrap-select widget-ini yenilə.
    // custom.js handleBootstrapSelect window "load" anında select-i widget-ə çevirir;
    // dublikat yaranmaması üçün yeniləməni ondan sonra işə salırıq.
    function refreshJobFilterPicker()
    {
        if (!$.fn.selectpicker) return;
        var doRefresh = function ()
        {
            if (jobFilter.data('selectpicker')) jobFilter.selectpicker('destroy');
            jobFilter.selectpicker();
        };
        if (document.readyState === 'complete') doRefresh();
        else $(window).on('load', doRefresh);
    }

    // Vakansiya filtrini doldur
    function loadVacancies()
    {
        apiFetch('/jobs/my?page=1&pageSize=100')
            .then(function (result)
            {
                var items = (result && result.data && result.data.items) || [];
                items.forEach(function (j)
                {
                    var count = j.applicationCount != null ? j.applicationCount : 0;
                    jobFilter.append('<option value="' + j.id + '">' + esc(j.title) + ' (' + count + ')</option>');
                });
                // bootstrap-select (custom.js) bu select-i widget-ə çevirir; asinxron
                // əlavə olunan option-ların görünməsi üçün widget-i yeniləyirik.
                refreshJobFilterPicker();
            })
            .catch(function (err) { console.error('Vacancies load error:', err); });
    }

    jobFilter.on('change', refresh);

    loadVacancies();
    fetchAll(1);
});
