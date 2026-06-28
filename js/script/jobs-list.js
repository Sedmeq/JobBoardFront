/**
 * Job listing (list-style) integration.
 * Dokumentasiya: GET /api/jobs (keyword, location, jobType, sortBy, page, pageSize)
 * Səhifələrdə istifadə olunur: browse-job-list.html, browse-job-filter-list.html
 */
$(document).ready(function ()
{
    var container = $('#listJobsContainer');
    if (!container.length) return;

    var pagination = $('#listJobsPagination');
    var foundLabel = $('#listJobsFoundLabel');
    var isGrid = container.hasClass('browse-job-grid') || container.attr('data-layout') === 'grid';
    var currentPage = 1;
    var pageSize = 8;

    function safeVal(sel)
    {
        var el = $(sel);
        return el.length ? (el.val() || '') : '';
    }

    // URL parametrlərini oxu
    var params = new URLSearchParams(window.location.search);
    $('#listSearchKeyword').val(params.get('keyword') || '');
    $('#listSearchLocation').val(params.get('location') || '');

    function timeAgo(d)
    {
        if (!d) return '';
        var s = Math.floor((new Date() - new Date(d)) / 1000);
        if (s < 60) return 'Just now';
        var m = Math.floor(s / 60); if (m < 60) return m + ' minutes ago';
        var h = Math.floor(m / 60); if (h < 24) return h + ' hours ago';
        var days = Math.floor(h / 24); return days === 1 ? 'Yesterday' : days + ' days ago';
    }

    function formatSalary(job)
    {
        if (!job.isSalaryVisible || (!job.salaryMin && !job.salaryMax)) return 'Salary Negotiable';
        var c = job.salaryCurrency || 'AZN';
        if (job.salaryMin && job.salaryMax) return job.salaryMin + ' - ' + job.salaryMax + ' ' + c;
        return (job.salaryMin || job.salaryMax) + ' ' + c;
    }

    function escapeHtml(t)
    {
        return $('<div>').text(t == null ? '' : t).html();
    }

    function fetchJobs(page)
    {
        currentPage = page || 1;
        var keyword = safeVal('#listSearchKeyword').trim();
        var location = safeVal('#listSearchLocation').trim();
        var jobType = safeVal('#listSearchJobType');
        var sortBy = safeVal('#listSortBy') || 'newest';

        container.html('<li class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i><p class="m-t10">Loading jobs...</p></li>');
        pagination.empty();
        foundLabel.text('Loading Jobs...');

        var q = ['page=' + currentPage, 'pageSize=' + pageSize, 'sortBy=' + sortBy];
        if (keyword) q.push('keyword=' + encodeURIComponent(keyword));
        if (location) q.push('location=' + encodeURIComponent(location));
        if (jobType) q.push('jobType=' + encodeURIComponent(jobType));

        apiFetch('/jobs?' + q.join('&'))
            .then(function (result)
            {
                container.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    foundLabel.text('0 Jobs Found');
                    container.html('<li class="text-center p-a30"><h4>No matching jobs found</h4><p class="text-muted">Try adjusting your search filters.</p></li>');
                    return;
                }
                var data = result.data;
                foundLabel.text(data.totalCount + ' Jobs Found');

                data.items.forEach(function (job)
                {
                    var companyName = (job.company && job.company.name) || 'Company';
                    var logo = (job.company && job.company.logoUrl) || 'images/logo/icon1.png';
                    var liOpen = isGrid ? '<li class="col-lg-4 col-md-6">' : '<li>';
                    container.append(
                        liOpen +
                        '<div class="post-bx">' +
                        '<div class="d-flex m-b30">' +
                        '<div class="job-post-company"><a href="javascript:void(0);"><span>' +
                        '<img alt="' + escapeHtml(companyName) + '" src="' + logo + '" onerror="this.src=\'images/logo/icon1.png\'" />' +
                        '</span></a></div>' +
                        '<div class="job-post-info">' +
                        '<h4><a href="job-detail.html?id=' + job.id + '">' + escapeHtml(job.title) + '</a></h4>' +
                        '<ul>' +
                        '<li><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(job.location || 'Remote') + '</li>' +
                        '<li><i class="far fa-bookmark"></i> ' + escapeHtml(job.jobType || 'Full Time') + '</li>' +
                        '<li><i class="far fa-clock"></i> Published ' + timeAgo(job.createdAt) + '</li>' +
                        '</ul>' +
                        '</div>' +
                        '</div>' +
                        '<div class="d-flex">' +
                        '<div class="job-time me-auto"><a href="javascript:void(0);"><span>' + escapeHtml(job.jobType || 'Full Time') + '</span></a></div>' +
                        '<div class="salary-bx"><span>' + formatSalary(job) + '</span></div>' +
                        '</div>' +
                        '<label class="like-btn"><input type="checkbox" ' + (job.isSaved ? 'checked' : '') + ' data-save-job-id="' + job.id + '"><span class="checkmark"></span></label>' +
                        '</div>' +
                        '</li>'
                    );
                });

                setupSaveHandler();
                renderPagination(data.pageCount, data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Jobs fetch error:', err);
                foundLabel.text('Search Failed');
                container.html('<li class="text-center p-a30"><p class="text-danger">Failed to load jobs. Please try again.</p></li>');
            });
    }

    function setupSaveHandler()
    {
        $('.like-btn input').off('change').on('change', function ()
        {
            var jobId = $(this).attr('data-save-job-id');
            var isSaved = $(this).is(':checked');
            if (!localStorage.getItem('accessToken'))
            {
                window.location.href = 'login-3.html';
                return;
            }
            var endpoint = isSaved ? '/jobs/' + jobId + '/save' : '/jobs/' + jobId + '/unsave';
            apiFetch(endpoint, { method: 'POST' }).catch(function (e) { console.error('Save job error:', e); });
        });
    }

    function renderPagination(pageCount, hasNextPage)
    {
        pagination.empty();
        if (pageCount <= 1) return;
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
            if (p && p !== currentPage && p >= 1 && p <= pageCount)
            {
                fetchJobs(p);
                $('html, body').animate({ scrollTop: 0 }, 300);
            }
        });
    }

    $('#listSearchForm').on('submit', function (e) { e.preventDefault(); fetchJobs(1); });
    $('#listSortBy').on('change', function () { fetchJobs(1); });

    fetchJobs(1);
});
